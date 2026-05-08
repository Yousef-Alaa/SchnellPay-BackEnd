const jwt = require("jsonwebtoken");

module.exports = (playload) => {
  const token = jwt.sign(playload, process.env.SECRET_KEY, {
    expiresIn: process.env.NODE_ENV === "development" ? "1h" : "15m" 
  });
  return token;
};
