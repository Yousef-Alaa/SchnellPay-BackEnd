const sql = require("mssql");

const createTransaction = async (
    transaction,
    senderId,
    receiverId,
    amount,
    description,
    reference
) => {
    await new sql.Request(transaction)
        .input("sender_id", sql.Int, senderId)
        .input("receiver_id", sql.Int, receiverId)
        .input("amount", sql.Decimal(15, 2), amount)
        .input("desc", sql.VarChar, description)
        .input("ref", sql.VarChar, reference)
        .query(`
        INSERT INTO TRANSACTIONS (
            transaction_type,
            sender_id,
            receiver_id,
            amount,
            status,
            description,
            reference_number
        )
        VALUES (
            'transfer',
            @sender_id,
            @receiver_id,
            @amount,
            'completed',
            @desc,
            @ref
        )
        `);
};

// models/transaction.model.js
const sql = require("mssql");

const createBillTransaction = async (transaction, userId, amount, reference) => {
    const result = await new sql.Request(transaction)
        .input("user_id", sql.Int, userId)
        .input("amount", sql.Decimal(15, 2), amount)
        .input("ref", sql.VarChar, reference)
        .query(`
        INSERT INTO TRANSACTIONS 
        (transaction_type, sender_id, amount, status, description, reference_number)
        OUTPUT INSERTED.transaction_id
        VALUES ('bill', @user_id, @amount, 'completed', 'Bill Payment', @ref)
        `);

    return result.recordset[0].transaction_id;
};

module.exports = { createBillTransaction, createTransaction };