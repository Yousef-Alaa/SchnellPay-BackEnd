const express = require("express");
const router = express.Router();

const transactionsController = require("../../controllers/transactions/transactionsController");
const getAllTransactions = require("../../controllers/transactions/getAllTransactionsController");
const getUserTransactionController = require("../../controllers/transactions/getUserTransactionController");

const verifytoken = require("../../middleware/verifyToken");
const allowTo = require("../../middleware/allowTo");
const verifyTransactionPin = require("../../middleware/verifyPin");

router.get("/user", verifytoken, getUserTransactionController);

router.get("/", verifytoken, allowTo("admin"), getAllTransactions);
router.post(
  "/send",
  verifytoken,
  verifyTransactionPin,
  transactionsController.sendMoney,
);

module.exports = router;
