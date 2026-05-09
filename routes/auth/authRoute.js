const express = require("express");
const twoFaRoutes = require("./twoFaRoutes");
const register = require("../../controllers/auth/register");
const login = require("../../controllers/auth/login");
const verifyEmail = require("../../controllers/auth/verifyEmail");
const resendOtp = require("../../controllers/auth/resendOtp");
const changePassword = require("../../controllers/auth/changePassword");
const resetPassword = require("../../controllers/auth/resetPassword");
const forgetPassword = require("../../controllers/auth/forgetPassword");
const verifyToken = require("../../middleware/verifyToken");
const verifyResetOTP = require("../../controllers/auth/verifyResetOtp");
const refreshToken = require("../../controllers/auth/refreshToken");
const logout       = require("../../controllers/auth/logout");
const { 
    loginLimiter, 
    registerLimiter,
    verifyEmailLimiter, 
    forgetPasswordLimiter,
    resetPasswordLimiter,
    changePasswordLimiter, 
    otpLimiter, 
    verifyResetOtpLimiter
} = require("../../middleware/resendLimit");

const router = express.Router();

router.post("/login", loginLimiter, login);
router.post("/register", registerLimiter, register);
router.post("/verify-email", verifyEmailLimiter, verifyEmail);
router.post("/forget-password", forgetPasswordLimiter, forgetPassword);
router.post("/reset-password", resetPasswordLimiter, resetPassword);
router.post("/change-password", changePasswordLimiter, verifyToken, changePassword);
router.post("/resend-otp", otpLimiter, resendOtp);
router.post("/verify-reset-otp", verifyResetOtpLimiter, verifyResetOTP);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login with email and password
 *     description: |
 *       Validates credentials and email verification status.
 *       - **No MFA**: Returns JWT access token (15 min prod / 1 h dev) and sets httpOnly `refresh_token` cookie.
 *       - **MFA enabled**: Returns `requires2FA: true` with a short-lived `mfa_token` (10 min, separate secret). Client must call `/auth/2fa/send-otp` then `/auth/2fa/validate`.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful or MFA required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Invalid email or password
 *       403:
 *         description: Email not verified yet
 *       429:
 *         description: Rate limit — 5 attempts per 15 min per IP
 */
router.post("/login", resendLimit.loginLimiter, login);

/**
 * @swagger
 * /api/v1/auth/verify-email:
 *   post:
 *     tags: [Auth]
 *     summary: Verify email with OTP
 *     description: Validates the SHA-256-hashed OTP sent at registration. On success activates the account, creates the user's wallet, and sends a welcome email.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyEmailRequest'
 *     responses:
 *       200:
 *         description: Email verified. Wallet created.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: Email verified successfully }
 *                 user: { type: object, properties: { user_id: { type: integer } } }
 *       400:
 *         description: Invalid or expired OTP / missing fields
 *       404:
 *         description: User not found
 *       429:
 *         description: Rate limit — 5 per 10 min per IP
 */
router.post("/verify-email", resendLimit.verifyEmailLimiter, verifyEmail);

/**
 * @swagger
 * /api/v1/auth/resend-otp:
 *   post:
 *     tags: [Auth]
 *     summary: Resend email verification OTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResendOtpRequest'
 *     responses:
 *       200:
 *         description: OTP resent
 *       429:
 *         description: Rate limit — 1 request per minute per IP
 */
router.post("/resend-otp", resendLimit.otpLimiter, resendOtp);

/**
 * @swagger
 * /api/v1/auth/forget-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request a password reset OTP
 *     description: Generates a 6-digit OTP, SHA-256 hashes it, stores it with 10-min expiry, and emails it to the user.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgetPasswordRequest'
 *     responses:
 *       200:
 *         description: OTP sent to email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: OTP sent to email }
 *       404:
 *         description: No user with that email
 *       429:
 *         description: Rate limit — 3 per 15 min per IP
 */
router.post("/forget-password", resendLimit.forgetPasswordLimiter, forgetPassword);

/**
 * @swagger
 * /api/v1/auth/verify-reset-otp:
 *   post:
 *     tags: [Auth]
 *     summary: Verify password reset OTP
 *     description: Validates OTP and marks `reset_otp_verified = 1`, which is required before calling reset-password.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyResetOtpRequest'
 *     responses:
 *       200:
 *         description: OTP verified
 *       400:
 *         description: Invalid or expired OTP
 *       429:
 *         description: Rate limit — 5 per 10 min per IP
 */
router.post("/verify-reset-otp", resendLimit.verifyResetOtpLimiter, verifyResetOTP);

/**
 * @swagger
 * /api/v1/auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password (after OTP verification)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordRequest'
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: OTP not verified first / missing fields
 *       429:
 *         description: Rate limit — 3 per 10 min per IP
 */
router.post("/reset-password", resendLimit.resetPasswordLimiter, resetPassword);

/**
 * @swagger
 * /api/v1/auth/change-password:
 *   post:
 *     tags: [Auth]
 *     summary: Change password (authenticated users only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePasswordRequest'
 *     responses:
 *       200:
 *         description: Password changed. Activity logged.
 *       401:
 *         description: Current password incorrect / invalid token
 *       429:
 *         description: Rate limit — 5 per 10 min per IP
 */
router.post("/change-password", resendLimit.changePasswordLimiter, verifyToken, changePassword);

/**
 * @swagger
 * /api/v1/auth/refresh-token:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token
 *     description: |
 *       Reads the `refresh_token` httpOnly cookie (set at login). Token format: `<userId>:<randomHex64>`.
 *       Validates the random part against bcrypt hashes in `REFRESH_TOKENS` table, slides expiry +24h (rolling window), and issues a new JWT access token.
 *       **No request body required.**
 *     responses:
 *       200:
 *         description: New access token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RefreshTokenResponse'
 *       401:
 *         description: Missing cookie / invalid or expired refresh token
 */
router.post("/refresh-token", refreshToken);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout and revoke refresh token
 *     description: |
 *       Revokes the current refresh token from the DB and clears the cookie.
 *       Pass `all_devices: true` to revoke ALL sessions for this user (all devices).
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LogoutRequest'
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       401:
 *         description: Invalid or missing token
 */
router.post("/logout", verifyToken, logout);

router.use("/2fa", twoFaRoutes);

module.exports = router;
