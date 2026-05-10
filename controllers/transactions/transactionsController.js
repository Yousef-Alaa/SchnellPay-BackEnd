const crypto = require("crypto");
const { sql, poolPromise } = require("../../config/db");

const AppError = require("../../utils/appError");
const asyncWrapper = require("../../middleware/asyncWrapper");

const { findByUsername, findById } = require("../../models/userModel");
const { deductBalance, addBalance } = require("../../models/walletModel");
const { 
  createTransaction, 
  getTransactionById, 
  updateTransactionStatus,
  checkExistingRefund 
} = require("../../models/transactionModel");
const { createNotification } = require("../../utils/notificationHelper");

// @desc Send Money To another user
// @route POST /api/v1/transactions/send
// @access Private
exports.sendMoney = asyncWrapper(async (req, res, next) => {
  const { receiver_username, amount, description } = req.body;

  if (!receiver_username || !amount)
    return next(AppError.create("Missing required fields", 400, false));

  if (!amount || amount <= 0)
    return next(AppError.create("Invalid amount", 400, false));

  const [sender, receiver] = await Promise.all([
    findById(req.user.user_id),
    findByUsername(receiver_username),
  ]);

  if (!sender) return next(AppError.create("Sender not found", 400, false));
  if (sender.user_name === receiver_username)
    return next(AppError.create("Cannot transfer to yourself", 400, false));
  if (!receiver) return next(AppError.create("Receiver not found", 400, false));

  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);
  let transactionStarted = false;

  try {
    await transaction.begin();
    transactionStarted = true;

    const deducted = await deductBalance(transaction, sender.user_id, amount);
    if (!deducted) throw AppError.create("Insufficient balance", 400, false);

    const added = await addBalance(transaction, receiver.user_id, amount);
    if (!added) throw AppError.create("Receiver wallet not found", 400, false);

    const refNumber =
      "TXN-" + crypto.randomBytes(4).toString("hex").toUpperCase();
    await createTransaction(
      transaction,
      sender.user_id,
      receiver.user_id,
      amount,
      description,
      refNumber,
    );

    await transaction.commit();
    transactionStarted = false;

    // Create notifications for both sender and receiver
    createNotification(
      sender.user_id,
      "Money Sent",
      `You successfully sent ${amount} EGP to ${receiver_username}. Ref: ${refNumber}`,
      "TRANSACTION",
      sender.email,
    );

    createNotification(
      receiver.user_id,
      "Money Received",
      `You received ${amount} EGP from ${sender.user_name}. Ref: ${refNumber}`,
      "TRANSACTION",
      receiver.email,
    );

    res.json({
      success: true,
      message: "Transaction successful",
      data: { reference: refNumber },
    });
  } catch (err) {
    if (transactionStarted) await transaction.rollback();
    next(err);
  }
});

// @desc Update transaction status manually (Admin)
// @route PATCH /api/v1/transactions/:id/status
// @access Private/Admin
exports.updateStatus = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!['completed', 'failed', 'pending'].includes(status)) {
    return next(AppError.create("Invalid status", 400));
  }
  
  await updateTransactionStatus(id, status);

  // Fetch transaction details to notify the correct user
  const txn = await getTransactionById(id);
  if (txn) {
    const userId = txn.sender_id || txn.receiver_id;
    if (userId) {
      createNotification(
        userId,
        "Transaction Update",
        `Your transaction (Ref: ${txn.reference_number || txn.transaction_id}) has been marked as ${status}.`,
        "TRANSACTION",
        null
      );
    }
  }
    
  res.json({ success: true, message: "Status updated successfully" });
});

// @desc Refund a transaction (Admin)
// @route POST /api/v1/transactions/:id/refund
// @access Private/Admin
exports.refundTransaction = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;
  const pool = await poolPromise;
  
  const txn = await getTransactionById(id);
    
  if (!txn) return next(AppError.create("Transaction not found", 404));
  if (txn.status !== 'completed') return next(AppError.create("Only completed transactions can be refunded", 400));
  

  // Safety check: verify if a refund already exists for this transaction
  const originalRef = txn.reference_number || txn.transaction_id.toString();
  const alreadyRefunded = await checkExistingRefund(originalRef);
  
  if (alreadyRefunded) {
    return next(AppError.create("This transaction has already been refunded.", 400));
  }

  const amount = txn.amount;
  const originalSender = txn.sender_id;
  const originalReceiver = txn.receiver_id;
  
  const transaction = new sql.Transaction(pool);
  let transactionStarted = false;
  
  try {
    await transaction.begin();
    transactionStarted = true;
    
    // Reverse balances
    if (originalReceiver) {
      const deducted = await deductBalance(transaction, originalReceiver, amount);
      if (!deducted) throw AppError.create("Insufficient balance in receiver wallet for refund", 400);
    }
    if (originalSender) {
      await addBalance(transaction, originalSender, amount);
    }
    
    const refNumber = "REF-" + crypto.randomBytes(4).toString("hex").toUpperCase();
    const desc = `Refund for TXN ${txn.reference_number || txn.transaction_id}`;
    
    await createTransaction(
      transaction,
      originalReceiver,
      originalSender,
      amount,
      desc,
      refNumber,
      "refund"
    );
      
    await transaction.commit();
    transactionStarted = false;

    // Notify the original sender about the refund
    if (originalSender) {
      const senderUser = await findById(originalSender);
      createNotification(
        originalSender,
        "Refund Received",
        `A refund of ${amount} EGP has been credited back to your wallet for transaction ${txn.reference_number || txn.transaction_id}. Ref: ${refNumber}`,
        "TRANSACTION",
        senderUser?.email
      );
    }

    res.json({ success: true, message: "Transaction refunded successfully", data: { reference: refNumber } });
  } catch (err) {
    if (transactionStarted) await transaction.rollback();
    next(err);
  }
});
