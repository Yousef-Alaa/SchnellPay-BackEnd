const sql = require("mssql");

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

module.exports = { deductBalance, addBalance };
