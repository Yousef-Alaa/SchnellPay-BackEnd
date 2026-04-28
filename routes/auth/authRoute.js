const express = require("express");
const register = require("../../controllers/auth/register");
const login = require("../../controllers/auth/login");

const router = express.Router();

router.post("/login", login);

router.post("/register", register);

module.exports = router;
