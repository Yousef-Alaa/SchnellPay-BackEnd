const asyncWrapper = require("../../middleware/asyncWrapper");
const AppError = require("../../utils/appError");
const {
    getPaymentMethodsByUserId,
    deletePaymentMethod,
    setDefaultPaymentMethod
} = require("../../models/paymentMethodsModel");

const { addCard } = require("../../models/cardModel");
const { addMobileWallet } = require("../../models/mobileWalletmodel");

// GET /api/v1/payment-methods
const getAllPaymentMethods = asyncWrapper(async (req, res, next) => {
    
    const userId = req.user.id; 
    
    const methods = await getPaymentMethodsByUserId(userId);
    
    res.status(200).json({ 
        status: "success", 
        data: methods 
    });
});

// POST /api/v1/payment-methods/card
const addCardMethod = asyncWrapper(async (req, res, next) => {
    const userId = req.user.id;
    const cardData = req.body;
    const { cardNumber, expiryDate, cardHolderName } = cardData;
    if (!cardNumber || !expiryDate || !cardHolderName) {
        return next(new AppError("Please provide all required fields: card number, expiry date, and cardholder name.", 400));
    }
    
    const newCard = await addCard(userId, cardData);
    
    res.status(201).json({ 
        status: "success", 
        data: newCard 
    });
});

// POST /api/v1/payment-methods/mobile
const addMobileWalletMethod = asyncWrapper(async (req, res, next) => {
    const userId = req.user.id;
    const walletData = req.body;

    const newWallet = await addMobileWallet(userId, walletData);
    
    res.status(201).json({ 
        status: "success", 
        data: newWallet 
    });
});

// DELETE /api/v1/payment-methods/:id
const removePaymentMethod = asyncWrapper(async (req, res, next) => {
    const userId = req.user.id;
    const methodId = req.params.id;

    if (!methodId) {
        return next(new AppError("Payment method ID is required", 400));
    }

    await deletePaymentMethod(userId, methodId); 
    
    res.status(200).json({ 
        status: "success", 
        message: "Payment method deleted successfully" 
    });
});

// PATCH /api/v1/payment-methods/:id/default
const setMethodAsDefault = asyncWrapper(async (req, res, next) => {
    const userId = req.user.id;
    const methodId = req.params.id;

    if (!methodId) {
        return next(new AppError("Payment method ID is required", 400));
    }

    await setDefaultPaymentMethod(userId, methodId);
    
    res.status(200).json({ 
        status: "success", 
        message: "Default payment method updated successfully" 
    });
});

module.exports = {
    getAllPaymentMethods,
    addCardMethod,
    addMobileWalletMethod,
    removePaymentMethod,
    setMethodAsDefault
};