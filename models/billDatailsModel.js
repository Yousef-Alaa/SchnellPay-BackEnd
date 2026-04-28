// models/billDetails.model.js
const sql = require("mssql");

const createBillDetails = async (
    transaction,
    transactionId,
    serviceId,
    providerId,
    consumerNumber
) => {
    await new sql.Request(transaction)
        .input("tx_id", sql.Int, transactionId)
        .input("service_id", sql.Int, serviceId)
        .input("provider_id", sql.Int, providerId)
        .input("consumer_number", sql.VarChar, consumerNumber)
        .query(`
        INSERT INTO BILLS_DETAILS
        (transaction_id, service_id, provider_id, consumer_number)
        VALUES (@tx_id, @service_id, @provider_id, @consumer_number)
        `);
};

module.exports = { createBillDetails };