const bcrypt       = require("bcryptjs");

const AppError     = require("../../utils/appError");
const generateJWT  = require("../../utils/generatJwt");
const { extractUserId, extractTokenRandom, getRefreshTokenExpiry } = require("../../utils/generateRefreshToken");

const asyncWrapper = require("../../middleware/asyncWrapper");

const { findById } = require("../../models/userModel");
const { getValidTokensByUserId, slideRefreshToken } = require("../../models/refreshTokenModel");


// @desc   Issue a new access token using a valid refresh token cookie
// @route  POST /api/v1/auth/refresh-token
// @access Public
const refreshToken = asyncWrapper(async (req, res, next) => {
    const plainToken = req.cookies?.refresh_token;

    if (!plainToken)
        return next(AppError.create("Refresh token not found. Please log in again.", 401, false));
    

    // ── Extract userId prefix and random part
    // Cookie format: "<userId>:<randomHex>"
    // userId scopes the DB lookup — randomHex is what we verify against the hash
    const userId    = extractUserId(plainToken);
    const randomPart = extractTokenRandom(plainToken);

    if (!userId || isNaN(userId))
        return next(AppError.create("Invalid refresh token. Please log in again.", 401, false));
    

    // Find valid token rows for this user
    const validTokens = await getValidTokensByUserId(userId);
    if (!validTokens.length)
        return next(AppError.create("Session expired. Please log in again.", 401, false));
    

    // Compare random part against all valid hashes for this user
    let matchedTokenId = null;
    for (const row of validTokens) {
        const isMatch = await bcrypt.compare(randomPart, row.token_hash);
        if (isMatch) {
            matchedTokenId = row.token_id;
            break;
        }
    }

    if (!matchedTokenId)
        return next(AppError.create("Invalid refresh token. Please log in again.", 401, false));
    

    // Slide expiry forward 24 hours
    await slideRefreshToken(matchedTokenId, getRefreshTokenExpiry());

    // Issue new access token
    const user = await findById(userId);
    if (!user)
        return next(AppError.create("User not found.", 404, false));
    

    const accessToken = generateJWT({
        id:    user.user_id,
        email: user.email,
        name:  `${user.f_name} ${user.l_name}`,
        role:  user.role,
    });

    return res.status(200).json({
        success: true,
        message: "Access token refreshed.",
        token:   accessToken,
    });
});

module.exports = refreshToken;