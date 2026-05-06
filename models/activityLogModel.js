const { poolPromise, sql } = require("../config/db");


const insertLog = async (userId, action, description, ipAddress, device) => {
    const pool = await poolPromise;

    await pool
        .request()
        .input("user_id",     sql.Int,      userId)
        .input("action",      sql.NVarChar, action)
        .input("description", sql.NVarChar, description || null)
        .input("ip_address",  sql.NVarChar, ipAddress   || null)
        .input("device",      sql.NVarChar, device      || null)
        .query(`
            INSERT INTO ACTIVITY_LOG (user_id, action, description, ip_address, device)
            VALUES (@user_id, @action, @description, @ip_address, @device)
        `);
};

const getLogsByUserId = async (userId, { action, limit, offset }) => {
    const pool = await poolPromise;

    const actionFilter = action ? "AND action = @action" : "";

    const result = await pool
        .request()
        .input("user_id", sql.Int,      userId)
        .input("action",  sql.NVarChar, action || null)
        .input("limit",   sql.Int,      limit)
        .input("offset",  sql.Int,      offset)
        .query(`
            SELECT log_id, action, description, ip_address, device, created_at
            FROM ACTIVITY_LOG
            WHERE user_id = @user_id ${actionFilter}
            ORDER BY created_at DESC
            OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
        `);

    return result.recordset;
};


const countLogsByUserId = async (userId, action) => {
    const pool = await poolPromise;

    const actionFilter = action ? "AND action = @action" : "";

    const result = await pool
        .request()
        .input("user_id", sql.Int,      userId)
        .input("action",  sql.NVarChar, action || null)
        .query(`
            SELECT COUNT(*) AS total
            FROM ACTIVITY_LOG
            WHERE user_id = @user_id ${actionFilter}
        `);

    return result.recordset[0].total;
};

module.exports = { insertLog, getLogsByUserId, countLogsByUserId };