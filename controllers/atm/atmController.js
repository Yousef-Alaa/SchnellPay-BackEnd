const sql = require("mssql");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { poolPromise } = require("../../config/db");
const AppError = require("../../utils/appError");
const asyncWrapper = require("../../middleware/asyncWrapper");
const { findByUsername, findByPhone } = require("../../models/userModel");
const {
  deductBalance,
  addBalance,
  getWalletByUserId,
} = require("../../models/walletModel");
const { createAtmTransaction } = require("../../models/transactionModel");
const { sendOtpEmail } = require("../../utils/atmMailer");
const { saveAtmCode } = require("../../models/atmModel");
const { createNotification } = require("../../utils/notificationHelper");

// ─── Constants ───────────────────────────────────────────────────────────────────
const MAX_DEPOSIT = 50_000;
const MAX_WITHDRAW = 20_000;
const OTP_EXPIRY_MINUTES = 10;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();
const generateReference = () =>
  `ATM-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

// Verify credentials and return { user, wallet }
const resolveUser = async (phone, atm_code, next) => {
  if (!phone || !atm_code)
    return next(
      AppError.create("phone and ATM code are required.", 400, false),
    );

  if (!/^\d{6}$/.test(atm_code))
    return next(
      AppError.create("ATM code must be exactly 6 digits.", 400, false),
    );

  const user = await findByPhone(phone);

  if (!user) return next(AppError.create("Invalid credentials.", 401, false));

  const matched = await bcrypt.compare(atm_code, user.atm_code);

  if (!matched || new Date(user.atmcode_expired) >= new Date())
    return next(AppError.create("Invalid Code", 401, false));

  const wallet = await getWalletByUserId(user.user_id);

  if (!wallet)
    return next(
      AppError.create("Wallet not found for this account.", 404, false),
    );

  if (wallet.wallet_status !== "active")
    return next(AppError.create("Wallet is suspended.", 403, false));

  return { user, wallet };
};

// ─── Controllers ─────────────────────────────────────────────────────────────

// @desc  Send a code to user via email to use it in ATM
// @route POST /api/v1/atm/generate-pin
// @access Public
const generatePin = asyncWrapper(async (req, res, next) => {
  const { phone } = req.body;
  const user = await findByPhone(phone);
  if (!user) {
    return next(
      AppError.create(
        "User with this phone number does not exist.",
        404,
        false,
      ),
    );
  }

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  const hashedOtp = await bcrypt.hash(otp, 10);

  await saveAtmCode(user.user_id, hashedOtp, expiresAt);
  await sendOtpEmail(user.email, user.f_name, otp);

  return res.status(200).json({
    status: "success",
    message: `A 6-digit verification code has been sent to your mail.`,
  });
});

// @desc  returns account info and current balance.
// @route POST /api/v1/atm/verify
// @access Public
const verifyAtm = asyncWrapper(async (req, res, next) => {
  const { phone, atm_code } = req.body;

  const result = await resolveUser(phone, atm_code, next);

  const { user, wallet } = result;

  createNotification(
    user.user_id,
    "ATM Accessed",
    `Your account was accessed via ATM verification. If this wasn't you, please contact support immediately.`,
    "ATM",
    user.email,
  );

  res.status(200).json({
    status: "success",
    message: "ATM verification successful.",
    data: {
      user: {
        phone,
        name: `${user.f_name} ${user.l_name}`,
      },
      wallet: {
        balance: wallet.balance,
        currency: wallet.currency,
      },
    },
  });
});

