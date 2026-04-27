const sql = require("mssql");
const crypto = require("crypto");

const { poolPromise } = require("../config/db");
const { getProviders, getServicesByProvider, findService } = require("../models/billModel");
const { deductBalance } = require("../models/walletModel");
const { createBillTransaction } = require("../models/transactionModel");
const { createBillDetails } = require("../models/billDatailsModel");


// GET /providers
exports.getProviders = asyncWrapper(async (req, res, next) => {
    const providers = await getProviders();

    res.json({
        success: true,
        data: providers,
    });
});


// GET /providers/:providerId/services
exports.getServices = asyncWrapper(async (req, res, next) => {
    const { providerId } = req.params;

    const services = await getServicesByProvider(providerId);

    res.json({
        success: true,
        data: services,
    });
});


// POST /pay

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

    const totalAmount = amount + service.fees;

    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        const deducted = await deductBalance(transaction, userId, totalAmount);

        if (!deducted) {
            await transaction.rollback();
            return next(AppError.create("Insufficient balance", 400, false));
        }

        const refNumber = crypto.randomBytes(8).toString("hex");

        const transaction_id = await createBillTransaction(
            transaction,
            userId,
            totalAmount,
            refNumber
        );

        await createBillDetails(
            transaction,
            transaction_id,
            service_id,
            provider_id,
            consumer_number
        );

        await transaction.commit();

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
        await transaction.rollback();
        next(err);
    }
});