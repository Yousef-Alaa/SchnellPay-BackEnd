const verifyToken = require("../../middleware/verifyToken");
const verifyTransactionPin = require("../../middleware/verifyPin");
const { paymentMethodDeposit } = require("../../controllers/paymentMethods/depositMethodController");

const express = require("express");
const router = express.Router();

/**
 * @swagger
 * /api/v1/wallet/deposit:
 *   post:
 *     tags: [Wallet]
 *     summary: Deposit funds via a saved payment method
 *     description: |
 *       Adds funds to the user's SchnellPay wallet using a registered payment method.
 *       - If `method_id` is provided: verifies ownership before using it.
 *       - If omitted: uses the user's default payment method automatically.
 *       Requires a valid 6-digit transaction PIN.
 *       Creates an ATM-type deposit transaction record and sends a notification.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WalletDepositRequest'
 *           example:
 *             amount: 1000.00
 *             method_id: 7
 *             transaction_pin: "123456"
 *     responses:
 *       200:
 *         description: Deposit successful
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
 *                     reference: { type: string, example: DEP-1715000000000-A1B2C3D4 }
 *                     amount: { type: number }
 *                     currency: { type: string, example: EGP }
 *                     new_balance: { type: number }
 *                     method_used: { type: integer }
 *       400:
 *         description: Invalid amount / no payment method found / no default method
 *       403:
 *         description: Invalid transaction PIN / payment method not owned by user
 *       500:
 *         description: Wallet update failed
 *       401:
 *         description: Unauthorized
 */
router.post("/", verifyToken, verifyTransactionPin, paymentMethodDeposit);

module.exports = router;