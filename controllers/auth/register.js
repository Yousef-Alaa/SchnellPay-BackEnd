const asyncWrapper = require("../../middleware/asyncWrapper");
const { sql, poolPromise } = require("../../config/db");
const bcrypt = require("bcryptjs");
const AppError = require("../../utils/appError");
const UserModel = require("../../models/userModel");

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

  res.status(201).json({
    success: true,
    data: newUser,
  });
});

module.exports = register;
