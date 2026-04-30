const express = require("express");
const router = express.Router();

const getAllUsersController = require("../../controllers/users/getAllUsersController");
const getSingleUserController = require("../../controllers/users/getSingleUserController");
const updateUserController = require("../../controllers/users/updateUserController");
const deletUserController = require("../../controllers/users/deletUserController");

router.get("/", getAllUsersController);
router.get("/:id", getSingleUserController);
router.patch("/:id", updateUserController);
router.delete("/:id", deletUserController);

module.exports = router;
