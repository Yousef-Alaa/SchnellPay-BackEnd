const asyncWrapper = require("../../middleware/asyncWrapper");
const appError = require("../../utils/appError");
const Notification = require("../../models/notificationModel");

const deleteNotificationController = asyncWrapper(async (req, res, next) => {
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
  const rowsDeleted = await Notification.delete(notificationId, userId);

  if (rowsDeleted === 0) {
    return next(
      appError.create(
        "Notification not found or you don't have permission to delete it.",
        404,
        false,
      ),
    );
  }
  res.status(200).json({
    status: "success",
    message: "Notification deleted",
  });
});

module.exports = deleteNotificationController;
