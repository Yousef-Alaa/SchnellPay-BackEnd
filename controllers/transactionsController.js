const crypto = require("crypto");
const { sql, poolPromise } = require("../config/db");

const AppError = require("../utils/appError")
const { findByUsername } = require("../models/userModel")
const asyncWrapper = require("../middleware/asyncWrapper");

exports.sendMoney = asyncWrapper(async (req, res, next) => {
    const {
        sender_username,
        receiver_username,
        amount,
        description,
    } = req.body;

    if (sender_username === receiver_username) 
        return next(AppError.create("Cannot transfer to yourself", 400, false));
    

    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);

    try {

        await transaction.begin();

        const sender = await findByUsername(sender_username);
        
        if (!sender) {
            await transaction.rollback();
            return next(AppError.create("Sender not found", 400, false));
        }

        const receiver = await findByUsername(receiver_username);
        
        if (!receiver) {
            await transaction.rollback();
            return next(AppError.create("Receiver not found", 400, false));
        }

        const deductResult = await new sql.Request(transaction)
        .input("amount", sql.Decimal(15, 2), amount)
        .input("sender_id", sql.Int, sender.user_id)
        .query(`
            UPDATE wallet
            SET balance = balance - @amount
            WHERE user_id = @sender_id AND balance >= @amount
        `);

        if (deductResult.rowsAffected[0] === 0) {
            await transaction.rollback();
            return next(AppError.create("Insufficient balance", 400, false));
        }

        const addResult = await new sql.Request(transaction)
        .input("amount", sql.Decimal(15, 2), amount)
        .input("receiver_id", sql.Int, receiver.user_id)
        .query(`
            UPDATE wallet
            SET balance = balance + @amount
            WHERE user_id = @receiver_id
        `);

        if (addResult.rowsAffected[0] === 0) {
            await transaction.rollback();
            return next(AppError.create("Receiver wallet not found", 400, false));
        }

        const refNumber = crypto.randomBytes(8).toString("hex");

        await new sql.Request(transaction)
        .input("sender_id", sql.Int, sender.user_id)
        .input("receiver_id", sql.Int, receiver.user_id)
        .input("amount", sql.Decimal(15, 2), amount)
        .input("desc", sql.VarChar, description)
        .input("refNum", sql.VarChar, refNumber)
        .query(`
            INSERT INTO transactions (
            transaction_type,
            sender_id,
            receiver_id,
            amount,
            status,
            description,
            reference_number
            ) VALUES (
            'transfer',
            @sender_id,
            @receiver_id,
            @amount,
            'Success',
            @desc,
            @refNum
            )
        `);

        await transaction.commit();

        res.json({
        success: true,
        message: "Transaction successful",
        });

    } catch (err) {
        await transaction.rollback();
        next(err);
    }
});