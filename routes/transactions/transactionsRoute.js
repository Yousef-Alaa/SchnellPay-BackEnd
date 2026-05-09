const express = require("express");
const router = express.Router();

const transactionsController = require("../../controllers/transactions/transactionsController");
const getAllTransactions = require("../../controllers/transactions/getAllTransactionsController");
const getUserTransactionController = require("../../controllers/transactions/getUserTransactionController");

const verifytoken = require("../../middleware/verifyToken");
const allowTo = require("../../middleware/allowTo");
const verifyTransactionPin = require("../../middleware/verifyPin");

/**
 * @swagger
 * /api/v1/transactions/user:
 *   get:
 *     tags: [Transactions]
 *     summary: Get own transaction history
 *     description: Returns paginated transactions where the authenticated user is either sender or receiver. Supports filtering by type, status, and date range.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [transfer, bill, deposit, withdraw] }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [completed, pending, failed] }
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date-time }
 *         description: Filter transactions after this datetime
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date-time }
 *         description: Filter transactions before this datetime
 *     responses:
 *       200:
 *         description: Paginated transaction list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 results: { type: integer }
 *                 total: { type: integer }
 *                 page: { type: integer }
 *                 totalPages: { type: integer }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Transaction' }
 *       401:
 *         description: Unauthorized
 */
router.get("/user", verifytoken, getUserTransactionController);

/**
 * @swagger
 * /api/v1/transactions:
 *   get:
 *     tags: [Transactions]
 *     summary: Get all transactions (Admin)
 *     description: Paginated list of all system transactions with optional filters. Admin only.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [transfer, bill, deposit, withdraw] }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [completed, pending, failed] }
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: Paginated transaction list with sender/receiver names
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 results: { type: integer }
 *                 total: { type: integer }
 *                 page: { type: integer }
 *                 totalPages: { type: integer }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Transaction' }
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.get("/", verifytoken, allowTo("admin"), getAllTransactions);

/**
 * @swagger
 * /api/v1/transactions/send:
 *   post:
 *     tags: [Transactions]
 *     summary: Send money to another user (P2P transfer)
 *     description: |
 *       Transfers funds from the authenticated user's wallet to the receiver's wallet using a DB-level SQL transaction (atomic).
 *       Requires a valid 6-digit transaction PIN.
 *       - Cannot send to yourself.
 *       - Deducts balance atomically (race-condition safe via SQL WHERE balance >= amount).
 *       - Creates a reference number (16 hex chars) and notifications for both parties.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SendMoneyRequest'
 *           example:
 *             receiver_username: sara22
 *             amount: 250.00
 *             description: Lunch split
 *             transaction_pin: "123456"
 *     responses:
 *       200:
 *         description: Transfer successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: Transaction successful }
 *                 data:
 *                   type: object
 *                   properties:
 *                     reference: { type: string, example: a1b2c3d4e5f60011 }
 *       400:
 *         description: Missing fields / invalid amount / insufficient balance / self-transfer
 *       403:
 *         description: Invalid transaction PIN
 *       404:
 *         description: Sender or receiver not found
 *       401:
 *         description: Unauthorized
 */
router.post("/send", verifytoken, verifyTransactionPin, transactionsController.sendMoney);

module.exports = router;
