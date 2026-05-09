const express = require("express");
const router = express.Router();
const verifyToken = require("../../middleware/verifyToken");
const {
  setupMfa,
  verifySetup,
  validateMfa,
  regenerateBackupCodes,
  disableMfaHandler,
  sendLoginOtp,
} = require("../../controllers/auth/twoFaController");

const {
  mfaValidateLimiter,
  mfaSendOtpLimiter,
  mfaSetupLimiter,
  mfaRegenerateLimiter,
} = require("../../middleware/rateLimiter");

/**
 * @swagger
 * /api/v1/auth/2fa/send-otp:
 *   post:
 *     tags: [2FA]
 *     summary: Send login OTP for MFA
 *     description: Sends a one-time login OTP by the user's configured MFA method or email.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MfaSendOtpRequest'
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: User not found or MFA not enabled
 *       429:
 *         description: Rate limit — send OTP requests
 */
router.post("/send-otp", mfaSendOtpLimiter, sendLoginOtp);

/**
 * @swagger
 * /api/v1/auth/2fa/validate:
 *   post:
 *     tags: [2FA]
 *     summary: Validate MFA login code
 *     description: Validates the MFA code submitted during login and returns a JWT access token when successful.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MfaValidateRequest'
 *     responses:
 *       200:
 *         description: MFA validated and login completed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Invalid or expired MFA code
 *       401:
 *         description: Invalid or expired MFA token
 */
router.post("/validate", mfaValidateLimiter, validateMfa);
/**
 * @swagger
 * /api/v1/auth/2fa/setup:
 *   post:
 *     tags: [2FA]
 *     security:
 *       - bearerAuth: []
 *     summary: Setup MFA for authenticated user
 *     description: Initializes MFA setup and returns setup details for authenticator apps or email.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MfaSetupRequest'
 *     responses:
 *       200:
 *         description: MFA setup initiated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Missing or invalid token
 *       429:
 *         description: Rate limit — MFA setup requests
 */
router.post("/setup", mfaSetupLimiter, verifyToken, setupMfa);

/**
 * @swagger
 * /api/v1/auth/2fa/verify-setup:
 *   post:
 *     tags: [2FA]
 *     security:
 *       - bearerAuth: []
 *     summary: Verify MFA setup
 *     description: Confirms the MFA setup code from authenticator app or email and activates MFA for the user.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MfaVerifySetupRequest'
 *     responses:
 *       200:
 *         description: MFA setup verified
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Invalid or expired setup code
 *       401:
 *         description: Missing or invalid token
 */
router.post("/verify-setup", verifyToken, verifySetup);

/**
 * @swagger
 * /api/v1/auth/2fa/regenerate-backup-codes:
 *   post:
 *     tags: [2FA]
 *     security:
 *       - bearerAuth: []
 *     summary: Regenerate MFA backup codes
 *     description: Generates a new set of backup codes for MFA and invalidates previous codes.
 *     responses:
 *       200:
 *         description: Backup codes regenerated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Missing or invalid token
 *       429:
 *         description: Rate limit — regenerate backup codes
 */
router.post(
  "/regenerate-backup-codes",
  mfaRegenerateLimiter,
  verifyToken,
  regenerateBackupCodes,
);

/**
 * @swagger
 * /api/v1/auth/2fa/disable:
 *   post:
 *     tags: [2FA]
 *     security:
 *       - bearerAuth: []
 *     summary: Disable MFA for the authenticated user
 *     description: Disables two-factor authentication on the current user account.
 *     responses:
 *       200:
 *         description: MFA disabled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Missing or invalid token
 */
router.post("/disable", verifyToken, disableMfaHandler);

module.exports = router;
