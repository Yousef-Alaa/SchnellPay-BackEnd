const express = require("express");
const router = express.Router();

const getUserNotificationsController = require("../../controllers/notification/getUserNotificationsController");
const markNotificationReadController = require("../../controllers/notification/markAsReadController");
const markAllNotificationsReadController = require("../../controllers/notification/markAllAsReadController");
const deleteNotificationController = require("../../controllers/notification/deleteNotificationController");
const deleteAllNotificationsController = require("../../controllers/notification/deleteAllNotificationsController");
const verifyToken = require("../../middleware/verifyToken");

/**
 * @swagger
 * /api/v1/notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: Get all notifications for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Notification' }
 *       401:
 *         description: Unauthorized
 */
router.get("/", verifyToken, getUserNotificationsController);

/**
 * @swagger
 * /api/v1/notifications/read-all:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark all notifications as read
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *       401:
 *         description: Unauthorized
 */
router.patch("/read-all", verifyToken, markAllNotificationsReadController);

/**
 * @swagger
 * /api/v1/notifications/delete-all:
 *   delete:
 *     tags: [Notifications]
 *     summary: Delete all notifications
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications deleted
 *       401:
 *         description: Unauthorized
 */
router.delete("/delete-all", verifyToken, deleteAllNotificationsController);

/**
 * @swagger
 * /api/v1/notifications/{id}/read:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark a single notification as read
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       404:
 *         description: Notification not found
 *       401:
 *         description: Unauthorized
 */
router.patch("/:id/read", verifyToken, markNotificationReadController);

/**
 * @swagger
 * /api/v1/notifications/{id}:
 *   delete:
 *     tags: [Notifications]
 *     summary: Delete a single notification
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Notification deleted
 *       404:
 *         description: Notification not found
 *       401:
 *         description: Unauthorized
 */
router.delete("/:id", verifyToken, deleteNotificationController);

module.exports = router;
