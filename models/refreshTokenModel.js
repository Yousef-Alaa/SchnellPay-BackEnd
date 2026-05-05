const { poolPromise, sql } = require("../config/db");


const createRefreshToken = async (userId, tokenHash, expiresAt) => {
    const pool = await poolPromise;

    const result = await pool
        .request()
        .input("user_id",    sql.Int,      userId)
        .input("token_hash", sql.NVarChar,  tokenHash)
        .input("expires_at", sql.DateTime,  expiresAt)
        .query(`
            INSERT INTO REFRESH_TOKENS (user_id, token_hash, expires_at)
            OUTPUT INSERTED.token_id
            VALUES (@user_id, @token_hash, @expires_at)
        `);

    return result.recordset[0].token_id;
};

const getValidTokensByUserId = async (userId) => {
    const pool = await poolPromise;

    const result = await pool
        .request()
        .input("user_id", sql.Int, userId)
        .query(`
            SELECT token_id, token_hash, expires_at
            FROM REFRESH_TOKENS
            WHERE user_id   = @user_id
              AND revoked    = 0
              AND expires_at > GETDATE()
        `);

    return result.recordset;
};

const slideRefreshToken = async (tokenId, newExpiresAt) => {
    const pool = await poolPromise;

    await pool
        .request()
        .input("token_id",    sql.Int,      tokenId)
        .input("expires_at",  sql.DateTime,  newExpiresAt)
        .query(`
            UPDATE REFRESH_TOKENS
            SET expires_at = @expires_at
            WHERE token_id = @token_id
        `);
};

const revokeRefreshToken = async (tokenId) => {
    const pool = await poolPromise;

    await pool
        .request()
        .input("token_id", sql.Int, tokenId)
        .query(`
            UPDATE REFRESH_TOKENS
            SET revoked = 1
            WHERE token_id = @token_id
        `);
};

const revokeAllUserTokens = async (userId) => {
    const pool = await poolPromise;

    await pool
        .request()
        .input("user_id", sql.Int, userId)
        .query(`
            UPDATE REFRESH_TOKENS
            SET revoked = 1
            WHERE user_id = @user_id
        `);
};

module.exports = {
    createRefreshToken,
    getValidTokensByUserId,
    slideRefreshToken,
    revokeRefreshToken,
    revokeAllUserTokens,
};