const crypto = require("crypto");

const REFRESH_TOKEN_EXPIRY_HOURS = 24;


const generateRefreshToken = (userId) => {
    const randomPart = crypto.randomBytes(64).toString("hex");
    return `${userId}:${randomPart}`;
};

const extractTokenRandom = (plainToken) => {
    const colonIndex = plainToken.indexOf(":");
    return plainToken.slice(colonIndex + 1);
};

const extractUserId = (plainToken) => {
    return parseInt(plainToken.split(":")[0]);
};


const getRefreshTokenExpiry = () => {
    return new Date(Date.now() + REFRESH_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);
};

const refreshCookieOptions = () => ({
    httpOnly: true,                                   // not accessible via JS — XSS safe
    secure:   process.env.NODE_ENV === "production",  // HTTPS only in prod
    sameSite: "strict",                               // CSRF protection
    expires:  getRefreshTokenExpiry(),
});

module.exports = {
    generateRefreshToken,
    extractTokenRandom,
    extractUserId,
    getRefreshTokenExpiry,
    refreshCookieOptions,
};