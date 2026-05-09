const express = require("express");
const twoFaRoutes = require("./twoFaRoutes");
const register = require("../../controllers/auth/register");
const login = require("../../controllers/auth/login");
const verifyEmail = require("../../controllers/auth/verifyEmail");
const resendOtp = require("../../controllers/auth/resendOtp");
const changePassword = require("../../controllers/auth/changePassword");
const resetPassword = require("../../controllers/auth/resetPassword");
const forgetPassword = require("../../controllers/auth/forgetPassword");
const verifyToken = require("../../middleware/verifyToken");
const verifyResetOTP = require("../../controllers/auth/verifyResetOtp");
const refreshToken = require("../../controllers/auth/refreshToken");
const logout       = require("../../controllers/auth/logout");
const { 
    loginLimiter, 
    registerLimiter,
    verifyEmailLimiter, 
    forgetPasswordLimiter,
    resetPasswordLimiter,
    changePasswordLimiter, 
    otpLimiter, 
    verifyResetOtpLimiter
} = require("../../middleware/resendLimit");

const router = express.Router();

router.post("/login", loginLimiter, login);
router.post("/register", registerLimiter, register);
router.post("/verify-email", verifyEmailLimiter, verifyEmail);
router.post("/forget-password", forgetPasswordLimiter, forgetPassword);
router.post("/reset-password", resetPasswordLimiter, resetPassword);
router.post("/change-password", changePasswordLimiter, verifyToken, changePassword);
router.post("/resend-otp", otpLimiter, resendOtp);
router.post("/verify-reset-otp", verifyResetOtpLimiter, verifyResetOTP);

router.post("/refresh-token", refreshToken);
router.post("/logout", verifyToken, logout);

router.use("/2fa", twoFaRoutes);

module.exports = router;
