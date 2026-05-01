const { poolPromise, sql } = require("../config/db");

// ── MFA Status ────────────────────────────────────────────────────────────────

/**
 * Get MFA-related columns by user_id.
 * Used internally after we already resolved the user from username/email.
 */
const getMfaStatus = async (userId) => {
    const pool = await poolPromise;

    const result = await pool
        .request()
        .input("user_id", sql.Int, userId)
        .query(`
            SELECT user_id, email, f_name,
                   mfa_enabled, mfa_method, totp_secret,
                   otp_code,    otp_expires_at
            FROM [USERS]
            WHERE user_id = @user_id
        `);

    return result.recordset[0] || null;
};

/**
 * Get MFA-related columns by username.
 * Used in public-facing endpoints (validate, send-otp) where we only
 * receive a username, never a user_id.
 */
const getMfaStatusByUsername = async (username) => {
    const pool = await poolPromise;

    const result = await pool
        .request()
        .input("username", sql.NVarChar, username)
        .query(`
            SELECT user_id, email, f_name,
                   mfa_enabled, mfa_method, totp_secret,
                   otp_code,    otp_expires_at
            FROM [USERS]
            WHERE user_name = @username
        `);

    return result.recordset[0] || null;
};

// ── OTP (Email method) ────────────────────────────────────────────────────────

/**
 * Save a hashed OTP code + expiry for a pending email MFA challenge.
 */
const saveOtp = async (userId, hashedOtp, expiresAt) => {
    const pool = await poolPromise;

    await pool
        .request()
        .input("user_id",    sql.Int,      userId)
        .input("otp_code",   sql.NVarChar, hashedOtp)
        .input("expires_at", sql.DateTime, expiresAt)
        .query(`
            UPDATE [USERS]
            SET otp_code       = @otp_code,
                otp_expires_at = @expires_at
            WHERE user_id = @user_id
        `);
};

/**
 * Clear the OTP code + expiry after use or expiry.
 */
const clearOtp = async (userId) => {
    const pool = await poolPromise;

    await pool
        .request()
        .input("user_id", sql.Int, userId)
        .query(`
            UPDATE [USERS]
            SET otp_code       = NULL,
                otp_expires_at = NULL
            WHERE user_id = @user_id
        `);
};

// ── TOTP (Auth App method) ────────────────────────────────────────────────────

/**
 * Save a pending TOTP secret. mfa_enabled stays 0 until verify-setup confirms it.
 */
const saveTotpSecret = async (userId, secret) => {
    const pool = await poolPromise;

    await pool
        .request()
        .input("user_id", sql.Int,      userId)
        .input("secret",  sql.NVarChar, secret)
        .query(`
            UPDATE [USERS]
            SET totp_secret = @secret
            WHERE user_id = @user_id
        `);
};

// ── Enable / Disable ──────────────────────────────────────────────────────────

/**
 * Mark MFA as fully enabled after successful verification.
 */
const enableMfa = async (userId, method) => {
    const pool = await poolPromise;

    await pool
        .request()
        .input("user_id", sql.Int,      userId)
        .input("method",  sql.NVarChar, method)
        .query(`
            UPDATE [USERS]
            SET mfa_enabled    = 1,
                mfa_method     = @method,
                otp_code       = NULL,
                otp_expires_at = NULL
            WHERE user_id = @user_id
        `);
};

/**
 * Fully disable MFA — clears all MFA-related fields.
 */
const disableMfa = async (userId) => {
    const pool = await poolPromise;

    await pool
        .request()
        .input("user_id", sql.Int, userId)
        .query(`
            UPDATE [USERS]
            SET mfa_enabled    = 0,
                mfa_method     = NULL,
                totp_secret    = NULL,
                otp_code       = NULL,
                otp_expires_at = NULL
            WHERE user_id = @user_id
        `);
};

// ── Backup Codes ──────────────────────────────────────────────────────────────

/**
 * Delete all existing backup codes for a user, then insert fresh hashed ones.
 */
const saveBackupCodes = async (userId, hashedCodes) => {
    const pool = await poolPromise;

    await pool
        .request()
        .input("user_id", sql.Int, userId)
        .query(`DELETE FROM TWO_FA_BACKUP_CODES WHERE user_id = @user_id`);

    for (const hash of hashedCodes) {
        await pool
            .request()
            .input("user_id",   sql.Int,      userId)
            .input("code_hash", sql.NVarChar, hash)
            .query(`
                INSERT INTO TWO_FA_BACKUP_CODES (user_id, code_hash)
                VALUES (@user_id, @code_hash)
            `);
    }
};

/**
 * Fetch all unused backup code rows for a user.
 * Returns [{ code_id, code_hash }]
 */
const getUnusedBackupCodes = async (userId) => {
    const pool = await poolPromise;

    const result = await pool
        .request()
        .input("user_id", sql.Int, userId)
        .query(`
            SELECT code_id, code_hash
            FROM TWO_FA_BACKUP_CODES
            WHERE user_id = @user_id AND used = 0
        `);

    return result.recordset;
};

/**
 * Mark a specific backup code as used so it cannot be reused.
 */
const markBackupCodeUsed = async (codeId) => {
    const pool = await poolPromise;

    await pool
        .request()
        .input("code_id", sql.Int, codeId)
        .query(`
            UPDATE TWO_FA_BACKUP_CODES
            SET used    = 1,
                used_at = GETDATE()
            WHERE code_id = @code_id
        `);
};

module.exports = {
    getMfaStatus,
    getMfaStatusByUsername,
    saveOtp,
    clearOtp,
    saveTotpSecret,
    enableMfa,
    disableMfa,
    saveBackupCodes,
    getUnusedBackupCodes,
    markBackupCodeUsed,
};