const AppError     = require("../../utils/appError");
const asyncWrapper = require("../../middleware/asyncWrapper");
const { findById } = require("../../models/userModel");
const { getLogsByUserId, countLogsByUserId } = require("../../models/activityLogModel");



const VALID_ACTIONS = [
    "login_success",
    "login_failed",
    "password_changed",
    "profile_updated",
    "2fa_enabled",
    "2fa_disabled",
    "backup_codes_regenerated",
];

// ─── Shared query builder
const fetchLogs = async (res, userId, query) => {

    const { action, page = 1, limit = 20 } = query;

    if (action && !VALID_ACTIONS.includes(action))
        return next(AppError.create("Invalid Action.", 400, false));

    const parsedLimit  = Math.min(parseInt(limit) || 20, 100); // max 100 per page
    const parsedOffset = (Math.max(parseInt(page) || 1, 1) - 1) * parsedLimit;

    const [logs, total] = await Promise.all([
        getLogsByUserId(userId, { action, limit: parsedLimit, offset: parsedOffset }),
        countLogsByUserId(userId, action),
    ]);

    return res.status(200).json({
        status: "success",
        data: {
            total,
            page:       parseInt(page) || 1,
            totalPages: Math.ceil(total / parsedLimit),
            logs,
        },
    });
};

// ─── Controllers ─────────────────────────────────────────────────────────────

// @desc   Get own activity log (paginated, filterable by action)
// @route  GET /api/v1/activity-log?page=1&limit=20&action=login_success
// @access Private
const getMyActivityLog = asyncWrapper(async (req, res, next) => {
    const { action } = req.query;

    if (action && !VALID_ACTIONS.includes(action)) {
        return next(
            AppError.create(`Invalid action filter. Must be one of: ${VALID_ACTIONS.join(", ")}.`, 400, false)
        );
    }

    return fetchLogs(res, req.user.id, req.query);
});

// ─────────────────────────────────────────────────────────────────────────────

// @desc   Get activity log for any user by ID (admin only)
// @route  GET /api/v1/activity-log/:id?page=1&limit=20&action=login_failed
// @access Private - Admin
const getUserActivityLog = asyncWrapper(async (req, res, next) => {
    
    const { action } = req.query;
    const targetId   = parseInt(req.params.id);

    if (!targetId || isNaN(targetId))
        return next(AppError.create("Invalid user ID.", 400, false));
    

    if (action && !VALID_ACTIONS.includes(action)) {
        return next(
            AppError.create(`Invalid action filter. Must be one of: ${VALID_ACTIONS.join(", ")}.`, 400, false)
        );
    }

    // Make sure the target user actually exists
    const user = await findById(targetId);
    if (!user) return next(AppError.create("User not found.", 404, false));

    return fetchLogs(res, targetId, req.query);
});

module.exports = { getMyActivityLog, getUserActivityLog };