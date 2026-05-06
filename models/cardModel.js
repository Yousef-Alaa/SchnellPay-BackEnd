const sql = require('mssql');
const { poolPromise } = require('../config/db');

const addCard = async (userId, cardData) => {
    const { 
        providerName, 
        cardNumber, 
        gatewayToken, 
        expiryDate, 
        cardHolderName 
    } = cardData;
    
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    let transactionStarted = false;

    try {
        await transaction.begin();
        transactionStarted = true;

        // first: Insert into PAYMENT_METHODS ---
        const request1 = new sql.Request(transaction);
        const result1 = await request1
            .input('userId', sql.Int, userId)
            .input('providerName', sql.VarChar(100), providerName)
            .input('methodType', sql.VarChar(50), 'card') // STRICTLY 'card'
            .input('isDefault', sql.Bit, 0) 
            .query(`
                INSERT INTO PAYMENT_METHODS (user_id, provider_name, method_type, is_default)
                OUTPUT inserted.method_id
                VALUES (@userId, @providerName, @methodType, @isDefault);
            `);

        const methodId = result1.recordset[0].method_id;

        // then: Insert into CARD_DETAILS ---
        const request2 = new sql.Request(transaction);
        await request2
            .input('methodId', sql.Int, methodId)
            .input('userId', sql.Int, userId)
            .input('cardNumber', sql.VarChar(20), cardNumber)
            .input('gatewayToken', sql.VarChar(255), gatewayToken)
            .input('expiryDate', sql.Date, expiryDate)
            .input('cardHolderName', sql.VarChar(100), cardHolderName)
            .query(`
                    INSERT INTO CARD_DETAILS 
                    (method_id, user_id, card_number, gateway_token, expiry_date, card_holder_name)
                    VALUES 
                    (@methodId, @userId, @cardNumber, @gatewayToken, @expiryDate, @cardHolderName);
                `);

        await transaction.commit();
        transactionStarted = false;

        return { 
            methodId, 
            userId, 
            providerName,
            type: 'card', 
            cardNumber, 
            expiryDate,
            cardHolderName
        };

    } catch (error) {
        if (transactionStarted) await transaction.rollback();
        throw error;
    }
};

module.exports = {
    addCard
};