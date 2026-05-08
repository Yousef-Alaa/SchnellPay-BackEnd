const sql = require("mssql");
const { poolPromise } = require("../config/db");

// --- PROVIDERS ---

const createProvider = async (name, code, contact_email, is_active = true) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input("name", sql.VarChar, name)
        .input("code", sql.VarChar, code)
        .input("contact_email", sql.VarChar, contact_email)
        .input("is_active", sql.Bit, is_active)
        .query(`
            INSERT INTO BILLS_PROVIDERS (provider_name, provider_code, contact_mail, is_active)
            OUTPUT INSERTED.*
            VALUES (@name, @code, @contact_email, @is_active)
        `);
    return result.recordset[0];
};

const updateProvider = async (provider_id, name, code, contact_email, is_active) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input("provider_id", sql.Int, provider_id)
        .input("name", sql.VarChar, name)
        .input("code", sql.VarChar, code)
        .input("contact_email", sql.VarChar, contact_email)
        .input("is_active", sql.Bit, is_active)
        .query(`
            UPDATE BILLS_PROVIDERS
            SET provider_name = @name, provider_code = @code, contact_mail = @contact_email, is_active = @is_active
            OUTPUT INSERTED.*
            WHERE provider_id = @provider_id
        `);
    return result.recordset[0];
};

const deleteProvider = async (provider_id) => {
    const pool = await poolPromise;
    await pool.request()
        .input("provider_id", sql.Int, provider_id)
        .query(`
            DELETE FROM BILLS_PROVIDERS
            WHERE provider_id = @provider_id
        `);
    return true;
};

const getProviders = async (activeOnly = false) => {
    const pool = await poolPromise;
    let query = `SELECT * FROM BILLS_PROVIDERS`;
    if (activeOnly) {
        query += ` WHERE is_active = 1`;
    }
    const result = await pool.request().query(query);
    return result.recordset;
};

const getProviderById = async (provider_id) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input("provider_id", sql.Int, provider_id)
        .query(`SELECT * FROM BILLS_PROVIDERS WHERE provider_id = @provider_id`);
    return result.recordset[0];
};

// --- SERVICES ---

const createService = async (provider_id, service_name, category, fee, is_active = true) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input("provider_id", sql.Int, provider_id)
        .input("service_name", sql.VarChar, service_name)
        .input("category", sql.VarChar, category)
        .input("fee", sql.Decimal(10, 2), fee)
        .input("is_active", sql.Bit, is_active)
        .query(`
            INSERT INTO BILLS_SERVICES (provider_id, service_name, service_category, fee, is_active)
            OUTPUT INSERTED.*
            VALUES (@provider_id, @service_name, @category, @fee, @is_active)
        `);
    return result.recordset[0];
};

const updateService = async (service_id, provider_id, service_name, category, fee, is_active) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input("service_id", sql.Int, service_id)
        .input("provider_id", sql.Int, provider_id)
        .input("service_name", sql.VarChar, service_name)
        .input("category", sql.VarChar, category)
        .input("fee", sql.Decimal(10, 2), fee)
        .input("is_active", sql.Bit, is_active)
        .query(`
            UPDATE BILLS_SERVICES
            SET provider_id = @provider_id, service_name = @service_name, service_category = @category, fee = @fee, is_active = @is_active
            OUTPUT INSERTED.*
            WHERE service_id = @service_id
        `);
    return result.recordset[0];
};

const deleteService = async (service_id) => {
    const pool = await poolPromise;
    await pool.request()
        .input("service_id", sql.Int, service_id)
        .query(`
            DELETE FROM BILLS_SERVICES
            WHERE service_id = @service_id
        `);
    return true;
};

const getAllServices = async (activeOnly = false) => {
    const pool = await poolPromise;
    let query = `
        SELECT s.*, p.provider_name 
        FROM BILLS_SERVICES s
        JOIN BILLS_PROVIDERS p ON s.provider_id = p.provider_id
    `;
    if (activeOnly) {
        query += ` WHERE s.is_active = 1 AND p.is_active = 1`;
    }
    const result = await pool.request().query(query);
    return result.recordset;
};

const getServicesByProvider = async (providerId, activeOnly = false) => {
    const pool = await poolPromise;
    let query = `
        SELECT *
        FROM BILLS_SERVICES
        WHERE provider_id = @provider_id
    `;
    if (activeOnly) {
        query += ` AND is_active = 1`;
    }
    const result = await pool
        .request()
        .input("provider_id", sql.Int, providerId)
        .query(query);

    return result.recordset;
};

const findService = async (serviceId) => {
    const pool = await poolPromise;

    const result = await pool
        .request()
        .input("service_id", sql.Int, serviceId)
        .query(`
            SELECT *
            FROM BILLS_SERVICES
            WHERE service_id = @service_id AND is_active = 1
        `);

    return result.recordset[0] || null;
};

module.exports = {
    createProvider,
    updateProvider,
    deleteProvider,
    getProviders,
    getProviderById,
    createService,
    updateService,
    deleteService,
    getAllServices,
    getServicesByProvider,
    findService,
};