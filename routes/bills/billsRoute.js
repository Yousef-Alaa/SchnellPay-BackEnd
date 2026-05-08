const express = require("express");
const router = express.Router();

const billsController = require("../../controllers/bills/billsController");
const billsAdminController = require("../../controllers/bills/billsAdminController");
const verifyToken = require("../../middleware/verifyToken");
const verifyTransactionPin = require("../../middleware/verifyPin");
const allowTo = require("../../middleware/allowTo");

// --- User Routes ---
router.get("/history", verifyToken, billsController.getUserBills);
router.get("/providers", verifyToken, billsController.getProviders);
router.get("/services", verifyToken, billsController.getAllServicesUser);
router.get(
  "/providers/:providerId/services",
  verifyToken,
  billsController.getServices
);

router.post("/pay", verifyToken, verifyTransactionPin, billsController.payBill);

// --- Admin Routes ---
// History
router.get("/admin/history", verifyToken, allowTo("admin"), billsAdminController.getAllBillsAdmin);
router.get("/admin/history/:userId", verifyToken, allowTo("admin"), billsAdminController.getUserBillsAdmin);

// Providers
router.get("/admin/providers", verifyToken, allowTo("admin"), billsAdminController.getAllAdminProviders);
router.post("/admin/providers", verifyToken, allowTo("admin"), billsAdminController.addProvider);
router.put("/admin/providers/:id", verifyToken, allowTo("admin"), billsAdminController.editProvider);
router.delete("/admin/providers/:id", verifyToken, allowTo("admin"), billsAdminController.removeProvider);

// Services
router.get("/admin/services", verifyToken, allowTo("admin"), billsAdminController.getAllAdminServices);
router.post("/admin/services", verifyToken, allowTo("admin"), billsAdminController.addService);
router.put("/admin/services/:id", verifyToken, allowTo("admin"), billsAdminController.editService);
router.delete("/admin/services/:id", verifyToken, allowTo("admin"), billsAdminController.removeService);

module.exports = router;
