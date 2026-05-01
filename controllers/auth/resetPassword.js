const asyncWrapper = require("../../middleware/asyncWrapper");
const AppError = require("../../utils/appError");
const UserModel = require("../../models/userModel");
const crypto = require("crypto");
const sendEmail = require("../../utils/sendEmail");
const bcrypt = require("bcryptjs");

const resetPassword = asyncWrapper(async (req, res, next) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) {
    const error = AppError.create(
      "Email, OTP and new password are required",
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
  const hashedInputOTP = crypto.createHash("sha256").update(otp).digest("hex");
  if (
    user.email_otp !== hashedInputOTP ||
    user.email_otp_expires < Date.now()
  ) {
    const error = AppError.create("Invalid or expired OTP", 400, false);
    return next(error);
  }
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await UserModel.updatePassword(email, hashedPassword);
  res.status(200).json({
    success: true,
    message: "Password reset successfully",
  });
});

module.exports = resetPassword;
