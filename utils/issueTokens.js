const bcrypt = require("bcryptjs");
const generateJWT = require("./generatJwt");
const {
    generateRefreshToken,
    extractTokenRandom,
    getRefreshTokenExpiry,
    refreshCookieOptions,
} = require("./generateRefreshToken");
const { createRefreshToken } = require("../models/refreshTokenModel");

const BCRYPT_ROUNDS = 10;

/**
 * Issue an access token + refresh token for a verified user.
 * - Access token  → returned in JSON response body (15 min)
 * - Refresh token → set as httpOnly cookie (24 hours, sliding)
 *  
 * Called by:
 *   - login.js           (no MFA path)
 *   - twoFaController.js (after MFA validated)
 *  
 * Steps:
 * 1. Sign an access token (JWT, 15min)
 * 2. Generate a refresh token
 * 3. Hash it
 * 4. Store the hash in the DB
 * 5. Set the plain token as an httpOnly cookie
 * 6. Return the access token
 *  
 */

const issueTokens = async (user, res) => {

    
    const accessToken = generateJWT({
        id:    user.user_id,
        email: user.email,
        name:  `${user.f_name} ${user.l_name}`,
        role:  user.role,
    });


    // ── Refresh token
    // Format: "<userId>:<randomHex>" — userId prefix lets /refresh-token
    // scope the DB lookup without scanning the whole table
    const plainRefreshToken = generateRefreshToken(user.user_id);
    const randomPart        = extractTokenRandom(plainRefreshToken); // only hash the random part
    const hashedToken       = await bcrypt.hash(randomPart, BCRYPT_ROUNDS);
    const expiresAt         = getRefreshTokenExpiry(); // 24 hours from now

    await createRefreshToken(user.user_id, hashedToken, expiresAt);

    res.cookie("refresh_token", plainRefreshToken, refreshCookieOptions());

    return accessToken;
};

module.exports = issueTokens;