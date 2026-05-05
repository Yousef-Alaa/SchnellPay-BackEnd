const asyncWrapper = require("../../middleware/asyncWrapper");
const transactionModel = require("../../models/transactionModel");

const getUserTransactionService = asyncWrapper(async (req, res) => {
  const userId = req.user.id;
  // Pagination and filtering parameters
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const type = req.query.type || null;
  const status = req.query.status || null;
  const transactions = await transactionModel.findByUserId(userId, {
    limit,
    offset: skip,
    type,
    status,
  });
  const total = await transactionModel.countByUserId(userId, {
    type,
    status,
  });

  res.status(200).json({
    success: true,
    results: transactions.length,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    data: transactions,
  });
});

module.exports = getUserTransactionService;
