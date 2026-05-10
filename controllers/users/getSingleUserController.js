const asyncWrapper = require("../../middleware/asyncWrapper");
const userModel = require("../../models/userModel");
const walletModel = require("../../models/walletModel");
const appError = require("../../utils/appError");

const getSingleUserController = asyncWrapper(async (req, res, next) => {
  const id = req.user.id || req.params.id;

  const user = await userModel.findById(id);

  if (!user) {
    const error = appError.create("User not found", 404);
    return next(error);
  }

  // Fetch wallet data
  const wallet = await walletModel.getWalletByUserId(id);

  // Safe user object
  const safeUser = {
    user_id: user.user_id,
    f_name: user.f_name,
    l_name: user.l_name,
    email: user.email,
    phone: user.phone,
    country: user.country,
    role: user.role,
    account_status: user.account_status,
    is_verified: user.is_verified,
    mfa_enabled: user.mfa_enabled,
    creation_date: user.creation_date,
    balance: wallet ? wallet.balance : 0,
    currency: wallet ? wallet.currency : "EGP",
  };

  res.status(200).json({
    success: true,
    data: safeUser,
  });
});

module.exports = getSingleUserController;
