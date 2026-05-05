const bcrypt       = require("bcryptjs");
const asyncWrapper = require("../../middleware/asyncWrapper");
const { extractUserId, extractTokenRandom } = require("../../utils/generateRefreshToken");
const {
    getValidTokensByUserId,
    revokeRefreshToken,
    revokeAllUserTokens,
} = require("../../models/refreshTokenModel");

// @desc   Logout — revoke refresh token and clear cookie
// @route  POST /api/v1/auth/logout
// @access Private
const logout = asyncWrapper(async (req, res, next) => {
    
    const plainToken = req.cookies?.refresh_token;
    const { all_devices } = req.body; // optional — if true, revoke all sessions

    // Revoke all devices
    if (all_devices === true) {
        await revokeAllUserTokens(req.user.user_id);
        res.clearCookie("refresh_token");

        return res.status(200).json({
            success: true,
            message: "Logged out from all devices.",
        });
    }

    // Revoke current device only
    if (!plainToken) {
        // No cookie — still clear it and return success (idempotent)
        res.clearCookie("refresh_token");
        return res.status(200).json({ success: true, message: "Logged out." });
    }

    const userId     = extractUserId(plainToken);
    const randomPart = extractTokenRandom(plainToken);

    // Find the matching token row and revoke only that one
    const validTokens = await getValidTokensByUserId(userId);
    for (const row of validTokens) {
        const isMatch = await bcrypt.compare(randomPart, row.token_hash);
        if (isMatch) {
            await revokeRefreshToken(row.token_id);
            break;
        }
    }

    res.clearCookie("refresh_token");

    return res.status(200).json({
        success: true,
        message: "Logged out successfully.",
    });
});

module.exports = logout;