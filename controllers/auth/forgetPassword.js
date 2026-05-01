const asyncWrapper = require("../../middleware/asyncWrapper");
const appError = require("../../utils/appError");
const sendEmail = require("../../utils/sendEmail");
const UserModel = require("../../models/userModel");
const crypto = require("crypto");

const forgetPassword = asyncWrapper(async (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    const error = appError.create("Email is required", 400, false);
    return next(error);
  }
  const user = await UserModel.findByEmail(email);
  if (!user) {
    const error = appError.create("User not found", 404, false);
    return next(error);
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");
  const expires = Date.now() + 10 * 60 * 1000;
  await UserModel.updateOTP(email, hashedOTP, expires);
  await sendEmail(email, "Your OTP Code To Reset Password", "OTP", [otp]);

  res.status(200).json({
    success: true,
    message: "OTP sent to email",
  });
});

module.exports = forgetPassword;
