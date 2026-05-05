const verifyToken = require("../../middleware/verifyToken");
const { paymentMethodDeposit } = require("../../controllers/paymentMethods/depositMethodController");

const express = require("express");
const router = express.Router();

router.post("/", verifyToken, paymentMethodDeposit);

module.exports = router;