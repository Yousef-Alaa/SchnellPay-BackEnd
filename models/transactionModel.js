const sql = require("mssql");
const { poolPromise } = require("../config/db");
const appError = require("../utils/appError");

const createTransaction = async (
  transaction,
  senderId,
  receiverId,
  amount,
  description,
  reference,
) => {
  await new sql.Request(transaction)
    .input("sender_id", sql.Int, senderId)
    .input("receiver_id", sql.Int, receiverId)
    .input("amount", sql.Decimal(15, 2), amount)
    .input("desc", sql.VarChar, description)
    .input("ref", sql.VarChar, reference).query(`
        INSERT INTO TRANSACTIONS (
            transaction_type,
            sender_id,
            receiver_id,
            amount,
            status,
            description,
            reference_number
        )
        VALUES (
            'transfer',
            @sender_id,
            @receiver_id,
            @amount,
            'completed',
            @desc,
            @ref
        )
        `);
};

const createBillTransaction = async (
  transaction,
  userId,
  amount,
  reference,
) => {
  const result = await new sql.Request(transaction)
    .input("user_id", sql.Int, userId)
    .input("amount", sql.Decimal(15, 2), amount)
    .input("ref", sql.VarChar, reference).query(`
        INSERT INTO TRANSACTIONS 
        (transaction_type, sender_id, amount, status, description, reference_number)
        OUTPUT INSERTED.transaction_id
        VALUES ('bill', @user_id, @amount, 'completed', 'Bill Payment', @ref)
        `);

  return result.recordset[0].transaction_id;
};

/**
 * Log an ATM deposit or withdrawal.
 * type: 'deposit' | 'withdraw'
 * For deposits  → sender_id = NULL, receiver_id = userId  (money coming in)
 * For withdraws → sender_id = userId, receiver_id = NULL  (money going out)
 */
const createAtmTransaction = async (
  transaction,
  userId,
  amount,
  type,
  reference,
) => {
  const isDeposit = type === "deposit";

  await new sql.Request(transaction)
    .input("user_id", sql.Int, userId)
    .input("amount", sql.Decimal(15, 2), amount)
    .input("type", sql.VarChar, type)
    .input("desc", sql.VarChar, isDeposit ? "ATM Deposit" : "ATM Withdrawal")
    .input("ref", sql.VarChar, reference)
    .input("sender_id", sql.Int, isDeposit ? null : userId)
    .input("receiver_id", sql.Int, isDeposit ? userId : null).query(`
            INSERT INTO TRANSACTIONS
                (transaction_type, sender_id, receiver_id, amount, status, description, reference_number)
            VALUES
                (@type, @sender_id, @receiver_id, @amount, 'completed', @desc, @ref)
        `);
};

// Get transactions with optional filters for type and status, and pagination for admin dashboard
const getAllTransactions = async ({
  limit,
  offset,
  type,
  status,
  from,
  to,
}) => {
  let filter = "WHERE 1=1";

  const pool = await poolPromise;
  const request = pool
    .request()
    .input("limit", sql.Int, limit)
    .input("offset", sql.Int, offset);

  if (type) {
    filter += ` AND t.transaction_type = @type`;
    request.input("type", sql.NVarChar, type);
  }

  if (status) {
    filter += ` AND t.status = @status`;
    request.input("status", sql.NVarChar, status);
  }
  if (from) {
    filter += ` AND t.created_at >= @from`;
    request.input("from", sql.DateTime, from);
  }
  if (to) {
    filter += ` AND t.created_at <= @to`;
    request.input("to", sql.DateTime, to);
  }

  const result = await request.query(`
    SELECT t.*, 
           s.f_name + ' ' + s.l_name AS sender_name, 
           r.f_name + ' ' + r.l_name AS receiver_name
    FROM [TRANSACTIONS] t
    LEFT JOIN [USERS] s ON t.sender_id = s.user_id
    LEFT JOIN [USERS] r ON t.receiver_id = r.user_id
    ${filter}
    ORDER BY t.created_at DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
  `);

  return result.recordset;
};
const countAll = async ({ type, status, from, to }) => {
  let filter = "WHERE 1=1";

  const pool = await poolPromise;
  const request = pool.request();

  if (type) {
    filter += ` AND transaction_type = @type`;
    request.input("type", sql.NVarChar, type);
  }

  if (status) {
    filter += ` AND status = @status`;
    request.input("status", sql.NVarChar, status);
  }

  if (from) {
    filter += ` AND created_at >= @from`;
    request.input("from", sql.DateTime, from);
  }

  if (to) {
    filter += ` AND created_at <= @to`;
    request.input("to", sql.DateTime, to);
  }

  const result = await request.query(`
    SELECT COUNT(*) AS total FROM [TRANSACTIONS] ${filter}
  `);

  return result.recordset[0].total;
};

const findByUserId = async (
  userId,
  { limit, offset, type, status, from, to },
) => {
  let filter = `WHERE (t.sender_id = @userId OR t.receiver_id = @userId)`;

  const pool = await poolPromise;
  const request = pool
    .request()
    .input("userId", sql.Int, userId)
    .input("limit", sql.Int, limit)
    .input("offset", sql.Int, offset);

  if (type) {
    filter += ` AND t.transaction_type = @type`;
    request.input("type", sql.NVarChar, type);
  }

  if (status) {
    filter += ` AND t.status = @status`;
    request.input("status", sql.NVarChar, status);
  }

  if (from) {
    filter += ` AND t.created_at >= @from`;
    request.input("from", sql.DateTime, from);
  }

  if (to) {
    filter += ` AND t.created_at <= @to`;
    request.input("to", sql.DateTime, to);
  }

  const result = await request.query(`
    SELECT t.*,
           s.f_name + ' ' + s.l_name AS sender_name,
           r.f_name + ' ' + r.l_name AS receiver_name
    FROM [TRANSACTIONS] t
    LEFT JOIN [USERS] s ON t.sender_id = s.user_id
    LEFT JOIN [USERS] r ON t.receiver_id = r.user_id
    ${filter}
    ORDER BY t.created_at DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
  `);

  return result.recordset;
};

const countByUserId = async (userId, { type, status, from, to }) => {
  let filter = `WHERE (sender_id = @userId OR receiver_id = @userId)`;

  const pool = await poolPromise;
  const request = pool.request().input("userId", sql.Int, userId);

  if (type) {
    filter += ` AND transaction_type = @type`;
    request.input("type", sql.NVarChar, type);
  }

  if (status) {
    filter += ` AND status = @status`;
    request.input("status", sql.NVarChar, status);
  }

  if (from) {
    filter += ` AND created_at >= @from`;
    request.input("from", sql.DateTime, from);
  }

  if (to) {
    filter += ` AND created_at <= @to`;
    request.input("to", sql.DateTime, to);
  }

  const result = await request.query(`
    SELECT COUNT(*) AS total FROM [TRANSACTIONS] ${filter}
  `);

  return result.recordset[0].total;
};

const getPinByUserId = async (userId) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().input("userId", sql.Int, userId).query(`
        SELECT transactionPin 
        FROM Users 
        WHERE id = @userId
      `);

    if (result.recordset.length === 0) {
      return null;
    }

    return result.recordset[0].transactionPin;
  } catch (err) {
    throw new appError(`Database Error: ${err.message}`, 500);
  }
};

module.exports = getPinByUserId;
module.exports = {
  createBillTransaction,
  createTransaction,
  createAtmTransaction,
  findByUserId,
  countByUserId,
  getAllTransactions,
  countAll,
  getPinByUserId,
};
