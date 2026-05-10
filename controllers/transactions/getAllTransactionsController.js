const asyncyWrapper = require("../../middleware/asyncWrapper");
const transactionModel = require("../../models/transactionModel");

const getAllTransactionController = asyncyWrapper(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const type = req.query.type || null;
  const status = req.query.status || null;
  const from = req.query.from || null;
  const to = req.query.to || null;
  const search = req.query.search || null;
  
  const transactions = await transactionModel.getAllTransactions({
    limit,
    offset: skip,
    type,
    status,
    from,
    to,
    search,
  });
  const total = await transactionModel.countAll({ type, status, from, to, search });
  res.status(200).json({
    success: true,
    results: transactions.length,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    data: transactions,
  });
});

module.exports = getAllTransactionController;
