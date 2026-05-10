const sql = require("mssql");
const { poolPromise } = require("../config/db");

const createBillDetails = async (
    transaction,
    transactionId,
    serviceId,
    consumerNumber
) => {
    await new sql.Request(transaction)
        .input("tx_id", sql.Int, transactionId)
        .input("service_id", sql.Int, serviceId)
        .input("consumer_number", sql.VarChar, consumerNumber)
        .query(`
            INSERT INTO BILLS_DETAILS
            (transaction_id, service_id, consumer_number)
            VALUES (@tx_id, @service_id, @consumer_number)
        `);
};

const getBillsByUserId = async (userId) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input("userId", sql.Int, userId)
        .query(`
            SELECT 
                t.transaction_id, t.amount, t.status, t.created_at, t.reference_number,
                bd.consumer_number, bd.provider_reference,
                bs.service_name, bs.service_category,
                bp.provider_name
            FROM TRANSACTIONS t
            JOIN BILLS_DETAILS bd ON t.transaction_id = bd.transaction_id
            JOIN BILLS_SERVICES bs ON bd.service_id = bs.service_id
            LEFT JOIN BILLS_PROVIDERS bp ON bs.provider_id = bp.provider_id
            WHERE t.sender_id = @userId AND t.transaction_type = 'bill'
            ORDER BY t.created_at DESC
        `);
    return result.recordset;
};

const getAllBills = async () => {
    const pool = await poolPromise;
    const result = await pool.request()
        .query(`
            SELECT 
                t.transaction_id, t.amount, t.status, t.created_at, t.reference_number, t.sender_id as user_id,
                u.f_name + ' ' + u.l_name as full_name, u.email,
                bd.consumer_number, bd.provider_reference,
                bs.service_name, bs.service_category,
                bp.provider_name
            FROM TRANSACTIONS t
            JOIN BILLS_DETAILS bd ON t.transaction_id = bd.transaction_id
            JOIN BILLS_SERVICES bs ON bd.service_id = bs.service_id
            LEFT JOIN BILLS_PROVIDERS bp ON bs.provider_id = bp.provider_id
            LEFT JOIN USERS u ON t.sender_id = u.user_id
            WHERE t.transaction_type = 'bill'
            ORDER BY t.created_at DESC
        `);
    return result.recordset;
};

module.exports = { createBillDetails, getBillsByUserId, getAllBills };