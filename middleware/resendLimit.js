const rateLimit = require("express-rate-limit");

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    status: 429,
    message: "Too many requests, please try again later.",
  },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    status: 429,
    message: "Too many login attempts, please try again after 15 minutes.",
  },
});

const registerLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 3,
  message: {
    success: false,
    message: "Too many accounts created from this IP. Try again in an hour.",
  },
});

const verifyEmailLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: "Too many OTP attempts, try again later",
});

const otpLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1,
  message: {
    success: false,
    status: 429,
    message: "Please wait 1 minute before requesting another code.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const forgetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: "Too many password reset requests, try again later",
});

const verifyResetOtpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: "Too many OTP attempts, try again later",
});

const resetPasswordLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 3,
  message: "Too many reset attempts, try again later",
});

const changePasswordLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: "Too many password change attempts, try again later",
});

// User self update
const updateMeLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: "Too many profile updates, try again later",
});

// User delete account
const deleteMeLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: "Too many delete attempts, try again later",
});

// Admin read users
const adminGetUsersLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  message: "Too many requests, try again later",
});

// Admin update user
const adminUpdateUserLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 15,
  message: "Too many update attempts, try again later",
});

// Admin delete user
const adminDeleteUserLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: "Too many delete attempts, try again later",
});

const transactionLimiter = rateLimit({
  windowMs: 30 * 1000, // 30 seconds
  max: 1, // allow only 1 transaction every 30 seconds
  message: {
    success: false,
    message:
      "Transaction in progress. Please wait 30 seconds before trying again.",
  },
});

module.exports = {
  globalLimiter,
  loginLimiter,
  otpLimiter,
  transactionLimiter,
  registerLimiter,
  verifyEmailLimiter,
  forgetPasswordLimiter,
  verifyResetOtpLimiter,
  resetPasswordLimiter,
  changePasswordLimiter,
  updateMeLimiter,
  deleteMeLimiter,
  adminGetUsersLimiter,
  adminUpdateUserLimiter,
  adminDeleteUserLimiter,
};
