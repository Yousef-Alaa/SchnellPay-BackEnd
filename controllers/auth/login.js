const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const asyncWrapper     = require("../../middleware/asyncWrapper");
const AppError         = require("../../utils/appError");
const issueTokens      = require("../../utils/issueTokens");
const UserModel        = require("../../models/userModel");
const { getMfaStatus } = require("../../models/twoFaModel");

// @desc   User Login
// @route  POST /api/v1/auth/login
// @access Public
const login = asyncWrapper(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password)
        return next(AppError.create("All fields are required.", 400, false));

    const user = await UserModel.findByEmail(email);
    if (!user)
        return next(AppError.create("Invalid email or password.", 401, false));

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
        return next(AppError.create("Invalid email or password.", 401, false));

    if (!user.is_verified) {
        return next(
            AppError.create(
            "Please verify your email before logging in.",
            403,
            false,
            ),
        );
    }

    // ── MFA gate
    // If the user has MFA enabled, do NOT issue a JWT yet.
    // Return a signal so the frontend knows to start the MFA step.
    const mfa = await getMfaStatus(user.user_id);

    if (mfa && mfa.mfa_enabled) {

        const playload = {
            username: user.user_name,
            method: mfa.mfa_method,
            purpose: 'mfa'
        };

        const mfa_token = jwt.sign(playload, process.env.MFA_TOKEN_SECRET, { expiresIn: "10m" });

        return res.status(200).json({
            success: true,
            requires2FA: true,
            message: "MFA verification required.",
            data: {
                username: user.user_name, // frontend passes this to /send-otp and /validate
                method: mfa.mfa_method, // 'email' | 'app' — frontend decides next step
                mfa_token
            },
        });
    }

    // No MFA — issue access token + refresh token
    const accessToken = await issueTokens(user, res);

    return res.status(200).json({
        success: true,
        message: "User logged in successfully.",
        token:   accessToken,
    });
});

module.exports = login;
