const asyncWrapper = require("../../middleware/asyncWrapper");
const userModel = require("../../models/userModel");
const appError = require("../../utils/appError");

const deletUserController = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;
  const deleted = await userModel.deleteUser(id);
  if (!deleted) {
    const error = appError.create("User not found", 404);
    return next(error);
  }
  res.status(200).json({
    success: true,
    message: "User deleted successfully",
  });
});
module.exports = deletUserController;
