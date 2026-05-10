const express      = require("express");
const router       = express.Router();
const verifyToken  = require("../../middleware/verifyToken");
const allowTo      = require("../../middleware/allowTo");
const kycUpload    = require("../../middleware/kycUpload");
const { submitKyc, getKycStatus }         = require("../../controllers/kyc/kycController");
const { listKyc, getKycById, reviewKyc, getKycStats }  = require("../../controllers/kyc/kycAdminController");
const { kycSubmitLimiter } = require("../../middleware/rateLimiter");


// ── User routes ───────────────────────────────────────────────────────────────
router.post("/submit", kycSubmitLimiter, verifyToken, kycUpload, submitKyc);
router.get("/status", verifyToken, getKycStatus);



// ── Admin routes ──────────────────────────────────────────────────────────────
router.get("/stats", verifyToken, allowTo("admin"), getKycStats);
router.get("/", verifyToken, allowTo("admin"), listKyc);
router.get("/:kyc_id", verifyToken, allowTo("admin"), getKycById);
router.patch("/:kyc_id", verifyToken, allowTo("admin"), reviewKyc);

module.exports = router;