const asyncWrapper = require("../../middleware/asyncWrapper");
const AppError = require("../../utils/appError");
const UserModel = require("../../models/userModel");
const crypto = require("crypto");
const sendEmail = require("../../utils/sendEmail");
const bcrypt = require("bcryptjs");

const resetPassword = asyncWrapper(async (req, res, next) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    const error = AppError.create(
      "Email and new password are required",
      400,
      false,
    );
    return next(error);
  }
  const user = await UserModel.findByEmail(email);
  if (!user) {
    const error = AppError.create("User not found", 404, false);
    return next(error);
  }
  if (!user.reset_otp_verified) {
    const error = AppError.create("OTP not verified", 400, false);
    return next(error);
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await UserModel.clearResetOtp(email);

  await UserModel.updatePassword(email, hashedPassword);
  res.status(200).json({
    success: true,
    message: "Password reset successfully",
  });
});

module.exports = resetPassword;
