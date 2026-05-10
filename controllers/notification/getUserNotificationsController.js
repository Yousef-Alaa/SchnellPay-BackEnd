const asyncWrapper = require("../../middleware/asyncWrapper");
const Notification = require("../../models/notificationModel");
const appError = require("../../utils/appError");

const getUserNotificationsController = asyncWrapper(async (req, res, next) => {
  const userId = req.user.id;
  if (!userId) {
    const error = appError.createError("User ID is required", 400);
    return next(error);
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const [notifications, total] = await Promise.all([
    Notification.list(userId, limit, offset),
    Notification.count(userId)
  ]);

  res.status(200).json({
    status: "success",
    data: notifications.recordset,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  });
});

module.exports = getUserNotificationsController;
