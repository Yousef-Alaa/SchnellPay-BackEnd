const express = require("express");
const router = express.Router();

const getAllUsersController = require("../../controllers/users/getAllUsersController");
const getSingleUserController = require("../../controllers/users/getSingleUserController");
const updateUserController = require("../../controllers/users/updateUserController");
const deletUserController = require("../../controllers/users/deletUserController");
const searchUsersController = require("../../controllers/users/searchUsersController");
const allowTo = require("../../middleware/allowTo");
const resendLimit = require("../../middleware/resendLimit");
const verifyToken = require("../../middleware/verifyToken");
const { userSearchLimiter } = require("../../middleware/rateLimiter");

/**
 * @swagger
 * /api/v1/users/search:
 *   get:
 *     tags: [Users]
 *     summary: Search users by username or phone
 *     description: Returns up to 10 active users whose `user_name` contains the query (LIKE) or whose `phone` matches exactly. Minimum 3 characters, maximum 50.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 3
 *           maxLength: 50
 *         description: Username (partial) or phone number (exact)
 *         example: ahmed
 *     responses:
 *       200:
 *         description: Matching users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/SearchUserResult'
 *       400:
 *         description: Query missing / too short / too long
 *       401:
 *         description: Unauthorized
 */
router.get("/search", verifyToken, searchUsersController);

/**
 * @swagger
 * /api/v1/users/getMe:
 *   get:
 *     tags: [Users]
 *     summary: Get own profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Own user profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */
router.get("/search", userSearchLimiter, verifyToken, searchUsersController);
router.get("/getMe", verifyToken, getSingleUserController);

/**
 * @swagger
 * /api/v1/users/updateMe:
 *   patch:
 *     tags: [Users]
 *     summary: Update own profile
 *     description: Updatable fields — f_name, l_name, phone, country. Logs a `profile_updated` activity event. Admin-only fields (account_status, role) are silently ignored for regular users due to model-level field whitelist.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserRequest'
 *           example:
 *             f_name: Ahmed
 *             phone: "01098765432"
 *     responses:
 *       200:
 *         description: Profile updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data: { $ref: '#/components/schemas/User' }
 *       400:
 *         description: No fields provided / nothing updated
 *       401:
 *         description: Unauthorized
 *       429:
 *         description: Rate limit — 10 per 10 min
 */
router.patch(
  "/updateMe",
  resendLimit.updateMeLimiter,
  verifyToken,
  updateUserController,
);

/**
 * @swagger
 * /api/v1/users/deleteMe:
 *   delete:
 *     tags: [Users]
 *     summary: Delete own account
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted
 *       401:
 *         description: Unauthorized
 *       429:
 *         description: Rate limit — 5 per 10 min
 */
router.delete(
  "/deleteMe",
  resendLimit.deleteMeLimiter,
  verifyToken,
  deletUserController,
);

// ── Admin routes (verifyToken + allowTo("admin") applied to all below) ────────
router.use(verifyToken, allowTo("admin"));

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     tags: [Users]
 *     summary: List all users (Admin)
 *     description: Paginated, searchable, and sortable list of all users. Admin only.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Searches f_name, l_name, email, user_name
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [creation_date, f_name, email, user_name, role], default: creation_date }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *     responses:
 *       200:
 *         description: Paginated user list
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginationMeta'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/User' }
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       429:
 *         description: Rate limit — 60 per minute
 */
router.get("/", resendLimit.adminGetUsersLimiter, getAllUsersController);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get a specific user by ID (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: User profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/User' }
 *       404:
 *         description: User not found
 *       403:
 *         description: Admin access required
 *   patch:
 *     tags: [Users]
 *     summary: Update any user's profile (Admin)
 *     description: Admin can update f_name, l_name, phone, country, account_status, and role.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserRequest'
 *     responses:
 *       200:
 *         description: User updated
 *       404:
 *         description: User not found
 *       403:
 *         description: Admin access required
 *   delete:
 *     tags: [Users]
 *     summary: Delete any user account (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: User deleted
 *       404:
 *         description: User not found
 *       403:
 *         description: Admin access required
 */
router.get("/:id", resendLimit.adminGetUsersLimiter, getSingleUserController);
router.patch("/:id", resendLimit.adminUpdateUserLimiter, updateUserController);
router.delete("/:id", resendLimit.adminDeleteUserLimiter, deletUserController);

module.exports = router;
