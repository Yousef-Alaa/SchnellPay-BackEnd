const bcrypt    = require("bcryptjs");
const speakeasy = require("speakeasy");
const qrcode    = require("qrcode");
const crypto    = require("crypto");

const AppError     = require("../../utils/appError");
const asyncWrapper = require("../../middleware/asyncWrapper");
const generateJWT  = require("../../utils/generatJwt");
const { findById } = require("../../models/userModel");
const {
    getMfaStatus,
    getMfaStatusByUsername,
    saveOtp,
    clearOtp,
    saveTotpSecret,
    enableMfa,
    disableMfa,
    saveBackupCodes,
    getUnusedBackupCodes,
    markBackupCodeUsed,
} = require("../../models/twoFaModel");
const { sendOtpEmail, sendBackupCodesEmail } = require("../../utils/mfaMailer");

// ─── Constants ────────────────────────────────────────────────────────────────

const OTP_EXPIRY_MINUTES = 10;
const BACKUP_CODE_COUNT  = 10;
const BCRYPT_ROUNDS      = 10; // bcrypt cost factor

// ─── Helpers ──────────────────────────────────────────────────────────────────

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const generateBackupCodes = async () => {
    const plainCodes  = Array.from({ length: BACKUP_CODE_COUNT }, () =>
        crypto.randomBytes(5).toString("hex").toUpperCase()
    );
    const hashedCodes = await Promise.all(
        plainCodes.map((c) => bcrypt.hash(c, BCRYPT_ROUNDS))
    );
    return { plainCodes, hashedCodes };
};

const verifyBackupCode = async (userId, code) => {
    const backupCodes = await getUnusedBackupCodes(userId);
    for (const { code_id, code_hash } of backupCodes) {
        const match = await bcrypt.compare(code, code_hash);
        if (match) return code_id;
    }
    return null;
};

// ─── Controllers ─────────────────────────────────────────────────────────────

// @desc   Initiate MFA setup — choose method ('email' | 'app')
// @route  POST /api/v1/2fa/setup
// @access Private
const setupMfa = asyncWrapper(async (req, res, next) => {
    
    const { method } = req.body;
    const userId = req.user.id;

    if (!method || !["email", "app"].includes(method)) {
        return next(AppError.create("Method must be 'email' or 'app'.", 400, false));
    }

    const mfa = await getMfaStatus(userId);
    if (!mfa) return next(AppError.create("User not found.", 404, false));

    if (mfa.mfa_enabled) {
        return next(
            AppError.create("MFA is already enabled. Disable it first to change method.", 400, false)
        );
    }

    // ── Email ─────────────────────────────────────────────────────────────────
    if (method === "email") {
        const user      = await findById(userId);
        const otp       = generateOtp();
        const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
        const hashedOtp = await bcrypt.hash(otp, BCRYPT_ROUNDS);
        
        await saveOtp(userId, hashedOtp, expiresAt);
        await sendOtpEmail(user.email, user.f_name, otp);
        
        return res.status(200).json({
            status:  "success",
            message: `A 6-digit verification code has been sent to ${user.email}. It expires in ${OTP_EXPIRY_MINUTES} minutes.`,
            data:    { method: "email" },
        });
    }

    // ── Auth App (TOTP) ───────────────────────────────────────────────────────
    if (method === "app") {
        const user   = await findById(userId);
        const secret = speakeasy.generateSecret({
            name:   `YourApp (${user.email})`,
            length: 20,
        });

        await saveTotpSecret(userId, secret.base32);
        const qrCodeDataUrl = await qrcode.toDataURL(secret.otpauth_url);

        return res.status(200).json({
            status:  "success",
            message: "Scan the QR code with your authenticator app, then call /verify-setup with the 6-digit code.",
            data: {
                method:  "app",
                secret:  secret.base32,   // fallback for manual entry
                qr_code: qrCodeDataUrl,   // base64 PNG → <img src="...">
            },
        });
    }
});

// ─────────────────────────────────────────────────────────────────────────────

// @desc   Verify the first MFA code to confirm setup + receive backup codes
// @route  POST /api/v1/2fa/verify-setup
// @access Private
const verifySetup = asyncWrapper(async (req, res, next) => {
    const { code } = req.body;
    const userId   = req.user.id;

    if (!code) return next(AppError.create("Verification code is required.", 400, false));

    const mfa = await getMfaStatus(userId);
    if (!mfa) return next(AppError.create("User not found.", 404, false));

    if (mfa.mfa_enabled) {
        return next(AppError.create("MFA is already active.", 400, false));
    }

    // Detect which method is pending
    const method = mfa.totp_secret && !mfa.mfa_method
        ? "app"
        : mfa.otp_code
        ? "email"
        : null;

    if (!method) {
        return next(AppError.create("No pending MFA setup found. Call /setup first.", 400, false));
    }

    // ── Verify email OTP ──────────────────────────────────────────────────────
    if (method === "email") {
        if (!mfa.otp_code || !mfa.otp_expires_at) {
            return next(AppError.create("No pending OTP. Call /setup first.", 400, false));
        }
        if (new Date(mfa.otp_expires_at) < new Date()) {
            await clearOtp(userId);
            return next(AppError.create("OTP expired. Please start setup again.", 400, false));
        }
        const isValid = await bcrypt.compare(code, mfa.otp_code);
        if (!isValid) return next(AppError.create("Invalid verification code.", 401, false));
    }

    // ── Verify TOTP ───────────────────────────────────────────────────────────
    if (method === "app") {
        if (!mfa.totp_secret) {
            return next(AppError.create("No pending TOTP secret. Call /setup first.", 400, false));
        }
        const isValid = speakeasy.totp.verify({
            secret:   mfa.totp_secret,
            encoding: "base32",
            token:    code,
            window:   1, // ±30s clock drift tolerance
        });
        if (!isValid) return next(AppError.create("Invalid authenticator code.", 401, false));
    }

    // ── Enable MFA + generate backup codes ────────────────────────────────────
    const { plainCodes, hashedCodes } = await generateBackupCodes();
    await enableMfa(userId, method);
    await saveBackupCodes(userId, hashedCodes);

    const user = await findById(userId);
    await sendBackupCodesEmail(user.email, user.f_name, plainCodes);

    return res.status(200).json({
        status:  "success",
        message: "MFA enabled. Backup codes have been sent to your email — store them safely. They will not be shown again.",
        data: {
            method,
            backup_codes: plainCodes, // shown once here only
        },
    });
});

