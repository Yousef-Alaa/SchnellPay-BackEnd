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

/**
 * Log an ATM deposit or withdrawal.
 * type: 'deposit' | 'withdraw'
 * For deposits  → sender_id = NULL, receiver_id = userId  (money coming in)
 * For withdraws → sender_id = userId, receiver_id = NULL  (money going out)
 */
const createAtmTransaction = async (transaction, userId, amount, type, reference) => {
    
    const isDeposit = type === "deposit";

    await new sql.Request(transaction)
        .input("user_id",     sql.Int,          userId)
        .input("amount",      sql.Decimal(15,2), amount)
        .input("type",        sql.VarChar,       type)
        .input("desc",        sql.VarChar,       isDeposit ? "ATM Deposit" : "ATM Withdrawal")
        .input("ref",         sql.VarChar,       reference)
        .input("sender_id",   sql.Int,           isDeposit ? null   : userId)
        .input("receiver_id", sql.Int,           isDeposit ? userId : null)
        .query(`
            INSERT INTO TRANSACTIONS
                (transaction_type, sender_id, receiver_id, amount, status, description, reference_number)
            VALUES
                (@type, @sender_id, @receiver_id, @amount, 'completed', @desc, @ref)
        `);
};

module.exports = { createBillTransaction, createTransaction, createAtmTransaction };