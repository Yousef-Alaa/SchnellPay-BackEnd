const express = require("express");
const router = express.Router();

const billsController = require("../../controllers/bills/billsController");
const verifyToken = require("../../middleware/verifyToken");

// TODO make all of them Private
router.get("/providers", verifyToken, billsController.getProviders);
router.get(
  "/providers/:providerId/services",
  verifyToken,
  billsController.getServices,
);
router.post("/pay", verifyToken, billsController.payBill);

module.exports = router;
