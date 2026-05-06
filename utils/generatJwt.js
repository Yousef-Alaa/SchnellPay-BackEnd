const jwt = require("jsonwebtoken");

module.exports = (playload) => {
  const token = jwt.sign(playload, process.env.SECRET_KEY, { expiresIn: "15m" });
  return token;
};
