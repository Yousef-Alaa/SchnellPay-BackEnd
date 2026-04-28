const sql = require("mssql");
const { poolPromise } = require("../config/db");

const getProviders = async () => {
    const pool = await poolPromise;

    const result = await pool.request().query(`
        SELECT provider_id, provider_name, logo
        FROM BILLS_PROVIDERS
    `);

    return result.recordset;
};

const getServicesByProvider = async (providerId) => {
    const pool = await poolPromise;

    const result = await pool
        .request()
        .input("provider_id", sql.Int, providerId)
        .query(`
        SELECT service_id, service_name, fees
        FROM BILLS_SERVICES
        WHERE provider_id = @provider_id
        `);

    return result.recordset;
};

const findService = async (serviceId, providerId) => {
    const pool = await poolPromise;

    const result = await pool
        .request()
        .input("service_id", sql.Int, serviceId)
        .input("provider_id", sql.Int, providerId)
        .query(`
        SELECT *
        FROM BILLS_SERVICES
        WHERE service_id = @service_id AND provider_id = @provider_id
        `);

    return result.recordset[0] || null;
};

module.exports = {
    getProviders,
    getServicesByProvider,
    findService,
};