const sql = require('mssql');
const { poolPromise } = require('../config/db');


 // Retrieves all payment methods for a user with joining the 
 // details from Cards and Mobile Wallets tables
 
const getPaymentMethodsByUserId = async (userId) => {
    const pool = await poolPromise;
    
    const result = await pool.request()
        .input('userId', sql.Int, userId)
        .query(`
            SELECT 
                pm.method_id, 
                pm.provider_name, 
                pm.method_type, 
                pm.is_default,
                cd.card_number,
                mw.phone_number
            FROM PAYMENT_METHODS pm
            LEFT JOIN CARD_DETAILS cd 
                ON pm.method_id = cd.method_id AND pm.user_id = cd.user_id
            LEFT JOIN MOBILE_WALLET_DETAILS mw 
                ON pm.method_id = mw.method_id AND pm.user_id = mw.user_id
            WHERE pm.user_id = @userId
            ORDER BY pm.is_default DESC, pm.method_id ASC;
        `);

    return result.recordset;
};


// For Deposite 
// Verifies if a specific payment method exists and belongs to the user

const verifyPaymentMethodOwnership = async (userId, methodId) => {
    const pool = await poolPromise;
    
    const result = await pool.request()
        .input('userId', sql.Int, userId)
        .input('methodId', sql.Int, methodId)
        .query(`
            SELECT method_id 
            FROM PAYMENT_METHODS 
            WHERE method_id = @methodId AND user_id = @userId;
        `);

    // Returns true if exactly 1 record is found, otherwise false
    return result.recordset.length > 0;
};


// Delete
// recursively deletes corresponding card or mobile wallet due to DB definiton

const deletePaymentMethod = async (userId, methodId) => {
    const pool = await poolPromise;
    
    const result = await pool.request()
        .input('userId', sql.Int, userId)
        .input('methodId', sql.Int, methodId)
        .query(`
            DELETE FROM PAYMENT_METHODS 
            WHERE method_id = @methodId AND user_id = @userId;
        `);

    // Returns true if a row was actually deleted
    return result.rowsAffected[0] > 0;
};


 // Sets a specific payment method as the default for the user using a transaction.
 
const setDefaultPaymentMethod = async (userId, methodId) => {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    let transactionStarted = false;

    try {
        await transaction.begin();
        transactionStarted = true;

        // first: Set ALL of the user's payment methods to NOT default (0)
        await new sql.Request(transaction)
            .input('userId', sql.Int, userId)
            .query(`
                UPDATE PAYMENT_METHODS 
                SET is_default = 0 
                WHERE user_id = @userId;
            `);

        // then: Set the requested payment method to default (1)
        const request2 = new sql.Request(transaction);
        const result = await request2
            .input('userId', sql.Int, userId)
            .input('methodId', sql.Int, methodId)
            .query(`
                UPDATE PAYMENT_METHODS 
                SET is_default = 1 
                WHERE method_id = @methodId AND user_id = @userId;
            `);

        await transaction.commit();
        transactionStarted = false;
        
        return result.rowsAffected[0] > 0;

    } catch (error) {
        if (transactionStarted) await transaction.rollback();
        throw error;
    }
};

module.exports = {
    getPaymentMethodsByUserId,
    deletePaymentMethod,
    setDefaultPaymentMethod,
    verifyPaymentMethodOwnership
};