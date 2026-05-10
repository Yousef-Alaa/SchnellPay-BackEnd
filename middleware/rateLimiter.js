const rateLimit = require("express-rate-limit");

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Standard rate limit response — matches your AppError shape.
 */
const rateLimitHandler = (req, res) => {
    res.status(429).json({
        success: false,
        status:  429,
        message: "Too many requests. Please try again later.",
    });
};

/**
 * Key generator for unauthenticated endpoints — limits per IP.
 * Uses express-rate-limit's built-in ipKeyGenerator to correctly
 * handle both IPv4 and IPv6 addresses (required in v7+).
 */
const byIp = (req, res) => rateLimit.ipKeyGenerator(req, res);

/**
 * Key generator for authenticated endpoints — limits per user ID.
 * Falls back to ipKeyGenerator if user isn't on the request yet.
 */
const byUserId = (req, res) => {
    return req.user?.user_id
        ? `user_${req.user.user_id}`
        : rateLimit.ipKeyGenerator(req, res);
};

// ─── Factory ──────────────────────────────────────────────────────────────────

const make = ({ windowMinutes, max, keyGenerator }) => {
    if (process.env.SKIP_RATE_LIMIT === "true") {
        return (req, res, next) => next();
    }
    return rateLimit({
        windowMs: windowMinutes * 60 * 1000,
        max,
        keyGenerator,
        handler: rateLimitHandler,
        standardHeaders: true,
        legacyHeaders: false,
    });
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🔴 CRITICAL — Brute-force / abuse targets
// ═══════════════════════════════════════════════════════════════════════════════

/** POST /auth/2fa/validate */
const mfaValidateLimiter = make({ windowMinutes: 15, max: 5, keyGenerator: byIp });

/** POST /auth/2fa/send-otp */
const mfaSendOtpLimiter = make({ windowMinutes: 10, max: 3, keyGenerator: byIp });

/** POST /atm/verify */
const atmVerifyLimiter = make({ windowMinutes: 15, max: 5, keyGenerator: byIp });

/** POST /atm/generate-pin */
const atmGeneratePinLimiter = make({ windowMinutes: 10, max: 3, keyGenerator: byIp });

/** POST /atm/deposit */
const atmDepositLimiter = make({ windowMinutes: 15, max: 10, keyGenerator: byIp });

/** POST /atm/withdraw */
const atmWithdrawLimiter = make({ windowMinutes: 15, max: 10, keyGenerator: byIp });

/** POST /bills/pay */
const billPayLimiter = make({ windowMinutes: 15, max: 10, keyGenerator: byIp });

/** POST /wallet/deposit */
const walletDepositLimiter = make({ windowMinutes: 15, max: 10, keyGenerator: byIp });

// ═══════════════════════════════════════════════════════════════════════════════
// 🟡 MODERATE — Enumeration / resource abuse (keyed by user ID)
// ═══════════════════════════════════════════════════════════════════════════════

/** GET /users/search */
const userSearchLimiter = make({ windowMinutes: 1, max: 20, keyGenerator: byUserId });

/** POST /auth/2fa/setup */
const mfaSetupLimiter = make({ windowMinutes: 60, max: 5, keyGenerator: byUserId });

/** POST /auth/2fa/regenerate-backup-codes */
const mfaRegenerateLimiter = make({ windowMinutes: 60, max: 3, keyGenerator: byUserId });

/** POST /kyc/submit */
const kycSubmitLimiter = make({ windowMinutes: 60, max: 3, keyGenerator: byUserId });

// ═══════════════════════════════════════════════════════════════════════════════
// 🟢 GLOBAL FALLBACK — General API protection
// ═══════════════════════════════════════════════════════════════════════════════

/** Applied to ALL /api/v1/* routes as a safety net */
const globalLimiter = make({ windowMinutes: 15, max: 100, keyGenerator: byIp });

// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
    // Critical
    mfaValidateLimiter,
    mfaSendOtpLimiter,
    atmVerifyLimiter,
    atmGeneratePinLimiter,
    atmDepositLimiter,
    atmWithdrawLimiter,
    billPayLimiter,
    walletDepositLimiter,
    // Moderate
    userSearchLimiter,
    mfaSetupLimiter,
    mfaRegenerateLimiter,
    kycSubmitLimiter,
    // Global
    globalLimiter,
};