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

module.exports = { createTransaction };