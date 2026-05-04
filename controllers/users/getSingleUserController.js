const asyncWrapper = require("../../middleware/asyncWrapper");
const userModel = require("../../models/userModel");
const appError = require("../../utils/appError");

const getSingleUserController = asyncWrapper(async (req, res, next) => {
  const id = req.user.id || req.params.id; // Use req.user.id for /getMe and req.params.id for admin get

  const user = await userModel.findById(id);
  if (!user) {
    const error = appError.create("User not found", 404);
    return next(error);
  }
  res.status(200).json({
    success: true,
    data: user,
  });
});

module.exports = getSingleUserController;
