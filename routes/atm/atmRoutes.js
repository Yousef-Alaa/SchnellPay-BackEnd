const express = require("express");
const router  = express.Router();
const { verifyAtm, checkBalance, deposit, withdraw } = require("../../controllers/atm/atmController");

/**
 * ATM Routes — /api/v1/atm
 *
 * No auth middleware required. Credentials (username + atm_code) are
 * re-verified on every request, mirroring real ATM behaviour.
 */

router.post("/verify",   verifyAtm);
router.post("/deposit",  deposit);
router.post("/withdraw", withdraw);

module.exports = router;