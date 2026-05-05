const express = require("express");
const router = express.Router();

const transactionsController = require("../../controllers/transactions/transactionsController");
const getAllTransactions = require("../../controllers/transactions/getAllTransactionsController");
const getUserTransactionController = require("../../controllers/transactions/getUserTransactionController");

const verifytoken = require("../../middleware/verifyToken");
const allowTo = require("../../middleware/allowTo");

router.get("/user", verifytoken, getUserTransactionController);

router.get("/", verifytoken, allowTo("admin"), getAllTransactions);
router.post("/send", verifytoken, transactionsController.sendMoney);

module.exports = router;
