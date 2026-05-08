const sql = require("mssql");
const crypto = require("crypto");

const { poolPromise } = require("../../config/db");
const {
  getProviders,
  getServicesByProvider,
  findService,
  getAllServices
} = require("../../models/billModel");
const { deductBalance } = require("../../models/walletModel");
const { createBillTransaction } = require("../../models/transactionModel");
const { createBillDetails } = require("../../models/billDatailsModel");
const asyncWrapper = require("../../middleware/asyncWrapper");
const AppError = require("../../utils/appError");
const { createNotification } = require("../../utils/notificationHelper");

// @desc Get All Active Providers
// @route GET /api/v1/bills/providers
// @access Private
exports.getProviders = asyncWrapper(async (req, res, next) => {
  const providers = await getProviders(true); // true = active only

  res.json({
    success: true,
    data: providers,
  });
});

// @desc Get All Active Services
// @route GET /api/v1/bills/services
// @access Private
exports.getAllServicesUser = asyncWrapper(async (req, res, next) => {
  const services = await getAllServices(true); // true = active only

  res.json({
    success: true,
    data: services,
  });
});

// @desc Get All Active Sevices for Specific Provider
// @route GET /api/v1/bills/providers/:providerId/services
// @access Private
exports.getServices = asyncWrapper(async (req, res, next) => {
  const { providerId } = req.params;

  const services = await getServicesByProvider(providerId, true); // true = active only

  res.json({
    success: true,
    data: services,
  });
});

// @desc Pay a Bill
// @route POST /api/v1/bills/pay
// @access Private
exports.payBill = asyncWrapper(async (req, res, next) => {
  const { service_id, provider_id, amount, consumer_number } = req.body;
  const userId = req.user.id; 

  if (!amount || amount <= 0) {
    return next(AppError.create("Invalid amount", 400, false));
  }

  const service = await findService(service_id, provider_id);
  if (!service) {
    return next(AppError.create("Service not found", 404, false));
  }

  const totalAmount = amount + service.fee;

  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);
  let transactionStarted = false;

  try {
    await transaction.begin();
    transactionStarted = true;

    const deducted = await deductBalance(transaction, userId, totalAmount);

    if (!deducted) {
      throw AppError.create("Insufficient balance", 400, false);
    }

    const refNumber = crypto.randomBytes(8).toString("hex");

    const transaction_id = await createBillTransaction(
      transaction,
      userId,
      totalAmount,
      refNumber,
    );

    await createBillDetails(
      transaction,
      transaction_id,
      service_id,
      provider_id,
      consumer_number,
    );

    await transaction.commit();
    transactionStarted = false;

    createNotification(
      userId,
      "Bill Payment Success",
      `Your payment of ${totalAmount} EGP for ${service.service_name} (Consumer: ${consumer_number}) was successful. Reference: ${refNumber}.`,
      "BILL",
      req.user?.email,
    );

    res.json({
      success: true,
      message: "Bill paid successfully",
      data: {
        transaction_id,
        reference: refNumber,
        totalAmount,
      },
    });
  } catch (err) {
    if (transactionStarted) await transaction.rollback();
    next(err);
  }
});
