const verifyToken = require("../../middleware/verifyToken");
const verifyTransactionPin = require("../../middleware/verifyPin");
const { paymentMethodDeposit } = require("../../controllers/paymentMethods/depositMethodController");

const express = require("express");
const router = express.Router();

router.post("/",
    verifyToken,
    verifyTransactionPin,
    paymentMethodDeposit
);

module.exports = router;