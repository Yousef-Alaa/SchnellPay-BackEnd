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
 * tags:
 *   name: ATM
 *   description: Physical ATM Integration and Cardless Operations
 */

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
 *                 message: { type: string, example: OTP sent to email }
 *       404:
 *         description: No user with this phone number
 *       429:
 *         description: Rate limit exceeded
 */
router.post("/generate-pin", atmGeneratePinLimiter, generatePin);

/**
 * @swagger
 * /api/v1/atm/verify:
 *   post:
 *     tags: [ATM]
 *     summary: Verify ATM PIN/OTP
 *     description: Validates the 6-digit OTP generated via /generate-pin. If correct, returns a temporary session or success status for the ATM transaction.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AtmVerifyRequest'
 *     responses:
 *       200:
 *         description: Verification successful
 *       401:
 *         description: Invalid or expired PIN
 *       429:
 *         description: Rate limit exceeded
 */
router.post("/verify", atmVerifyLimiter, verifyAtm);

/**
 * @swagger
 * /api/v1/atm/deposit:
 *   post:
 *     tags: [ATM]
 *     summary: Cash Deposit via ATM
 *     description: Increases the balance of the specified payment method. Requires valid ATM verification context.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AtmDepositRequest'
 *     responses:
 *       200:
 *         description: Deposit successful
 *       400:
 *         description: Invalid amount or account details
 *       429:
 *         description: Rate limit exceeded
 */
router.post("/deposit", atmDepositLimiter, deposit);

/**
 * @swagger
 * /api/v1/atm/withdraw:
 *   post:
 *     tags: [ATM]
 *     summary: Cash Withdrawal via ATM
 *     description: Decreases the balance after checking for sufficient funds in the specific payment method.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AtmWithdrawRequest'
 *     responses:
 *       200:
 *         description: Withdrawal successful
 *       400:
 *         description: Insufficient balance or invalid amount
 *       429:
 *         description: Rate limit exceeded
 */
router.post("/withdraw", atmWithdrawLimiter, withdraw);

module.exports = router;
