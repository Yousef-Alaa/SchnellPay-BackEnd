const express = require("express");
const router = express.Router();

const billsController = require("../../controllers/bills/billsController");

// TODO make all of them Private
router.get("/providers", billsController.getProviders);
router.get("/providers/:providerId/services", billsController.getServices);
router.post("/pay", billsController.payBill);

module.exports = router;
