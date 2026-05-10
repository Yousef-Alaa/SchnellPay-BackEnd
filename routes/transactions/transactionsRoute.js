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
router.patch("/:id/status", verifytoken, allowTo("admin"), transactionsController.updateStatus);
router.post("/:id/refund", verifytoken, allowTo("admin"), transactionsController.refundTransaction);

router.post(
  "/send",
  verifytoken,
  verifyTransactionPin,
  transactionsController.sendMoney,
);

module.exports = router;
