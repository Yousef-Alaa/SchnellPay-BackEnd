const express = require("express");
const router = express.Router();

const billsController = require("../controllers/billsController");

router.get("/providers", billsController.getProviders);
router.get("/providers/:providerId/services", billsController.getServices);
router.post("/pay", billsController.payBill);

module.exports = router;
