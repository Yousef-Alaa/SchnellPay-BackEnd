const bcrypt = require("bcryptjs");

const asyncWrapper = require("../../middleware/asyncWrapper");
const AppError = require("../../utils/appError");
const UserModel = require("../../models/userModel");
const logActivity = require("../../utils/logActivity");

const changePassword = asyncWrapper(async (req, res, next) => {
  const userId = req.user.id;

  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    const error = AppError.create(
      "Current password and new password are required",
      400,
      false,
    );
    return next(error);
  }

  const user = await UserModel.findById(userId);
  if (!user) {
    const error = AppError.create("User not found", 404, false);
    return next(error);
  }
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    const error = AppError.create("Invalid current password", 400, false);
    return next(error);
  }
  if (currentPassword === newPassword) {
    return next(
      AppError.create(
        "New password must be different from current password",
        400,
      ),
    );
  }
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await UserModel.updatePasswordById(userId, hashedPassword);
  await logActivity(userId, "password_changed", "Account password changed.", req);
  res.status(200).json({
    success: true,
    message: "Password changed successfully",
  });
});

module.exports = changePassword;
