const express      = require("express");
const router       = express.Router();
const verifyToken  = require("../../middleware/verifyToken");
const allowTo      = require("../../middleware/allowTo");
const kycUpload    = require("../../middleware/kycUpload");
const { submitKyc, getKycStatus }         = require("../../controllers/kyc/kycController");
const { listKyc, getKycById, reviewKyc }  = require("../../controllers/kyc/kycAdminController");

/**
 * @swagger
 * /api/v1/kyc/submit:
 *   post:
 *     tags: [KYC]
 *     summary: Submit KYC documents
 *     description: |
 *       Accepts three images (front_image, back_image, selfie_image) as `multipart/form-data`.
 *       - If no prior submission: creates a new KYC record (status: pending).
 *       - If previously rejected: updates the existing record (reset to pending).
 *       - If pending or approved: returns 400.
 *       Files saved to `uploads/kyc/:userId/`. Max 5 MB per file. Accepted: JPEG, PNG, WEBP.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [document_type, front_image, back_image, selfie_image]
 *             properties:
 *               document_type:
 *                 type: string
 *                 enum: [national_id, passport, driving_license]
 *               front_image:
 *                 type: string
 *                 format: binary
 *                 description: Front side of document (JPEG/PNG/WEBP, max 5 MB)
 *               back_image:
 *                 type: string
 *                 format: binary
 *                 description: Back side of document (JPEG/PNG/WEBP, max 5 MB)
 *               selfie_image:
 *                 type: string
 *                 format: binary
 *                 description: Selfie holding the document (JPEG/PNG/WEBP, max 5 MB)
 *     responses:
 *       201:
 *         description: KYC submitted (first time)
 *       200:
 *         description: KYC resubmitted (after rejection)
 *       400:
 *         description: Already pending / approved / invalid document_type / missing images
 *       401:
 *         description: Unauthorized
 */
router.post("/submit", verifyToken, kycUpload, submitKyc);

/**
 * @swagger
 * /api/v1/kyc/status:
 *   get:
 *     tags: [KYC]
 *     summary: Get own KYC verification status
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: KYC status for the authenticated user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 data: { $ref: '#/components/schemas/KycStatus' }
 *       401:
 *         description: Unauthorized
 */
router.get("/status", verifyToken, getKycStatus);

/**
 * @swagger
 * /api/v1/kyc:
 *   get:
 *     tags: [KYC]
 *     summary: List all KYC submissions (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, approved, rejected] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Paginated KYC records
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string }
 *                 data:
 *                   type: object
 *                   properties:
 *                     total: { type: integer }
 *                     page: { type: integer }
 *                     totalPages: { type: integer }
 *                     records:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/KycRecord' }
 *       403:
 *         description: Admin access required
 */
router.get("/", verifyToken, allowTo("admin"), listKyc);

/**
 * @swagger
 * /api/v1/kyc/{kyc_id}:
 *   get:
 *     tags: [KYC]
 *     summary: Get full KYC submission detail (Admin)
 *     description: Returns full record including image URLs (built from request protocol + host) and user info.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: kyc_id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Full KYC detail
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string }
 *                 data: { $ref: '#/components/schemas/KycDetail' }
 *       404:
 *         description: KYC submission not found
 *       403:
 *         description: Admin access required
 *   patch:
 *     tags: [KYC]
 *     summary: Approve or reject a KYC submission (Admin)
 *     description: |
 *       - **approve**: Sets status to approved, records admin ID and timestamp. Sends approval notification.
 *       - **reject**: Sets status to rejected with a reason. Sends rejection notification with reason.
 *       Cannot approve an already-approved record. Cannot reject an already-rejected record.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: kyc_id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/KycReviewRequest'
 *           examples:
 *             approve:
 *               value: { action: approve }
 *             reject:
 *               value: { action: reject, rejection_reason: "Document is blurry" }
 *     responses:
 *       200:
 *         description: KYC reviewed successfully
 *       400:
 *         description: Invalid action / rejection_reason missing / already processed
 *       404:
 *         description: KYC submission not found
 *       403:
 *         description: Admin access required
 */
router.get("/:kyc_id",   verifyToken, allowTo("admin"), getKycById);
router.patch("/:kyc_id", verifyToken, allowTo("admin"), reviewKyc);

module.exports = router;