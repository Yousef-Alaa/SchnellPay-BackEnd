const asyncWrapper = require("../../middleware/asyncWrapper");
const appError = require("../../utils/appError");
const UserModel = require("../../models/userModel");
const crypto = require("crypto");

const verifyResetOtp = asyncWrapper(async (req, res, next) => {
  const { email, otp } = req.body;
  const user = await UserModel.findByEmail(email);
  if (!user) {
    const error = appError.create("User not found", 404, false);
    return next(error);
  }

  const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");
  if (user.reset_otp !== hashedOTP || user.reset_otp_expires < Date.now()) {
    const error = appError.create("Invalid or expired OTP", 400, false);
    return next(error);
  }
  await UserModel.markOtpVerified(email);

  res.status(200).json({
    success: true,
    message: "OTP verified",
  });
});

module.exports = verifyResetOtp;
