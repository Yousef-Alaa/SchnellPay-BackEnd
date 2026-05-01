const asyncWrapper = require("../../middleware/asyncWrapper");
const { sql, poolPromise } = require("../../config/db");
const bcrypt = require("bcryptjs");
const generateJWT = require("../../utils/generatJwt");
const AppError = require("../../utils/appError");
const UserModel = require("../../models/userModel");

// @desc User Login
// @route POST /api/v1/auth/login
// @access Public

const login = asyncWrapper(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    const error = AppError.create("All fields are required", 400, false);
    return next(error);
  }
  const user = await UserModel.findByEmail(email);

  if (!user) {
    const error = AppError.create("Invalid email or password", 401, false);
    return next(error);
  }
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    const error = AppError.create("Invalid email or password", 401, false);
    return next(error);
  }

  if (!user.is_verified) {
    const error = AppError.create(
      "Please verify your email before logging in",
      403,
      false,
    );
    return next(error);
  }
  const token = generateJWT({
    id: user.user_id,
    email: user.email,
    name: `${user.f_name} ${user.l_name}`,
    role: user.role,
  });

  return res.status(200).json({
    success: true,
    message: "User logged in successfully",
    token: token,
  });
});

module.exports = login;
