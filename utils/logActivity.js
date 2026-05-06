const { insertLog } = require("../models/activityLogModel");

// Valid actions — must match CHK_ACTIVITY_ACTION constraint in DB
const VALID_ACTIONS = [
    "login_success",
    "login_failed",
    "password_changed",
    "profile_updated",
    "2fa_enabled",
    "2fa_disabled",
    "backup_codes_regenerated",
];

/**
 * Log a security/account event for a user.
 *
 * Designed to be fire-and-forget — errors are caught and logged to console
 * so a logging failure NEVER breaks the main request flow.
 *
 * Usage:
 *   logActivity(user.user_id, "login_success", "Logged in successfully", req);
 */

const logActivity = async (userId, action, description, req) => {
    try {
        if (!VALID_ACTIONS.includes(action)) {
            console.warn(`[logActivity] Unknown action skipped: "${action}"`);
            return;
        }

        // Extract IP — handle proxies (e.g. nginx, Vercel) via x-forwarded-for
        const ip = (
            req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
            req.ip ||
            null
        );

        // Extract device from User-Agent header — truncate to 150 chars (DB column limit)
        const device = req.headers["user-agent"]
            ? req.headers["user-agent"].substring(0, 150)
            : null;

        await insertLog(userId, action, description, ip, device);
    } catch (err) {
        // Never throw — a logging failure must not break the calling endpoint
        console.error("[logActivity] Failed to write activity log:", err.message);
    }
};

module.exports = logActivity;