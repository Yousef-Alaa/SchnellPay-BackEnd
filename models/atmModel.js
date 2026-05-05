const { poolPromise, sql } = require("../config/db");

const saveAtmCode = async (userId, hashedOtp, expiresAt) => {
    const pool = await poolPromise;

    await pool
        .request()
        .input("user_id",    sql.Int,      userId)
        .input("otp_code",   sql.NVarChar, hashedOtp)
        .input("expires_at", sql.DateTime, expiresAt)
        .query(`
            UPDATE [USERS]
            SET atm_code        = @otp_code,
                atmcode_expired = @expires_at
            WHERE user_id = @user_id
        `);
};

module.exports = { saveAtmCode }