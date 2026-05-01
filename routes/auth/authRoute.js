const express = require("express");
const register = require("../../controllers/auth/register");
const login = require("../../controllers/auth/login");
const verifyEmail = require("../../controllers/auth/verifyEmail");
const resendOtp = require("../../controllers/auth/resendOtp");
const resendLimit = require("../../middleware/resendLimit");
const changePassword = require("../../controllers/auth/changePassword");
const resetPassword = require("../../controllers/auth/resetPassword");
const forgetPassword = require("../../controllers/auth/forgetPassword");
const verifyToken = require("../../middleware/verifyToken");
const router = express.Router();

router.post("/login", resendLimit.loginLimiter, login);
router.post("/register", resendLimit.registerLimiter, register);
router.post("/verify-email", verifyEmail);
router.post("/forget-password", forgetPassword);
router.post("/reset-password", resetPassword);
router.post("/change-password", verifyToken, changePassword);
router.post("/resend-otp", resendLimit.otpLimiter, resendOtp);

module.exports = router;
