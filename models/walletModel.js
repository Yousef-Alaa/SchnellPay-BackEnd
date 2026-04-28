const sql = require("mssql");
const { poolPromise } = require("../config/db");


const deductBalance = async (transaction, userId, amount) => {
    const result = await new sql.Request(transaction)
    .input("amount", sql.Decimal(15, 2), amount)
    .input("user_id", sql.Int, userId)
    .query(`
        UPDATE WALLET
        SET balance = balance - @amount
        WHERE user_id = @user_id AND balance >= @amount
    `);

    return result.rowsAffected[0];
};

const addBalance = async (transaction, userId, amount) => {
    const result = await new sql.Request(transaction)
        .input("amount", sql.Decimal(15, 2), amount)
        .input("user_id", sql.Int, userId)
        .query(`
        UPDATE WALLET
        SET balance = balance + @amount
        WHERE user_id = @user_id
        `);

    return result.rowsAffected[0];
};

const getWalletByUserId = async (userId) => {
    const pool = await poolPromise;

    const result = await pool
        .request()
        .input("user_id", sql.Int, userId)
        .query(`
            SELECT balance, currency, wallet_status
            FROM WALLET
            WHERE user_id = @user_id
        `);

    return result.recordset[0] || null;
};

module.exports = { deductBalance, addBalance, getWalletByUserId };
