const crypto = require("crypto");
const { sql, poolPromise } = require("../config/db");

const AppError = require("../utils/appError")
const asyncWrapper = require("../middleware/asyncWrapper");

const { findByUsername } = require("../models/userModel")
const { deductBalance, addBalance } = require("../models/walletModel");
const { createTransaction } = require("../models/transactionModel");

exports.sendMoney = asyncWrapper(async (req, res, next) => {
    
    const {
        sender_username,
        receiver_username,
        amount,
        description,
    } = req.body;

    if (sender_username === receiver_username) {
        return next(AppError.create("Cannot transfer to yourself", 400, false));
    }

    if (!amount || amount <= 0) {
        return next(AppError.create("Invalid amount", 400, false));
    }

    const sender = await findByUsername(sender_username);
    if (!sender) {
        return next(AppError.create("Sender not found", 400, false));
    }

    const receiver = await findByUsername(receiver_username);
    if (!receiver) {
        return next(AppError.create("Receiver not found", 400, false));
    }

    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);


    try {

        await transaction.begin();

        const deducted = await deductBalance(transaction, sender.user_id, amount);

        if (!deducted) {
            await transaction.rollback();
            return next(AppError.create("Insufficient balance", 400, false));
        }

        const added = await addBalance(transaction, receiver.user_id, amount);

        if (!added) {
            await transaction.rollback();
            return next(AppError.create("Receiver wallet not found", 400, false));
        }

        const refNumber = crypto.randomBytes(8).toString("hex");

        await createTransaction(
            transaction,
            sender.user_id,
            receiver.user_id,
            amount,
            description,
            refNumber
        );

        await transaction.commit();

        res.json({
            success: true,
            message: "Transaction successful",
            data: { reference: refNumber },
        });

    } catch (err) {
        await transaction.rollback();
        next(err);
    }
});