const express = require("express");
const router = express.Router();
const verifyToken = require("../../middleware/verifyToken");
const allowTo = require("../../middleware/allowTo");
const { getAdminStatsController } = require("../../controllers/admin/adminStatsController");
router.use(verifyToken, allowTo("admin"));

router.get("/stats", getAdminStatsController);

module.exports = router;
