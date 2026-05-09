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
router.post("/disable", verifyToken, disableMfaHandler);

module.exports = router;