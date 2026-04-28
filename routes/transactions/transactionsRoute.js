const express = require("express");
const router = express.Router();

const transactionsController = require("../../controllers/transactions/transactionsController");

router.post("/send", transactionsController.sendMoney);

module.exports = router;
