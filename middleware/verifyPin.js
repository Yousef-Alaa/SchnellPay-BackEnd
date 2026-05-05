const appError = require("../utils/appError");
const transactionModel = require("../models/transactionModel");

const bcrypt = require("bcrypt");

const verifyTransactionPin = async (req, res, next) => {
  try {
    const { transaction_pin } = req.body;

    const userId = req.user.id;

    if (!transaction_pin) {
      return next(appError.create("Transaction PIN is required", 400, false));
    }

    const hashedPin = await transactionModel.getPinByUserId(userId);

    if (!hashedPin) {
      return next(appError.create("User not found", 404, false));
    }

    const isMatch = await bcrypt.compare(transaction_pin, hashedPin);

    if (!isMatch) {
      return next(appError.create("Invalid Transaction PIN", 403, false));
    }

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = verifyTransactionPin;
