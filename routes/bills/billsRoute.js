const express = require("express");
const router = express.Router();

const billsController = require("../../controllers/bills/billsController");
const billsAdminController = require("../../controllers/bills/billsAdminController");
const verifyToken = require("../../middleware/verifyToken");
const verifyTransactionPin = require("../../middleware/verifyPin");
const allowTo = require("../../middleware/allowTo");
const { billPayLimiter } = require("../../middleware/rateLimiter");

// ── User Routes ──────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/bills/history:
 *   get:
 *     tags: [Bills]
 *     summary: Get own bill payment history
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of bill payments made by the user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: array, items: { type: object } }
 *       401:
 *         description: Unauthorized
 */
router.get("/history", verifyToken, billsController.getUserBills);

/**
 * @swagger
 * /api/v1/bills/providers:
 *   get:
 *     tags: [Bills]
 *     summary: Get all active bill providers
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of active providers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Provider' }
 */
router.get("/providers", verifyToken, billsController.getProviders);

/**
 * @swagger
 * /api/v1/bills/services:
 *   get:
 *     tags: [Bills]
 *     summary: Get all active bill services
 *     description: Returns all active services across all active providers, joined with provider name.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of active services
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Service' }
 */
router.get("/services", verifyToken, billsController.getAllServicesUser);

/**
 * @swagger
 * /api/v1/bills/providers/{providerId}/services:
 *   get:
 *     tags: [Bills]
 *     summary: Get active services for a specific provider
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: providerId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Services for the given provider
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Service' }
 */
router.get(
  "/providers/:providerId/services",
  verifyToken,
  billsController.getServices,
);

/**
 * @swagger
 * /api/v1/bills/pay:
 *   post:
 *     tags: [Bills]
 *     summary: Pay a bill
 *     description: |
 *       Deducts `amount + service.fee` from the user's wallet atomically.
 *       Requires a valid 6-digit transaction PIN.
 *       Creates a `TRANSACTIONS` record (type: bill) and a `BILL_DETAILS` record.
 *       Sends a success notification.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PayBillRequest'
 *           example:
 *             service_id: 3
 *             amount: 150.00
 *             consumer_number: EG-12345678
 *             transaction_pin: "123456"
 *     responses:
 *       200:
 *         description: Bill paid successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string, example: Bill paid successfully }
 *                 data:
 *                   type: object
 *                   properties:
 *                     transaction_id: { type: integer }
 *                     reference: { type: string }
 *                     totalAmount: { type: number }
 *       400:
 *         description: Invalid amount / service not found / insufficient balance
 *       403:
 *         description: Invalid transaction PIN
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/pay",
  billPayLimiter,
  verifyToken,
  verifyTransactionPin,
  billsController.payBill,
);

// ── Admin Routes ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/bills/admin/history:
 *   get:
 *     tags: [Bills]
 *     summary: Get all bill payment history (Admin)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All bill payments in the system
 *       403:
 *         description: Admin access required
 */
router.get(
  "/admin/history",
  verifyToken,
  allowTo("admin"),
  billsAdminController.getAllBillsAdmin,
);

/**
 * @swagger
 * /api/v1/bills/admin/history/{userId}:
 *   get:
 *     tags: [Bills]
 *     summary: Get bill history for a specific user (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Bill history for user
 *       403:
 *         description: Admin access required
 */
router.get(
  "/admin/history/:userId",
  verifyToken,
  allowTo("admin"),
  billsAdminController.getUserBillsAdmin,
);

/**
 * @swagger
 * /api/v1/bills/admin/providers:
 *   get:
 *     tags: [Bills]
 *     summary: Get all providers including inactive (Admin)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All providers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Provider' }
 *   post:
 *     tags: [Bills]
 *     summary: Create a new bill provider (Admin)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProviderRequest'
 *     responses:
 *       201:
 *         description: Provider created
 *       400:
 *         description: Name and code are required
 */
router.get(
  "/admin/providers",
  verifyToken,
  allowTo("admin"),
  billsAdminController.getAllAdminProviders,
);
router.post(
  "/admin/providers",
  verifyToken,
  allowTo("admin"),
  billsAdminController.addProvider,
);

/**
 * @swagger
 * /api/v1/bills/admin/providers/{id}:
 *   put:
 *     tags: [Bills]
 *     summary: Update a provider (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProviderRequest'
 *     responses:
 *       200:
 *         description: Provider updated
 *   delete:
 *     tags: [Bills]
 *     summary: Delete a provider (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Provider deleted
 */
router.put(
  "/admin/providers/:id",
  verifyToken,
  allowTo("admin"),
  billsAdminController.editProvider,
);
router.delete(
  "/admin/providers/:id",
  verifyToken,
  allowTo("admin"),
  billsAdminController.removeProvider,
);

/**
 * @swagger
 * /api/v1/bills/admin/services:
 *   get:
 *     tags: [Bills]
 *     summary: Get all services including inactive (Admin)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All services
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Service' }
 *   post:
 *     tags: [Bills]
 *     summary: Create a new bill service (Admin)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ServiceRequest'
 *     responses:
 *       201:
 *         description: Service created
 *       400:
 *         description: provider_id and service_name are required
 */
router.get(
  "/admin/services",
  verifyToken,
  allowTo("admin"),
  billsAdminController.getAllAdminServices,
);
router.post(
  "/admin/services",
  verifyToken,
  allowTo("admin"),
  billsAdminController.addService,
);

/**
 * @swagger
 * /api/v1/bills/admin/services/{id}:
 *   put:
 *     tags: [Bills]
 *     summary: Update a service (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ServiceRequest'
 *     responses:
 *       200:
 *         description: Service updated
 *   delete:
 *     tags: [Bills]
 *     summary: Delete a service (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Service deleted
 */
router.put(
  "/admin/services/:id",
  verifyToken,
  allowTo("admin"),
  billsAdminController.editService,
);
router.delete(
  "/admin/services/:id",
  verifyToken,
  allowTo("admin"),
  billsAdminController.removeService,
);

module.exports = router;
