const asyncWrapper = require("../../middleware/asyncWrapper");
const UserModel = require("../../models/userModel");
const AppError = require("../../utils/appError");

const updateUserController = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;
  const fields = req.body;

  if (!fields || Object.keys(fields).length === 0) {
    const error = AppError.create("No data provided to update", 400);
    return next(error);
  }

  const updatedUser = await UserModel.update(id, fields);

  if (!updatedUser) {
    const error = AppError.create("User not found or nothing updated", 404);
    return next(error);
  }

  res.status(200).json({
    success: true,
    message: "User updated successfully",
    data: updatedUser,
  });
});

module.exports = updateUserController;
