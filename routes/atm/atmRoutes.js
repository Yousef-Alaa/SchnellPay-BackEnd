const express = require("express");
const router = express.Router();
const {
  generatePin,
  verifyAtm,
  deposit,
  withdraw,
} = require("../../controllers/atm/atmController");
const {
  atmVerifyLimiter,
  atmDepositLimiter,
  atmWithdrawLimiter,
  atmGeneratePinLimiter,
} = require("../../middleware/rateLimiter");

/**
 * @swagger
 * /api/v1/atm/generate-pin:
 *   post:
 *     tags: [ATM]
 *     summary: Generate ATM PIN (send OTP to email)
 *     description: |
 *       Looks up the user by phone number, generates a 6-digit OTP (bcrypt-hashed, 10-min expiry),
 *       saves it in the USERS table, and emails it to the user.
 *       **No JWT required** — mirrors real ATM behavior.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AtmGeneratePinRequest'
 *     responses:
 *       200:
 *         description: OTP sent to registered email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 message: { type: string }
 *       404:
 *         description: No user with this phone number
 */

router.post("/generate-pin", atmGeneratePinLimiter, generatePin);
router.post("/verify", atmVerifyLimiter, verifyAtm);
router.post("/deposit", atmDepositLimiter, deposit);
router.post("/withdraw", atmWithdrawLimiter, withdraw);

module.exports = router;
