const asyncWrapper = require("../../middleware/asyncWrapper");
const { sql, poolPromise } = require("../../config/db");
const bcrypt = require("bcryptjs");
const AppError = require("../../utils/appError");
const UserModel = require("../../models/userModel");
const crypto = require("crypto");
const sendEmail = require("../../utils/sendEmail");
const updateOTP = require("../../models/userModel");

// @desc Create new account for a user
// @route POST /api/v1/auth/register
// @access Public
const register = asyncWrapper(async (req, res, next) => {
  const { fname, lname, email, password, phone, country, user_name } = req.body;
  if (
    !fname ||
    !lname ||
    !email ||
    !password ||
    !phone ||
    !country ||
    !user_name
  ) {
    const error = AppError.create("All fields are required", 400, false);
    return next(error);
  }

  const existingUser = await UserModel.findByEmail(email);
  const existingUsername = await UserModel.findByUsername(user_name);

  if (existingUsername) {
    const error = AppError.create("Username already taken", 400, false);
    return next(error);
  }

  if (existingUser) {
    const error = AppError.create(
      "User with the same email already exists",
      400,
      false,
    );
    return next(error);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await UserModel.create({
    f_name: fname,
    l_name: lname,
    email: email,
    user_name: user_name,
    phone: phone,
    password: hashedPassword,
    country: country,
  });
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");

  const expires = Date.now() + 10 * 60 * 1000; // 10 minutes

  await UserModel.updateOTP(email, hashedOTP, expires);
  await sendEmail(email, "Verify your account", "OTP", [otp]);
  res.status(201).json({
    success: true,
    id: newUser,
  });
});

module.exports = register;
