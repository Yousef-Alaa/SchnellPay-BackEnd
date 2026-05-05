const { poolPromise, sql } = require("../config/db");

// ─── User queries ─────────────────────────────────────────────────────────────

/**
 * Find the latest KYC record for a user.
 * A user should only ever have one record — we use TOP 1 ordered by KYC_ID
 * as a safety net.
 */
const findKycByUserId = async (userId) => {
    const pool = await poolPromise;

    const result = await pool
        .request()
        .input("user_id", sql.Int, userId)
        .query(`
            SELECT TOP 1 *
            FROM KYC_DOCUMENTS
            WHERE user_id = @user_id
            ORDER BY KYC_ID DESC
        `);

    return result.recordset[0] || null;
};

/**
 * Insert a brand-new KYC submission.
 * Returns the new KYC_ID.
 */
const createKyc = async (userId, documentType, frontImage, backImage, selfieImage) => {
    const pool = await poolPromise;

    const result = await pool
        .request()
        .input("user_id",       sql.Int,      userId)
        .input("document_type", sql.NVarChar,  documentType)
        .input("front_image",   sql.NVarChar,  frontImage)
        .input("back_image",    sql.NVarChar,  backImage)
        .input("selfie_image",  sql.NVarChar,  selfieImage)
        .query(`
            INSERT INTO KYC_DOCUMENTS
                (user_id, document_type, front_image, back_image, selfie_image, KYC_status)
            OUTPUT INSERTED.KYC_ID
            VALUES
                (@user_id, @document_type, @front_image, @back_image, @selfie_image, 'pending')
        `);

    return result.recordset[0].KYC_ID;
};

/**
 * Update an existing rejected KYC record with new images and reset to pending.
 * Used when a user resubmits after a rejection.
 */
const updateKyc = async (kycId, documentType, frontImage, backImage, selfieImage) => {
    const pool = await poolPromise;

    await pool
        .request()
        .input("kyc_id",        sql.Int,     kycId)
        .input("document_type", sql.NVarChar, documentType)
        .input("front_image",   sql.NVarChar, frontImage)
        .input("back_image",    sql.NVarChar, backImage)
        .input("selfie_image",  sql.NVarChar, selfieImage)
        .query(`
            UPDATE KYC_DOCUMENTS
            SET document_type     = @document_type,
                front_image       = @front_image,
                back_image        = @back_image,
                selfie_image      = @selfie_image,
                KYC_status        = 'pending',
                rejection_reason  = NULL,
                reviewed_by       = NULL,
                verified_at       = NULL
            WHERE KYC_ID = @kyc_id
        `);
};

// ─── Admin queries ────────────────────────────────────────────────────────────

/**
 * List all KYC submissions with optional status filter and pagination.
 * Joins with USERS to return basic user info alongside the submission.
 */
const findAll = async ({ status, limit, offset }) => {
    const pool = await poolPromise;

    // Build optional WHERE clause
    const statusFilter = status ? "AND k.KYC_status = @status" : "";

    const result = await pool
        .request()
        .input("status", sql.NVarChar, status || null)
        .input("limit",  sql.Int,      limit)
        .input("offset", sql.Int,      offset)
        .query(`
            SELECT
                k.KYC_ID,
                k.KYC_status,
                k.document_type,
                k.verified_at,
                k.rejection_reason,
                u.user_id,
                u.f_name,
                u.l_name,
                u.email
            FROM KYC_DOCUMENTS k
            INNER JOIN [USERS] u ON k.user_id = u.user_id
            WHERE 1=1 ${statusFilter}
            ORDER BY k.KYC_ID DESC
            OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
        `);

    return result.recordset;
};

/**
 * Count all KYC submissions — used for pagination metadata.
 */
const countAll = async (status) => {
    const pool = await poolPromise;

    const statusFilter = status ? "AND KYC_status = @status" : "";

    const result = await pool
        .request()
        .input("status", sql.NVarChar, status || null)
        .query(`
            SELECT COUNT(*) AS total
            FROM KYC_DOCUMENTS
            WHERE 1=1 ${statusFilter}
        `);

    return result.recordset[0].total;
};

/**
 * Find a single KYC record by KYC_ID — includes image paths for admin review.
 */
const findById = async (kycId) => {
    const pool = await poolPromise;

    const result = await pool
        .request()
        .input("kyc_id", sql.Int, kycId)
        .query(`
            SELECT
                k.*,
                u.f_name,
                u.l_name,
                u.email,
                u.phone
            FROM KYC_DOCUMENTS k
            INNER JOIN [USERS] u ON k.user_id = u.user_id
            WHERE k.KYC_ID = @kyc_id
        `);

    return result.recordset[0] || null;
};

/**
 * Approve a KYC submission.
 */
const approveKyc = async (kycId, adminId) => {
    const pool = await poolPromise;

    await pool
        .request()
        .input("kyc_id",   sql.Int, kycId)
        .input("admin_id", sql.Int, adminId)
        .query(`
            UPDATE KYC_DOCUMENTS
            SET KYC_status       = 'approved',
                verified_at      = GETDATE(),
                reviewed_by      = @admin_id,
                rejection_reason = NULL
            WHERE KYC_ID = @kyc_id
        `);
};

/**
 * Reject a KYC submission with a reason.
 */
const rejectKyc = async (kycId, adminId, rejectionReason) => {
    const pool = await poolPromise;

    await pool
        .request()
        .input("kyc_id",           sql.Int,      kycId)
        .input("admin_id",         sql.Int,      adminId)
        .input("rejection_reason", sql.NVarChar,  rejectionReason)
        .query(`
            UPDATE KYC_DOCUMENTS
            SET KYC_status       = 'rejected',
                verified_at      = NULL,
                reviewed_by      = @admin_id,
                rejection_reason = @rejection_reason
            WHERE KYC_ID = @kyc_id
        `);
};

module.exports = {
    findKycByUserId,
    createKyc,
    updateKyc,
    findAll,
    countAll,
    findById,
    approveKyc,
    rejectKyc,
};