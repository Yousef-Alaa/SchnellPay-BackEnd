const express     = require("express");
const router      = express.Router();
const verifyToken = require("../../middleware/verifyToken");
const allowTo     = require("../../middleware/allowTo");
const {
    getMyActivityLog,
    getUserActivityLog,
} = require("../../controllers/activityLog/activityLogController");

/**
 * @swagger
 * /api/v1/activity-log:
 *   get:
 *     tags: [Activity Log]
 *     summary: Get own activity log
 *     description: |
 *       Returns paginated security events for the authenticated user.
 *       Valid action values: `login_success`, `login_failed`, `password_changed`, `profile_updated`, `2fa_enabled`, `2fa_disabled`, `backup_codes_regenerated`.
 *       Max 100 records per page.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, maximum: 100 }
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: [login_success, login_failed, password_changed, profile_updated, 2fa_enabled, 2fa_disabled, backup_codes_regenerated]
 *     responses:
 *       200:
 *         description: Paginated activity log
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string }
 *                 data:
 *                   type: object
 *                   properties:
 *                     total: { type: integer }
 *                     page: { type: integer }
 *                     totalPages: { type: integer }
 *                     logs:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/ActivityLog' }
 *       400:
 *         description: Invalid action filter
 *       401:
 *         description: Unauthorized
 */
router.get("/", verifyToken, getMyActivityLog);

/**
 * @swagger
 * /api/v1/activity-log/{id}:
 *   get:
 *     tags: [Activity Log]
 *     summary: Get activity log for any user (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: Target user ID
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, maximum: 100 }
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: [login_success, login_failed, password_changed, profile_updated, 2fa_enabled, 2fa_disabled, backup_codes_regenerated]
 *     responses:
 *       200:
 *         description: Paginated activity log for the target user
 *       400:
 *         description: Invalid user ID / invalid action filter
 *       404:
 *         description: User not found
 *       403:
 *         description: Admin access required
 */
router.get("/:id", verifyToken, allowTo("admin"), getUserActivityLog);

module.exports = router;