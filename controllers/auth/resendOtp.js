const asyncWrapper = require("../../middleware/asyncWrapper");
const AppError = require("../../utils/appError");
const UserModel = require("../../models/userModel");
const crypto = require("crypto");
const sendEmail = require("../../utils/sendEmail");

const resendOTP = asyncWrapper(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(AppError.create("Email is required", 400, false));
  }

  const user = await UserModel.findByEmail(email);
  if (!user) {
    return next(AppError.create("User not found", 404, false));
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");

  const expires = Date.now() + 10 * 60 * 1000;

  await UserModel.updateOTP(email, hashedOTP, expires);

  await sendEmail(email, "Your new OTP for SchnellPay", "OTP", [otp]);
  res.status(200).json({
    success: true,
    message: "OTP resent successfully",
  });
});

module.exports = resendOTP;
