const asyncWrapper = require("../../middleware/asyncWrapper");
const Notification = require("../../models/notificationModel");
const appError = require("../../utils/appError");

const getUserNotificationsController = asyncWrapper(async (req, res, next) => {
  const userId = req.user.id;
  if (!userId) {
    const error = appError.createError("User ID is required", 400);
    return next(error);
  }

  const notifications = await Notification.list(userId);
  res.status(200).json({
    status: "success",
    data: notifications.recordset,
  });
});

module.exports = getUserNotificationsController;
