const sql = require('mssql');
const { poolPromise } = require('../config/db');

const addMobileWallet = async (userId, walletData) => {
    const { providerName, phoneNumber } = walletData;
    
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        // first: Insert into PAYMENT_METHODS ---
        const request1 = new sql.Request(transaction);
        const result1 = await request1
            .input('userId', sql.Int, userId)
            .input('providerName', sql.VarChar(100), providerName)
            .input('methodType', sql.VarChar(50), 'mobile wallet') 
            .input('isDefault', sql.Bit, 0)
            .query(`
                INSERT INTO PAYMENT_METHODS (user_id, provider_name, method_type, is_default)
                OUTPUT inserted.method_id
                VALUES (@userId, @providerName, @methodType, @isDefault);
            `);

        const methodId = result1.recordset[0].method_id;

        // then: Insert into MOBILE_WALLET_DETAILS ---
        const request2 = new sql.Request(transaction);
        await request2
            .input('methodId', sql.Int, methodId)
            .input('userId', sql.Int, userId)
            .input('phoneNumber', sql.VarChar(20), phoneNumber)
            .query(`
                INSERT INTO MOBILE_WALLET_DETAILS (method_id, user_id, phone_number)
                VALUES (@methodId, @userId, @phoneNumber);
            `);

        await transaction.commit();

        return { 
            methodId, 
            userId, 
            providerName, 
            phoneNumber, 
            type: 'mobile wallet' 
        };

    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

module.exports = {
    addMobileWallet
};