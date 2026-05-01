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
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3,
  message: {
    success: false,
    message: "Too many accounts created from this IP. Try again in an hour.",
  },
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

module.exports = {
  globalLimiter,
  loginLimiter,
  otpLimiter,
  transactionLimiter,
  registerLimiter,
};
