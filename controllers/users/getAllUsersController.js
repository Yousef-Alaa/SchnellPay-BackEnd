const asyncWrapper = require("../../middleware/asyncWrapper");
const userModel = require("../../models/userModel");

const getAllUsersController = asyncWrapper(async (req, res, next) => {
  // Pagination and search parameters
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || "";
  const skip = (page - 1) * limit;

  const sort = req.query.sort || "creation_date";
  const order = req.query.order === "asc" ? "ASC" : "DESC";

  const users = await userModel.findAll({
    limit,
    skip,
    search,
    sort,
    order,
  });

  const total = await userModel.count(search);

  res.status(200).json({
    success: "true",
    results: users.length,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    data: users,
  });
});

module.exports = getAllUsersController;
