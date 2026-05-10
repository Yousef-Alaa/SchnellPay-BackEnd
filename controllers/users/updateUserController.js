const asyncWrapper = require("../../middleware/asyncWrapper");
const UserModel = require("../../models/userModel");
const AppError = require("../../utils/appError");
const user = require("../../models/userModel");
const logActivity = require("../../utils/logActivity");

const updateUserController = asyncWrapper(async (req, res, next) => {
  const id = req.user.id || req.params.id; // Use req.user.id for /updateMe and req.params.id for admin update
  const fields = req.body;

  if (!fields || Object.keys(fields).length === 0) {
    const error = AppError.create("No data provided to update", 400);
    return next(error);
  }
  
  if (fields.phone) {
    const existingUser = await user.findByPhone(fields.phone);
    // If phone exists and it belongs to someone else
    if (existingUser && existingUser.user_id !== parseInt(id)) {
      const error = AppError.create("Phone number already in use", 400);
      return next(error);
    }
  }

  const updatedUser = await UserModel.update(id, fields);

  if (!updatedUser) {
    const error = AppError.create("User not found or nothing updated", 404);
    return next(error);
  }

  // Build a description that lists exactly what fields changed
  const changedFields = [];
  if (fields.f_name || fields.l_name) changedFields.push("name");
  if (fields.email) changedFields.push("email");
  if (fields.phone) changedFields.push("phone");

  const description = changedFields.length
    ? `Profile updated — changed: ${changedFields.join(", ")}.`
    : "Profile updated.";

  await logActivity(id, "profile_updated", description, req);

  res.status(200).json({
    success: true,
    message: "User updated successfully",
    data: updatedUser,
  });
});

module.exports = updateUserController;
