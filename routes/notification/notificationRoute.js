const express = require("express");
const router = express.Router();

const getUserNotificationsController = require("../../controllers/notification/getUserNotificationsController");
const markNotificationReadController = require("../../controllers/notification/markAsReadController");
const markAllNotificationsReadController = require("../../controllers/notification/markAllAsReadController");
const deleteNotificationController = require("../../controllers/notification/deleteNotificationController");
const deleteAllNotificationsController = require("../../controllers/notification/deleteAllNotificationsController");
const verifyToken = require("../../middleware/verifyToken");

router.get("/", verifyToken, getUserNotificationsController);
router.patch("/read-all", verifyToken, markAllNotificationsReadController);
router.delete("/delete-all", verifyToken, deleteAllNotificationsController);

router.patch("/:id/read", verifyToken, markNotificationReadController);
router.delete("/:id", verifyToken, deleteNotificationController);

module.exports = router;