// @desc Adds funds to the wallet
// @route POST /api/v1/atm/deposit
// @access Public
const deposit = asyncWrapper(async (req, res, next) => {
  const { phone, atm_code, amount } = req.body;

  const { user, wallet } = await resolveUser(phone, atm_code, next);

  const parsedAmount = parseFloat(amount);

  if (!amount || isNaN(parsedAmount) || parsedAmount <= 0)
    return next(
      AppError.create("Amount must be a positive number.", 400, false),
    );

  if (parsedAmount > MAX_DEPOSIT) {
    return next(
      AppError.create(
        `Single deposit cannot exceed ${MAX_DEPOSIT.toLocaleString()}.`,
        400,
        false,
      ),
    );
  }

  const pool = await poolPromise;
  const dbTx = new sql.Transaction(pool);
  const reference = generateReference();

  await dbTx.begin();
  try {
    const rowsUpdated = await addBalance(dbTx, user.user_id, parsedAmount);

    if (rowsUpdated === 0) {
      await dbTx.rollback();
      return next(
        AppError.create("Failed to update wallet balance.", 500, false),
      );
    }

    await createAtmTransaction(
      dbTx,
      user.user_id,
      parsedAmount,
      "deposit",
      reference,
    );
    await dbTx.commit();
  } catch (err) {
    await dbTx.rollback();
    next(err);
  }

  const updatedWallet = await getWalletByUserId(user.user_id);
  createNotification(
    user.user_id,
    "ATM Deposit Successful",
    `Success! EGP ${parsedAmount} has been deposited into your wallet via ATM. Reference: ${reference}. Current balance: ${updatedWallet.balance} ${updatedWallet.currency}.`,
    "ATM",
    user.email,
  );

  res.status(200).json({
    status: "success",
    message: "Deposit successful.",
    data: {
      reference,
      amount: parsedAmount,
      currency: wallet.currency,
      new_balance: updatedWallet.balance,
    },
  });
});

// @desc Deducts funds from the wallet
// @route POST /api/v1/atm/withdraw
// @access Public
const withdraw = asyncWrapper(async (req, res, next) => {
  const { phone, atm_code, amount } = req.body;

  const result = await resolveUser(phone, atm_code, next);

  const parsedAmount = parseFloat(amount);

  if (!amount || isNaN(parsedAmount) || parsedAmount <= 0)
    return next(
      AppError.create("Amount must be a positive number.", 400, false),
    );

  if (parsedAmount > MAX_WITHDRAW) {
    return next(
      AppError.create(
        `Single withdrawal cannot exceed ${MAX_WITHDRAW.toLocaleString()}.`,
        400,
        false,
      ),
    );
  }

  const { user, wallet } = result;

  if (wallet.balance < parsedAmount) {
    return next(
      AppError.create(
        `Insufficient balance. Available: ${wallet.balance} ${wallet.currency}.`,
        400,
        false,
      ),
    );
  }

  const pool = await poolPromise;
  const dbTx = new sql.Transaction(pool);
  const reference = generateReference();

  await dbTx.begin();
  try {
    // deductBalance checks balance >= amount atomically in SQL (race-condition safe)
    const rowsUpdated = await deductBalance(dbTx, user.user_id, parsedAmount);
    if (rowsUpdated === 0) {
      await dbTx.rollback();
      return next(AppError.create("Insufficient balance.", 400, false));
    }

    await createAtmTransaction(
      dbTx,
      user.user_id,
      parsedAmount,
      "withdraw",
      reference,
    );
    await dbTx.commit();
  } catch (err) {
    await dbTx.rollback();
    next(err);
  }

  const updatedWallet = await getWalletByUserId(user.user_id);

  createNotification(
    user.user_id,
    "ATM Withdrawal Successful",
    `Confirming a withdrawal of EGP ${parsedAmount} from your wallet via ATM. Reference: ${reference}. Remaining balance: ${updatedWallet.balance} ${updatedWallet.currency}. If this wasn't you, contact support immediately.`,
    "ATM",
    user.email,
  );

  res.status(200).json({
    status: "success",
    message: "Withdrawal successful.",
    data: {
      reference,
      amount: parsedAmount,
      currency: wallet.currency,
      new_balance: updatedWallet.balance,
    },
  });
});

module.exports = { generatePin, verifyAtm, deposit, withdraw };
