const AppError   = require("../../utils/appError");
const asyncWrapper = require("../../middleware/asyncWrapper");
const {
    findKycByUserId,
    createKyc,
    updateKyc,
} = require("../../models/kycModel");



// @desc   Submit KYC documents (front, back, selfie)
// @route  POST /api/v1/kyc/submit
// @access Private
const submitKyc = asyncWrapper(async (req, res, next) => {
    
    const { document_type } = req.body;
    const userId = req.user.id;

    const allowedTypes = ["national_id", "passport", "driving_license"];
    if (!document_type || !allowedTypes.includes(document_type)) {
        return next(
            AppError.create(
                `document_type is required and must be one of: ${allowedTypes.join(", ")}.`,
                400,
                false
            )
        );
    }

    const files = req.files;
    if (
        !files ||
        !files.front_image  ||
        !files.back_image   ||
        !files.selfie_image
    ) {
        return next(
            AppError.create("All three images are required: front_image, back_image, selfie_image.", 400, false)
        );
    }

    const frontPath  = `uploads/kyc/${userId}/${files.front_image[0].filename}`;
    const backPath   = `uploads/kyc/${userId}/${files.back_image[0].filename}`;
    const selfiePath = `uploads/kyc/${userId}/${files.selfie_image[0].filename}`;

    const existing = await findKycByUserId(userId);

    if (existing) {
        if (existing.KYC_status === "pending") {
            return next(
                AppError.create("Your KYC submission is already under review. Please wait for a decision.", 400, false)
            );
        }

        if (existing.KYC_status === "approved") {
            return next(
                AppError.create("Your identity has already been verified.", 400, false)
            );
        }

        // Previously rejected — allow resubmission by updating the existing record
        if (existing.KYC_status === "rejected") {
            await updateKyc(
                existing.KYC_ID,
                document_type,
                frontPath,
                backPath,
                selfiePath
            );

            return res.status(200).json({
                status:  "success",
                message: "Your KYC documents have been resubmitted and are now under review.",
            });
        }
    }
    

    // First-time submission
    await createKyc(userId, document_type, frontPath, backPath, selfiePath);

    return res.status(201).json({
        status:  "success",
        message: "KYC documents submitted successfully. We will review them shortly.",
    });
});


// @desc   Get own KYC status
// @route  GET /api/v1/kyc/status
// @access Private
const getKycStatus = asyncWrapper(async (req, res, next) => {
    
    const userId = req.user.id;

    const kyc = await findKycByUserId(userId);

    if (!kyc) {
        return res.status(200).json({
            status: "success",
            data: {
                kyc_status:  "not_submitted",
                document_type: null,
                verified_at:   null,
                rejection_reason: null,
            },
        });
    }

    return res.status(200).json({
        status: "success",
        data: {
            kyc_status:       kyc.KYC_status,
            document_type:    kyc.document_type,
            verified_at:      kyc.verified_at,
            rejection_reason: kyc.KYC_status === "rejected" ? kyc.rejection_reason : null,
        },
    });
});

module.exports = { submitKyc, getKycStatus };