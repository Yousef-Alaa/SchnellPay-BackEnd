const express = require("express");
const register = require("../../controllers/auth/register");
const login = require("../../controllers/auth/login");
const verifyEmail = require("../../controllers/auth/verifyEmail");
const resendOtp = require("../../controllers/auth/resendOtp");
const resendLimit = require("../../middleware/resendLimit");
const router = express.Router();

router.post("/login", resendLimit.loginLimiter, login);
router.post("/register", resendLimit.registerLimiter, register);
router.post("/verify-email", verifyEmail);
router.post("/resend-otp", resendLimit.otpLimiter, resendOtp);

module.exports = router;
