const AppError = require("../../utils/appError");
const asyncWrapper = require("../../middleware/asyncWrapper");
const {
  findAll,
  countAll,
  findById,
  approveKyc,
  rejectKyc,
} = require("../../models/kycModel");
const { createNotification } = require("../../utils/notificationHelper");

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a full publicly accessible URL for a stored image path.
 * e.g. "uploads/kyc/12/front_image-123.jpg"
 *   → "http://localhost:3000/uploads/kyc/12/front_image-123.jpg"
 */
const buildImageUrl = (req, relativePath) => {
  if (!relativePath) return null;
  return `${req.protocol}://${req.get("host")}/${relativePath}`;
};

// ─── Controllers ─────────────────────────────────────────────────────────────

// @desc   List all KYC submissions with optional status filter and pagination
// @route  GET /api/v1/kyc
// @access Private - Admin
const listKyc = asyncWrapper(async (req, res, next) => {
  const { status, page = 1, limit = 10 } = req.query; // /api/v1/kyc?status=pending&page=1&limit=10

  const allowedStatuses = ["pending", "approved", "rejected"];
  if (status && !allowedStatuses.includes(status)) {
    return next(
      AppError.create(
        `status filter must be one of: ${allowedStatuses.join(", ")}.`,
        400,
        false,
      ),
    );
  }

  const parsedLimit = parseInt(limit);
  const parsedOffset = (parseInt(page) - 1) * parsedLimit;

  const [records, total] = await Promise.all([
    findAll({ status, limit: parsedLimit, offset: parsedOffset }),
    countAll(status),
  ]);

  return res.status(200).json({
    status: "success",
    data: {
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parsedLimit),
      records,
    },
  });
});

// @desc   View a single KYC submission in full detail including image URLs
// @route  GET /api/v1/kyc/:kyc_id
// @access Private - Admin
const getKycById = asyncWrapper(async (req, res, next) => {
  const { kyc_id } = req.params;

  const kyc = await findById(parseInt(kyc_id));
  if (!kyc)
    return next(AppError.create("KYC submission not found.", 404, false));

  return res.status(200).json({
    status: "success",
    data: {
      kyc_id: kyc.KYC_ID,
      kyc_status: kyc.KYC_status,
      document_type: kyc.document_type,
      verified_at: kyc.verified_at,
      rejection_reason: kyc.rejection_reason,
      reviewed_by: kyc.reviewed_by,
      images: {
        front: buildImageUrl(req, kyc.front_image),
        back: buildImageUrl(req, kyc.back_image),
        selfie: buildImageUrl(req, kyc.selfie_image),
      },
      user: {
        username: kyc.user_name,
        name: `${kyc.f_name} ${kyc.l_name}`,
        email: kyc.email,
        phone: kyc.phone,
      },
    },
  });
});

// @desc   Approve or reject a KYC submission
// @route  PATCH /api/v1/kyc/:kyc_id
// @access Private - Admin
const reviewKyc = asyncWrapper(async (req, res, next) => {
  const { kyc_id } = req.params;
  const { action, rejection_reason } = req.body;

  const adminId = req.user.user_id;

  if (!action || !["approve", "reject"].includes(action))
    return next(
      AppError.create("action must be 'approve' or 'reject'.", 400, false),
    );

  if (action === "reject" && !rejection_reason)
    return next(
      AppError.create(
        "rejection_reason is required when rejecting a submission.",
        400,
        false,
      ),
    );

  const kyc = await findById(parseInt(kyc_id));
  if (!kyc)
    return next(AppError.create("KYC submission not found.", 404, false));

  if (kyc.KYC_status === "approved")
    return next(
      AppError.create("This submission has already been approved.", 400, false),
    );

  if (kyc.KYC_status === "rejected" && action === "reject")
    return next(
      AppError.create("This submission has already been rejected.", 400, false),
    );

  // ── Process ───────────────────────────────────────────────────────────────
  if (action === "approve") {
    await approveKyc(kyc.KYC_ID, adminId);
    // Create a notification for the user about the approval
    createNotification(
      kyc.user_id,
      "KYC Approved",
      "Great news! Your identity verification has been approved. You now have full access to SchnellPay features.",
      "KYC",
      kyc.email,
    );

    return res.status(200).json({
      status: "success",
      message: `KYC submission for ${kyc.f_name} ${kyc.l_name} has been approved.`,
    });
  }

  if (action === "reject") {
    await rejectKyc(kyc.KYC_ID, adminId, rejection_reason);
    // Create a notification for the user about the rejection and reason
    createNotification(
      kyc.user_id,
      "KYC Rejected",
      `Your identity verification was rejected. Reason: ${rejection_reason}. Please re-submit with correct documents.`,
      "KYC",
      kyc.email,
    );
    return res.status(200).json({
      status: "success",
      message: `KYC submission for ${kyc.f_name} ${kyc.l_name} has been rejected.`,
    });
  }
});

module.exports = { listKyc, getKycById, reviewKyc };
