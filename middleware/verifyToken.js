const appError = require("../utils/appError");
const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const authHeader = (
    req.header("Authorization") || req.header("authorization")
  )?.split(" ")[1];

  if (!authHeader) {
    const error = appError.create("Token Not Found", 401, false);
    return next(error);
  }

  try {
    const decodedToken = jwt.verify(authHeader, process.env.SECRET_KEY);
    req.user = decodedToken;
    next();
  } catch (err) {
    const error = appError.create("Invalid token", 400, false);
    return next(error);
  }
};
module.exports = verifyToken;
