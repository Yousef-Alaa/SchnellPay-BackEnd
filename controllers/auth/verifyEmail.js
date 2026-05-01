const asyncWrapper = require("../../middleware/asyncWrapper");
const AppError = require("../../utils/appError");
const UserModel = require("../../models/userModel");
const crypto = require("crypto");
const sendEmail = require("../../utils/sendEmail");

const verifyEmail = asyncWrapper(async (req, res, next) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    const error = AppError.create("Email and OTP are required", 400, false);
    return next(error);
  }

  const user = await UserModel.findByEmail(email);

  if (!user) {
    const error = AppError.create("User not found", 404, false);
    return next(error);
  }

  const hashedInputOTP = crypto
    .createHash("sha256")
    .update(otp.trim())
    .digest("hex");

  if (
    user.email_otp !== hashedInputOTP ||
    user.email_otp_expires < Date.now()
  ) {
    const error = AppError.create("Invalid or expired OTP", 400, false);
    return next(error);
  }

  const activatedUser = await UserModel.activateUser(email);

  res.status(200).json({
    success: true,
    message: "Email verified successfully",
    user: activatedUser,
  });
  await sendEmail(user.email, "Welcome to SchnellPay!", "WELCOME", [
    user.f_name,
  ]);
});

module.exports = verifyEmail;
