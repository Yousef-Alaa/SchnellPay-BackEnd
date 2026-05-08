const AppError     = require("../../utils/appError");
const asyncWrapper = require("../../middleware/asyncWrapper");
const { searchUsers } = require("../../models/userModel");

// @desc   Search for users by username or phone — returns username and full name only
// @route  GET /api/v1/users/search?q=john
// @access Private
const searchUsersController = asyncWrapper(async (req, res, next) => {
    const { q } = req.query;

    if (!q || typeof q !== "string") return next(AppError.create("Search query is required.", 400, false));

    const trimmed = q.trim();

    if (trimmed.length < 3) return next(AppError.create("Search query must be at least 3 characters.", 400, false));
    

    if (trimmed.length > 50) return next(AppError.create("Search query must not exceed 50 characters.", 400, false));
    

    const users = await searchUsers(trimmed);

    return res.status(200).json({
        status: "success",
        data:   { users },
    });
});

module.exports = searchUsersController;