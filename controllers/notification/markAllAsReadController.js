const asyncWrapper = require("../../middleware/asyncWrapper");
const appError = require("../../utils/appError");
const Notification = require("../../models/notificationModel");
const markAllAsReadController = asyncWrapper(async (req, res, next) => {
  const userId = req.user.id;
  if (!userId) {
    const error = appError.create("User ID is required", 400);
    return next(error);
  }

  await Notification.markAllRead(userId);
  res.status(200).json({
    status: "success",
    message: "All notifications marked as read",
  });
});

module.exports = markAllAsReadController;
