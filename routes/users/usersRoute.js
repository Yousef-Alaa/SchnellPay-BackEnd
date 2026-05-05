const express = require("express");
const router = express.Router();

const getAllUsersController = require("../../controllers/users/getAllUsersController");
const getSingleUserController = require("../../controllers/users/getSingleUserController");
const updateUserController = require("../../controllers/users/updateUserController");
const deletUserController = require("../../controllers/users/deletUserController");
const allowTo = require("../../middleware/allowTo");
const resendLimit = require("../../middleware/resendLimit");

const verifyToken = require("../../middleware/verifyToken");

router.get("/getMe", verifyToken, getSingleUserController);
router.patch(
  "/updateMe",
  resendLimit.updateMeLimiter,
  verifyToken,
  updateUserController,
);
router.delete(
  "/deleteMe",
  resendLimit.deleteMeLimiter,
  verifyToken,
  deletUserController,
);

router.use(verifyToken, allowTo("admin")); // For admin routes below

router.get("/", resendLimit.adminGetUsersLimiter, getAllUsersController);
router.get("/:id", resendLimit.adminGetUsersLimiter, getSingleUserController);
router.patch("/:id", resendLimit.adminUpdateUserLimiter, updateUserController);
router.delete("/:id", resendLimit.adminDeleteUserLimiter, deletUserController);

module.exports = router;
