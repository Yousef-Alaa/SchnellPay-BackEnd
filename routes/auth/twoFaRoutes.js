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



router.post("/send-otp", sendLoginOtp);
router.post("/validate", validateMfa);
router.post("/setup", verifyToken, setupMfa);
router.post("/verify-setup", verifyToken, verifySetup);
router.post("/regenerate-backup-codes", verifyToken, regenerateBackupCodes);
router.post("/disable", verifyToken, disableMfaHandler);

module.exports = router;