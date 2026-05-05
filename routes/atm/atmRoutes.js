const express = require("express");
const router  = express.Router();
const { generatePin, verifyAtm, deposit, withdraw } = require("../../controllers/atm/atmController");

/**
 * ATM Routes — /api/v1/atm
 *
 * No auth middleware required. Credentials (username + atm_code) are
 * re-verified on every request, mirroring real ATM behaviour.
 */

router.post("/generate-pin", generatePin);
router.post("/verify",   verifyAtm);
router.post("/deposit",  deposit);
router.post("/withdraw", withdraw);

module.exports = router;