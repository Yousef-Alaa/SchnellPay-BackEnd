const verifyToken = require("../../middleware/verifyToken");
const {
    getAllPaymentMethods,
    addCardMethod,
    addMobileWalletMethod,
    removePaymentMethod,
    setMethodAsDefault
} = require("../../controllers/paymentMethods/paymentMethodsController");
const express = require("express");
const router = express.Router();

/**
 * @swagger
 * /api/v1/payment-methods:
 *   get:
 *     tags: [Payment Methods]
 *     summary: Get all payment methods for the authenticated user
 *     description: Returns cards and mobile wallets linked to the user's account, joined from PAYMENT_METHODS, CARD_DETAILS, and MOBILE_WALLET_DETAILS tables. Ordered by default first.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of payment methods
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/PaymentMethod' }
 *       401:
 *         description: Unauthorized
 */
router.get("/", verifyToken, getAllPaymentMethods);

/**
 * @swagger
 * /api/v1/payment-methods/card:
 *   post:
 *     tags: [Payment Methods]
 *     summary: Add a credit/debit card
 *     description: Inserts into PAYMENT_METHODS (type='card') and CARD_DETAILS in a single SQL transaction. Not set as default by default.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddCardRequest'
 *           example:
 *             providerName: Visa
 *             cardNumber: "4111111111111111"
 *             expiryDate: "2027-12-01"
 *             cardHolderName: Ahmed Hassan
 *     responses:
 *       201:
 *         description: Card added
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string }
 *                 data:
 *                   type: object
 *                   properties:
 *                     methodId: { type: integer }
 *                     providerName: { type: string }
 *                     type: { type: string, example: card }
 *                     cardNumber: { type: string }
 *                     expiryDate: { type: string }
 *                     cardHolderName: { type: string }
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 */
router.post("/card", verifyToken, addCardMethod);

/**
 * @swagger
 * /api/v1/payment-methods/mobile:
 *   post:
 *     tags: [Payment Methods]
 *     summary: Add a mobile wallet
 *     description: Inserts into PAYMENT_METHODS (type='mobile wallet') and MOBILE_WALLET_DETAILS in a single SQL transaction. Not set as default by default.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddMobileWalletRequest'
 *           example:
 *             providerName: Vodafone Cash
 *             phoneNumber: "01012345678"
 *     responses:
 *       201:
 *         description: Mobile wallet added
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string }
 *                 data:
 *                   type: object
 *                   properties:
 *                     methodId: { type: integer }
 *                     providerName: { type: string }
 *                     phoneNumber: { type: string }
 *                     type: { type: string, example: mobile wallet }
 *       401:
 *         description: Unauthorized
 */
router.post("/mobile", verifyToken, addMobileWalletMethod);

/**
 * @swagger
 * /api/v1/payment-methods/{id}:
 *   delete:
 *     tags: [Payment Methods]
 *     summary: Remove a payment method
 *     description: Deletes from PAYMENT_METHODS where method_id = id AND user_id matches. Cascades to CARD_DETAILS or MOBILE_WALLET_DETAILS per DB FK definition.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: Payment method ID
 *     responses:
 *       200:
 *         description: Payment method deleted
 *       401:
 *         description: Unauthorized
 */
router.delete("/:id", verifyToken, removePaymentMethod);

/**
 * @swagger
 * /api/v1/payment-methods/{id}/default:
 *   patch:
 *     tags: [Payment Methods]
 *     summary: Set a payment method as default
 *     description: Uses a SQL transaction — first sets all user's methods to `is_default=0`, then sets the selected one to `is_default=1`.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: Payment method ID to set as default
 *     responses:
 *       200:
 *         description: Default payment method updated
 *       401:
 *         description: Unauthorized
 */
router.patch("/:id/default", verifyToken, setMethodAsDefault);

module.exports = router;