// ─────────────────────────────────────────────────────────────────────────────

// @desc   Send a login OTP to email (called after password check, before JWT)
// @route  POST /api/v1/2fa/send-otp
// @access Public
const sendLoginOtp = asyncWrapper(async (req, res, next) => {
    const { username } = req.body;

    if (!username) return next(AppError.create("Username is required.", 400, false));

    const mfa = await getMfaStatusByUsername(username);
    if (!mfa) return next(AppError.create("User not found.", 404, false));

    if (!mfa.mfa_enabled || mfa.mfa_method !== "email") {
        return next(AppError.create("Email MFA is not enabled for this account.", 400, false));
    }

    const otp       = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    const hashedOtp = await bcrypt.hash(otp, BCRYPT_ROUNDS);

    await saveOtp(mfa.user_id, hashedOtp, expiresAt);
    await sendOtpEmail(mfa.email, mfa.f_name, otp);

    return res.status(200).json({
        status:  "success",
        message: `A verification code has been sent to your email. It expires in ${OTP_EXPIRY_MINUTES} minutes.`,
    });
});

// ─────────────────────────────────────────────────────────────────────────────

// @desc   Validate a 2FA code or backup code at login — issues JWT on success
// @route  POST /api/v1/2fa/validate
// @access Public
const validateMfa = asyncWrapper(async (req, res, next) => {
    const { username, code } = req.body;

    if (!username || !code) {
        return next(AppError.create("Username and code are required.", 400, false));
    }

    const mfa = await getMfaStatusByUsername(username);
    if (!mfa) return next(AppError.create("User not found.", 404, false));

    if (!mfa.mfa_enabled) {
        return next(AppError.create("MFA is not enabled for this account.", 400, false));
    }

    let verified = false;

    // ── Email OTP ─────────────────────────────────────────────────────────────
    if (mfa.mfa_method === "email" && mfa.otp_code && mfa.otp_expires_at) {
        if (new Date(mfa.otp_expires_at) >= new Date()) {
            verified = await bcrypt.compare(code, mfa.otp_code);
            if (verified) await clearOtp(mfa.user_id);
        } else {
            await clearOtp(mfa.user_id); // expired — clean up silently
        }
    }

    // ── TOTP (Auth App) ───────────────────────────────────────────────────────
    if (!verified && mfa.mfa_method === "app" && mfa.totp_secret) {
        verified = speakeasy.totp.verify({
            secret:   mfa.totp_secret,
            encoding: "base32",
            token:    code,
            window:   1,
        });
    }

    // ── Backup code fallback ──────────────────────────────────────────────────
    if (!verified) {
        const codeId = await verifyBackupCode(mfa.user_id, code);
        if (codeId) {
            await markBackupCodeUsed(codeId);
            verified = true;
        }
    }

    if (!verified) {
        return next(AppError.create("Invalid or expired MFA code.", 401, false));
    }

    // ── Issue JWT ─────────────────────────────────────────────────────────────
    const user  = await findById(mfa.user_id);
    const token = generateJWT({
        id:    user.user_id,
        email: user.email,
        name:  `${user.f_name} ${user.l_name}`,
        role:  user.role,
    });

    return res.status(200).json({
        success: true,
        message: "MFA verified. Logged in successfully.",
        token,
    });
});

// ─────────────────────────────────────────────────────────────────────────────

// @desc   Disable MFA (requires a valid MFA code to confirm)
// @route  POST /api/v1/2fa/disable
// @access Private
const disableMfaHandler = asyncWrapper(async (req, res, next) => {
    const { code } = req.body;
    const userId   = req.user.id;

    if (!code) return next(AppError.create("MFA code is required to disable MFA.", 400, false));

    const mfa = await getMfaStatus(userId);
    if (!mfa) return next(AppError.create("User not found.", 404, false));

    if (!mfa.mfa_enabled) {
        return next(AppError.create("MFA is not enabled on this account.", 400, false));
    }

    let verified = false;

    if (mfa.mfa_method === "email" && mfa.otp_code && mfa.otp_expires_at) {
        if (new Date(mfa.otp_expires_at) >= new Date()) {
            verified = await bcrypt.compare(code, mfa.otp_code);
        }
    }

    if (!verified && mfa.mfa_method === "app" && mfa.totp_secret) {
        verified = speakeasy.totp.verify({
            secret:   mfa.totp_secret,
            encoding: "base32",
            token:    code,
            window:   1,
        });
    }

    if (!verified) {
        const codeId = await verifyBackupCode(userId, code);
        if (codeId) {
            await markBackupCodeUsed(codeId);
            verified = true;
        }
    }

    if (!verified) {
        return next(AppError.create("Invalid MFA code. Disable aborted.", 401, false));
    }

    await disableMfa(userId);

    return res.status(200).json({
        status:  "success",
        message: "MFA has been disabled on your account.",
    });
});

module.exports = { setupMfa, verifySetup, validateMfa, disableMfaHandler, sendLoginOtp };