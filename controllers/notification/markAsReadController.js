const asyncWrapper = require("../../middleware/asyncWrapper");
const appError = require("../../utils/appError");
const Notification = require("../../models/notificationModel");

const markAsReadController = asyncWrapper(async (req, res, next) => {
  const userId = req.user.id;
  if (!userId) {
    const error = appError.create("User ID is required", 400);
    return next(error);
  }
  const notificationId = req.params.id;
  if (!notificationId) {
    const error = appError.create("Notification ID is required", 400);
    return next(error);
  }

  await Notification.markRead(notificationId, userId);
  res.status(200).json({
    status: "success",
    message: "Notification marked as read",
  });
});

module.exports = markAsReadController;
