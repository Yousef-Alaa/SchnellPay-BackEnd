const verifyToken = require("../../middleware/verifyToken");
const verifyTransactionPin = require("../../middleware/verifyPin");
const { paymentMethodDeposit } = require("../../controllers/paymentMethods/depositMethodController");

const express = require("express");
const router = express.Router();
const { walletDepositLimiter } = require("../../middleware/rateLimiter");

router.post("/",
    walletDepositLimiter,
    verifyToken,
    verifyTransactionPin,
    paymentMethodDeposit
);

module.exports = router;