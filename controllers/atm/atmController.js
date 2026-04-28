const sql = require("mssql");
const crypto = require("crypto");
const { poolPromise } = require("../../config/db");
const AppError = require("../../utils/appError");
const asyncWrapper = require("../../middleware/asyncWrapper");
const { findByUsername } = require("../../models/userModel");
const { deductBalance, addBalance, getWalletByUserId } = require("../../models/walletModel");
const { createAtmTransaction } = require("../../models/transactionModel");

// ─── Limits ───────────────────────────────────────────────────────────────────

const MAX_DEPOSIT  = 50_000;
const MAX_WITHDRAW = 20_000;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const generateReference = () =>
    `ATM-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

// Verify credentials and return { user, wallet }
const resolveUser = async (username, atm_code, next) => {
    
    if (!username || !atm_code) 
        return next(AppError.create("Username and ATM code are required.", 400, false));

    if (!/^\d{6}$/.test(atm_code)) 
        return next(AppError.create("ATM code must be exactly 6 digits.", 400, false));

    const user = await findByUsername(username);
    
    if (!user || user.atm_code != atm_code) // TODO verify using bcrypt
        return next(AppError.create("Invalid credentials or ATM code expired.", 401, false));

    const wallet = await getWalletByUserId(user.user_id);
    
    if (!wallet) 
        return next(AppError.create("Wallet not found for this account.", 404, false));
    

    if (wallet.wallet_status !== "active") 
        return next(AppError.create("Wallet is suspended.", 403, false));

    return { user, wallet };
};

// ─── Controllers ─────────────────────────────────────────────────────────────

// @desc  returns account info and current balance.
// @route POST /api/v1/atm/verify
// @access Public
const verifyAtm = asyncWrapper(async (req, res, next) => {
    
    const { username, atm_code } = req.body;

    const result = await resolveUser(username, atm_code, next);
    if (!result) return;

    const { user, wallet } = result;

    res.status(200).json({
        status:  "success",
        message: "ATM verification successful.",
        data: {
            user: {
                username: user.user_name,
                name:     `${user.f_name} ${user.l_name}`,
            },
            wallet: {
                balance:  wallet.balance,
                currency: wallet.currency,
            },
        },
    });
});


// @desc Adds funds to the wallet
// @route POST /api/v1/atm/deposit
// @access Public
const deposit = asyncWrapper(async (req, res, next) => {
    
    const { username, atm_code, amount } = req.body;

    const result = await resolveUser(username, atm_code, next);
    if (!result) return;

    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) 
        return next(AppError.create("Amount must be a positive number.", 400, false));
    

    if (parsedAmount > MAX_DEPOSIT) {
        return next(
            AppError.create(`Single deposit cannot exceed ${MAX_DEPOSIT.toLocaleString()}.`, 400, false)
        );
    }

    const { user, wallet } = result;
    const pool     = await poolPromise;
    const dbTx     = new sql.Transaction(pool);
    const reference = generateReference();

    await dbTx.begin();
    try {

        const rowsUpdated = await addBalance(dbTx, user.user_id, parsedAmount);
        
        if (rowsUpdated === 0) {
            await dbTx.rollback();
            return next(AppError.create("Failed to update wallet balance.", 500, false));
        }

        await createAtmTransaction(dbTx, user.user_id, parsedAmount, "deposit", reference);
        await dbTx.commit();

    } catch (err) {
        await dbTx.rollback();
        next(err);
    }

    const updatedWallet = await getWalletByUserId(user.user_id);

    res.status(200).json({
        status:  "success",
        message: "Deposit successful.",
        data: {
            reference,
            amount:      parsedAmount,
            currency:    wallet.currency,
            new_balance: updatedWallet.balance,
        },
    });
});


// @desc Deducts funds from the wallet
// @route POST /api/v1/atm/withdraw
// @access Public
const withdraw = asyncWrapper(async (req, res, next) => {
    const { username, atm_code, amount } = req.body;

    const result = await resolveUser(username, atm_code, next);
    if (!result) return;

    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
        return next(AppError.create("Amount must be a positive number.", 400, false));
    }

    if (parsedAmount > MAX_WITHDRAW) {
        return next(
            AppError.create(`Single withdrawal cannot exceed ${MAX_WITHDRAW.toLocaleString()}.`, 400, false)
        );
    }

    const { user, wallet } = result;

    if (wallet.balance < parsedAmount) {
        return next(
            AppError.create(
                `Insufficient balance. Available: ${wallet.balance} ${wallet.currency}.`,
                400,
                false
            )
        );
    }

    const pool      = await poolPromise;
    const dbTx      = new sql.Transaction(pool);
    const reference = generateReference();

    await dbTx.begin();
    try {
        // deductBalance checks balance >= amount atomically in SQL (race-condition safe)
        const rowsUpdated = await deductBalance(dbTx, user.user_id, parsedAmount);
        if (rowsUpdated === 0) {
            await dbTx.rollback();
            return next(AppError.create("Insufficient balance.", 400, false));
        }

        await createAtmTransaction(dbTx, user.user_id, parsedAmount, "withdraw", reference);
        await dbTx.commit();
    } catch (err) {
        await dbTx.rollback();
        next(err);
    }

    const updatedWallet = await getWalletByUserId(user.user_id);

    res.status(200).json({
        status:  "success",
        message: "Withdrawal successful.",
        data: {
            reference,
            amount:      parsedAmount,
            currency:    wallet.currency,
            new_balance: updatedWallet.balance,
        },
    });
});

module.exports = { verifyAtm, deposit, withdraw };