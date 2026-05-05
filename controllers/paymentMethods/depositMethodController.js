const sql = require("mssql");
const crypto = require("crypto");
const { poolPromise } = require("../../config/db");

const asyncWrapper = require("../../middleware/asyncWrapper");
const AppError = require("../../utils/appError");

const { verifyPaymentMethodOwnership, getPaymentMethodsByUserId } = require("../../models/paymentMethodsModel");
const { addBalance, getWalletByUserId } = require("../../models/walletModel");
const { createAtmTransaction } = require("../../models/transactionModel");

const paymentMethodDeposit = asyncWrapper(async (req, res, next) => {
    const userId = req.user.id;
    const { method_id, amount } = req.body;

    
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
        return next(AppError.create("Please provide a valid deposit amount.", 400, false));
    }

    // Resolve the Method ID (Use provided, or fallback to default)
    let finalMethodId = method_id;

    if (!finalMethodId) {
        const userMethods = await getPaymentMethodsByUserId(userId);
        
        if (userMethods.length === 0 || !userMethods[0].is_default) {
            return next(AppError.create("Neither payment method provided nor default method found.", 400, false));
        }
        
        finalMethodId = userMethods[0].method_id;
    } else {
        const isOwner = await verifyPaymentMethodOwnership(userId, finalMethodId);
        if (!isOwner) {
            return next(AppError.create("Invalid payment method or you do not have permission to use it.", 403, false));
        }
    }

   
    const pool = await poolPromise;
    const dbTx = new sql.Transaction(pool);
    const reference = `DEP-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

    await dbTx.begin();
    try {
       
        const rowsUpdated = await addBalance(dbTx, userId, parsedAmount);
        
        if (rowsUpdated === 0) {
            await dbTx.rollback();
            return next(AppError.create("Failed to update wallet balance. Wallet may not exist.", 500, false));
        }

        
        await createAtmTransaction(dbTx, userId, parsedAmount, "deposit", reference);
        
       
        await dbTx.commit();
        
    } catch (err) {
       
        await dbTx.rollback();
        return next(err);
    }

   
    const updatedWallet = await getWalletByUserId(userId);

  
    res.status(200).json({
        status: "success",
        message: "Deposit successful.",
        data: {
            reference,
            amount: parsedAmount,
            currency: updatedWallet.currency,
            new_balance: updatedWallet.balance,
            method_used: finalMethodId
        }
    });
});

module.exports = { paymentMethodDeposit };