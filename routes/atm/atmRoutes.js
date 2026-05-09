const express = require("express");
const router  = express.Router();
const { generatePin, verifyAtm, deposit, withdraw } = require("../../controllers/atm/atmController");
const {
    atmVerifyLimiter,
    atmDepositLimiter,
    atmWithdrawLimiter,
    atmGeneratePinLimiter
} = require("../../middleware/rateLimiter");


/**
 * ATM Routes — /api/v1/atm
 *
 * No auth middleware required. Credentials (username + atm_code) are
 * re-verified on every request, mirroring real ATM behaviour.
 */

router.post("/generate-pin", atmGeneratePinLimiter, generatePin);
router.post("/verify", atmVerifyLimiter,  verifyAtm);
router.post("/deposit", atmDepositLimiter, deposit);
router.post("/withdraw", atmWithdrawLimiter, withdraw);

module.exports = router;