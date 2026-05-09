const express = require("express");
const router  = express.Router();
const verifyToken = require("../../middleware/verifyToken");
const {
    setupMfa,
    verifySetup,
    validateMfa,
    regenerateBackupCodes,
    disableMfaHandler,
    sendLoginOtp,
} = require("../../controllers/auth/twoFaController");

<<<<<<< HEAD
/**
 * @swagger
 * /api/v1/auth/2fa/send-otp:
 *   post:
 *     tags: [2FA]
 *     summary: Send login OTP to email (email-MFA flow)
 *     description: "Called after /auth/login returns requires2FA=true with method=email. Generates a 6-digit OTP (bcrypt-hashed), stores it with 10-min expiry, and emails it to the user."
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MfaSendOtpRequest'
 *     responses:
 *       200:
 *         description: OTP sent to the user's registered email
 *       400:
 *         description: Email MFA not enabled / username missing
 *       404:
 *         description: User not found
 */
router.post("/send-otp", sendLoginOtp);

/**
 * @swagger
 * /api/v1/auth/2fa/validate:
 *   post:
 *     tags: [2FA]
 *     summary: Validate MFA code and complete login
 *     description: |
 *       Accepts the `mfa_token` from `/auth/login` plus the user's code.
 *       Tries verification in order: email OTP → TOTP (auth app) → backup code.
 *       On success: issues full JWT access token + refresh token cookie (same as normal login).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MfaValidateRequest'
 *           example:
 *             mfa_token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *             code: "482910"
 *     responses:
 *       200:
 *         description: MFA verified. Access token issued.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: MFA verified. Logged in successfully. }
 *                 token: { type: string, description: JWT access token }
 *       400:
 *         description: Missing mfa_token or code / MFA not enabled
 *       401:
 *         description: Invalid or expired MFA code
 */
router.post("/validate", validateMfa);

/**
 * @swagger
 * /api/v1/auth/2fa/setup:
 *   post:
 *     tags: [2FA]
 *     summary: Initiate MFA setup
 *     description: |
 *       Starts the MFA enrollment process. Choose `email` or `app` (TOTP).
 *       - **email**: Sends a verification OTP to the user's email.
 *       - **app**: Generates a TOTP secret, stores it, and returns a QR code (base64 PNG) plus the raw secret for manual entry.
 *       Call `/auth/2fa/verify-setup` next to confirm and activate MFA.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MfaSetupRequest'
 *     responses:
 *       200:
 *         description: Setup initiated. For app method — QR code and secret returned.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 message: { type: string }
 *                 data:
 *                   type: object
 *                   properties:
 *                     method: { type: string, enum: [email, app] }
 *                     secret: { type: string, description: "TOTP secret (app only)" }
 *                     qr_code: { type: string, description: "base64 PNG data URL (app only)" }
 *       400:
 *         description: MFA already enabled / invalid method
 *       401:
 *         description: Unauthorized
 */
router.post("/setup", verifyToken, setupMfa);

/**
 * @swagger
 * /api/v1/auth/2fa/verify-setup:
 *   post:
 *     tags: [2FA]
 *     summary: Confirm MFA setup and activate
 *     description: |
 *       Verifies the first code after setup. On success:
 *       - Enables MFA on the account.
 *       - Generates 10 one-time backup codes (bcrypt-hashed in DB).
 *       - Emails the plain backup codes to the user (shown once only).
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MfaVerifySetupRequest'
 *     responses:
 *       200:
 *         description: MFA activated. Backup codes returned (one-time display).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 data:
 *                   type: object
 *                   properties:
 *                     method: { type: string }
 *                     backup_codes:
 *                       type: array
 *                       items: { type: string }
 *                       description: 10 alphanumeric codes — store safely, shown once
 *       400:
 *         description: No pending setup / MFA already active / expired OTP
 *       401:
 *         description: Invalid code
 */
router.post("/verify-setup", verifyToken, verifySetup);

/**
 * @swagger
 * /api/v1/auth/2fa/regenerate-backup-codes:
 *   post:
 *     tags: [2FA]
 *     summary: Regenerate MFA backup codes
 *     description: Requires a valid MFA code to confirm. Invalidates all existing backup codes and generates 10 new ones. New codes are emailed and returned in the response (one-time).
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MfaCodeRequest'
 *     responses:
 *       200:
 *         description: New backup codes generated and emailed
 *       400:
 *         description: MFA not enabled / missing code
 *       401:
 *         description: Invalid MFA code
 */
router.post("/regenerate-backup-codes", verifyToken, regenerateBackupCodes);

/**
 * @swagger
 * /api/v1/auth/2fa/disable:
 *   post:
 *     tags: [2FA]
 *     summary: Disable MFA on the account
 *     description: Requires a valid MFA code or backup code to confirm. Removes MFA method and TOTP secret from the account.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MfaCodeRequest'
 *     responses:
 *       200:
 *         description: MFA disabled. Activity logged.
 *       400:
 *         description: MFA not enabled / missing code
 *       401:
 *         description: Invalid MFA code
 */
=======
const {
    mfaValidateLimiter,
    mfaSendOtpLimiter,
    mfaSetupLimiter,
    mfaRegenerateLimiter,
} = require("../../middleware/rateLimiter");

router.post("/send-otp", mfaSendOtpLimiter, sendLoginOtp);
router.post("/validate", mfaValidateLimiter, validateMfa);
router.post("/setup", mfaSetupLimiter, verifyToken, setupMfa);
router.post("/verify-setup", verifyToken, verifySetup);
router.post("/regenerate-backup-codes", mfaRegenerateLimiter, verifyToken, regenerateBackupCodes);
>>>>>>> 9bf1c8c315a2cb2d47809a078fcd5f7eb722c00c
router.post("/disable", verifyToken, disableMfaHandler);

module.exports = router;