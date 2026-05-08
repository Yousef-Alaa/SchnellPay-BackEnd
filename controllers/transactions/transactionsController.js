const crypto = require("crypto");
const { sql, poolPromise } = require("../../config/db");

const AppError = require("../../utils/appError");
const asyncWrapper = require("../../middleware/asyncWrapper");

const { findByUsername, findById } = require("../../models/userModel");
const { deductBalance, addBalance } = require("../../models/walletModel");
const { createTransaction } = require("../../models/transactionModel");
const { createNotification } = require("../../utils/notificationHelper");

// @desc Send Money To another user
// @route POST /api/v1/transactions/send
// @access Private
exports.sendMoney = asyncWrapper(async (req, res, next) => {
    const { receiver_username, amount, description } = req.body;

    if (!receiver_username || !amount) return next(AppError.create("Missing required fields", 400, false));

    if (!amount || amount <= 0) return next(AppError.create("Invalid amount", 400, false));
    

    const [sender, receiver] = await Promise.all([
        findById(req.user.id),
        findByUsername(receiver_username)
    ]);


    if (!sender) return next(AppError.create("Sender not found", 400, false));
    if (sender.username === receiver_username) return next(AppError.create("Cannot transfer to yourself", 400, false));
    if (!receiver) return next(AppError.create("Receiver not found", 400, false));
    

    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    let transactionStarted = false;
    
    try {

        await transaction.begin();
        transactionStarted = true;
        

        const deducted = await deductBalance(transaction, sender.user_id, amount);
        if (!deducted) throw AppError.create("Insufficient balance", 400, false);


        const added = await addBalance(transaction, receiver.user_id, amount);
        if (!added) throw  AppError.create("Receiver wallet not found", 400, false);
        

        const refNumber = crypto.randomBytes(8).toString("hex");

        await createTransaction(
            transaction,
            sender.user_id,
            receiver.user_id,
            amount,
            description,
            refNumber,
        );

        await transaction.commit();
        transactionStarted = false;

        // Create notifications for both sender and receiver
        await createNotification(
            sender.user_id,
            "Money Sent",
            `You successfully sent ${amount} EGP to ${receiver_username}. Ref: ${refNumber}`,
            "TRANSACTION",
            sender.email,
        );

        await createNotification(
            receiver.user_id,
            "Money Received",
            `You received ${amount} EGP from ${sender.username}. Ref: ${refNumber}`,
            "TRANSACTION",
            receiver.email,
        );

        res.json({
        success: true,
        message: "Transaction successful",
        data: { reference: refNumber },
        });

    } catch (err) {
        if (transactionStarted) await transaction.rollback();
        next(err);
    }
});
