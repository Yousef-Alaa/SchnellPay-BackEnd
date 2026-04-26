const crypto = require("crypto");
const { sql, poolPromise } = require("../config/db");

exports.sendMoney = async (req, res) => {
    
    const {
        sender_username,
        receiver_username,
        amount,
        description,
    } = req.body;


    if (sender_username === receiver_username) return res.status(400).json({ error: "Cannot transfer to yourself" });

    try {
        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);

        await transaction.begin();

        const getUsers = await new sql.Request(transaction)
        .input("sender", sql.VarChar, sender_username)
        .input("receiver", sql.VarChar, receiver_username)
        .query(`
            SELECT user_id, user_name 
            FROM users 
            WHERE user_name = @sender OR user_name = @receiver
        `);

        if (getUsers.recordset.length < 2) throw new Error("Sender or receiver not found");

        let sender_id, receiver_id;

        getUsers.recordset.forEach(user => {
            if (user.user_name === sender_username) sender_id = user.user_id;
            if (user.user_name === receiver_username) receiver_id = user.user_id;
        });

        const deductResult = await new sql.Request(transaction)
        .input("amount", sql.Decimal(15, 2), amount)
        .input("sender_id", sql.Int, sender_id)
        .query(`
            UPDATE wallet
            SET balance = balance - @amount
            WHERE user_id = @sender_id AND balance >= @amount
        `);

        if (deductResult.rowsAffected[0] === 0) throw new Error("Insufficient balance");
        

        const addResult = await new sql.Request(transaction)
        .input("amount", sql.Decimal(15, 2), amount)
        .input("receiver_id", sql.Int, receiver_id)
        .query(`
            UPDATE wallet
            SET balance = balance + @amount
            WHERE user_id = @receiver_id
        `);

        if (addResult.rowsAffected[0] === 0) throw new Error("Receiver wallet not found");

        const refNumber = crypto.randomBytes(8).toString("hex");

        await new sql.Request(transaction)
        .input("sender_id", sql.Int, sender_id)
        .input("receiver_id", sql.Int, receiver_id)
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
        // rollback on error
        try {
            await transaction.rollback();
        } catch (e) {}

        res.status(500).json({
            success: false,
            error: err.message,
        });
    }
    };