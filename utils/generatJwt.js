const jwt = require("jsonwebtoken");

module.exports = (playload) => {
  const token = jwt.sign(playload, process.env.SECRET_KEY, { expiresIn: "1h" });
  return token;
};
