const express     = require("express");
const router      = express.Router();
const verifyToken = require("../../middleware/verifyToken");
const allowTo     = require("../../middleware/allowTo");
const {
    getMyActivityLog,
    getUserActivityLog,
} = require("../../controllers/activityLog/activityLogController");


router.get("/", verifyToken, getMyActivityLog);

router.get("/:id", verifyToken, allowTo("admin"), getUserActivityLog);

module.exports = router;