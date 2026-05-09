const express = require("express");
const router = express.Router();

const register = require("../../controllers/auth/register");
const login = require("../../controllers/auth/login");
const verifyEmail = require("../../controllers/auth/verifyEmail");
const resendOtp = require("../../controllers/auth/resendOtp");
const changePassword = require("../../controllers/auth/changePassword");
const resetPassword = require("../../controllers/auth/resetPassword");
const forgetPassword = require("../../controllers/auth/forgetPassword");
const verifyResetOTP = require("../../controllers/auth/verifyResetOtp");
const refreshToken = require("../../controllers/auth/refreshToken");
const logout = require("../../controllers/auth/logout");

const verifyToken = require("../../middleware/verifyToken");
const twoFaRoutes = require("./twoFaRoutes");
const {
  loginLimiter,
  registerLimiter,
  verifyEmailLimiter,
  forgetPasswordLimiter,
  resetPasswordLimiter,
  changePasswordLimiter,
  otpLimiter,
  verifyResetOtpLimiter,
} = require("../../middleware/resendLimit");

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication and Identity Management
 */

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     description: Creates a new user account and sends a verification OTP to email.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: User registered successfully. OTP sent.
 *       400:
 *         description: Validation error or email already exists
 *       429:
 *         description: Rate limit — Too many registration attempts
 */
router.post("/register", registerLimiter, register);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login with email and password
 *     description: |
 *       Validates credentials and email verification status.
 *       - **No MFA**: Returns JWT access token and sets httpOnly `refresh_token` cookie.
 *       - **MFA enabled**: Returns `requires2FA: true` with a short-lived `mfa_token`.
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
router.post("/login", loginLimiter, login);

/**
 * @swagger
 * /api/v1/auth/verify-email:
 *   post:
 *     tags: [Auth]
 *     summary: Verify email with OTP
 *     description: Validates the SHA-256-hashed OTP. On success activates the account and creates the user's wallet.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyEmailRequest'
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired OTP
 *       429:
 *         description: Rate limit — 5 per 10 min per IP
 */
router.post("/verify-email", verifyEmailLimiter, verifyEmail);

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
router.post("/resend-otp", otpLimiter, resendOtp);

/**
 * @swagger
 * /api/v1/auth/forget-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request a password reset OTP
 *     description: Generates a 6-digit OTP and emails it to the user.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgetPasswordRequest'
 *     responses:
 *       200:
 *         description: OTP sent to email
 *       404:
 *         description: No user with that email
 *       429:
 *         description: Rate limit — 3 per 15 min per IP
 */
router.post("/forget-password", forgetPasswordLimiter, forgetPassword);

/**
 * @swagger
 * /api/v1/auth/verify-reset-otp:
 *   post:
 *     tags: [Auth]
 *     summary: Verify password reset OTP
 *     description: Validates OTP before allowing the password reset.
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
router.post("/verify-reset-otp", verifyResetOtpLimiter, verifyResetOTP);

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
 *         description: OTP not verified first
 *       429:
 *         description: Rate limit — 3 per 10 min per IP
 */
router.post("/reset-password", resetPasswordLimiter, resetPassword);

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
 *         description: Password changed successfully
 *       401:
 *         description: Unauthorized or current password incorrect
 *       429:
 *         description: Rate limit — 5 per 10 min per IP
 */
router.post(
  "/change-password",
  verifyToken,
  changePasswordLimiter,
  changePassword,
);

/**
 * @swagger
 * /api/v1/auth/refresh-token:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token
 *     description: Reads `refresh_token` from httpOnly cookie and issues a new access token.
 *     responses:
 *       200:
 *         description: New access token issued
 *       401:
 *         description: Missing or invalid refresh token
 */
router.post("/refresh-token", refreshToken);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout and revoke refresh token
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

// مسارات الـ 2FA
router.use("/2fa", twoFaRoutes);

module.exports = router;
