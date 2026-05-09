const express = require("express");
const router  = express.Router();
const { generatePin, verifyAtm, deposit, withdraw } = require("../../controllers/atm/atmController");

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
router.post("/generate-pin", generatePin);

/**
 * @swagger
 * /api/v1/atm/verify:
 *   post:
 *     tags: [ATM]
 *     summary: Verify ATM credentials and get balance
 *     description: |
 *       Validates phone + atm_code. Returns account name and current wallet balance.
 *       Sends an "ATM Accessed" notification to the user.
 *       **⚠️ Known bug**: The expiry check in resolveUser is inverted — the code currently accepts codes AFTER expiry.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AtmVerifyRequest'
 *     responses:
 *       200:
 *         description: Credentials valid. Returns name and balance.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string }
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         phone: { type: string }
 *                         name: { type: string }
 *                     wallet:
 *                       type: object
 *                       properties:
 *                         balance: { type: number }
 *                         currency: { type: string }
 *       400:
 *         description: Missing fields / invalid ATM code format
 *       401:
 *         description: Invalid credentials / expired code
 *       403:
 *         description: Wallet is suspended
 *       404:
 *         description: Wallet not found
 */
router.post("/verify", verifyAtm);

/**
 * @swagger
 * /api/v1/atm/deposit:
 *   post:
 *     tags: [ATM]
 *     summary: ATM deposit funds into wallet
 *     description: |
 *       Validates credentials on every call. Adds funds to the wallet within a SQL transaction.
 *       Maximum single deposit: 50,000 EGP.
 *       Creates an ATM transaction record and sends a deposit notification.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AtmTransactionRequest'
 *           example:
 *             phone: "01012345678"
 *             atm_code: "849201"
 *             amount: 500.00
 *     responses:
 *       200:
 *         description: Deposit successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string }
 *                 data:
 *                   type: object
 *                   properties:
 *                     reference: { type: string }
 *                     amount: { type: number }
 *                     currency: { type: string }
 *                     new_balance: { type: number }
 *       400:
 *         description: Invalid amount / exceeds max deposit (50,000)
 *       401:
 *         description: Invalid credentials
 */
router.post("/deposit", deposit);

/**
 * @swagger
 * /api/v1/atm/withdraw:
 *   post:
 *     tags: [ATM]
 *     summary: ATM withdrawal from wallet
 *     description: |
 *       Validates credentials on every call. Deducts funds atomically (SQL WHERE balance >= amount to prevent race conditions).
 *       Maximum single withdrawal: 20,000 EGP.
 *       Creates an ATM transaction record and sends a withdrawal notification.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AtmTransactionRequest'
 *           example:
 *             phone: "01012345678"
 *             atm_code: "849201"
 *             amount: 200.00
 *     responses:
 *       200:
 *         description: Withdrawal successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string }
 *                 data:
 *                   type: object
 *                   properties:
 *                     reference: { type: string }
 *                     amount: { type: number }
 *                     currency: { type: string }
 *                     new_balance: { type: number }
 *       400:
 *         description: Invalid amount / exceeds max withdrawal (20,000) / insufficient balance
 *       401:
 *         description: Invalid credentials
 */
router.post("/withdraw", withdraw);

module.exports = router;