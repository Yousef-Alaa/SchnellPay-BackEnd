const Notification = require("../models/notificationModel");
const sendEmail = require("./sendEmail");

const createNotification = async (
  userId,
  title,
  body,
  type,
  userEmail = null,
) => {
  try {
    await Notification.insert(userId, title, body, type);

    if (userEmail) {
      await sendEmail(userEmail, title, "NOTIFICATION", [title, body]);
    }
  } catch (error) {
    console.error("Global Notification Helper Error:", error);
  }
};

module.exports = { createNotification };
