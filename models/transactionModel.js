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
            reference_number,
            created_at
        )
        VALUES (
            'transfer',
            @sender_id,
            @receiver_id,
            @amount,
            'completed',
            @desc,
            @ref,
            GETUTCDATE()
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
        (transaction_type, sender_id, amount, status, description, reference_number, created_at)
        OUTPUT INSERTED.transaction_id
        VALUES ('bill', @user_id, @amount, 'completed', 'Bill Payment', @ref, GETUTCDATE())
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
                (transaction_type, sender_id, receiver_id, amount, status, description, reference_number, created_at)
            VALUES
                (@type, @sender_id, @receiver_id, @amount, 'completed', @desc, @ref, GETUTCDATE())
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
  search,
}) => {
  let filter = "WHERE 1=1";

  const pool = await poolPromise;
  const request = pool
    .request()
    .input("limit", sql.Int, limit)
    .input("offset", sql.Int, offset);

  if (type === "income") {
    filter += ` AND t.transaction_type IN ('deposit', 'transfer', 'refund')`;
  } else if (type === "expense") {
    filter += ` AND t.transaction_type IN ('withdraw', 'bill', 'transfer', 'refund')`;
  } else if (type) {
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
  if (search) {
    filter += ` AND (
      t.reference_number LIKE @search OR
      t.description LIKE @search OR
      s.f_name + ' ' + s.l_name LIKE @search OR
      r.f_name + ' ' + r.l_name LIKE @search OR
      TRY_CAST(t.sender_id AS VARCHAR) = @exactSearch OR
      TRY_CAST(t.receiver_id AS VARCHAR) = @exactSearch
    )`;
    request.input("search", sql.NVarChar, `%${search}%`);
    request.input("exactSearch", sql.VarChar, search);
  }

  const result = await request.query(`
    SELECT t.*, 
           s.f_name + ' ' + s.l_name AS sender_name, 
           s.user_name AS sender_username,
           r.f_name + ' ' + r.l_name AS receiver_name,
           r.user_name AS receiver_username
    FROM [TRANSACTIONS] t
    LEFT JOIN [USERS] s ON t.sender_id = s.user_id
    LEFT JOIN [USERS] r ON t.receiver_id = r.user_id
    ${filter}
    ORDER BY t.created_at DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
  `);

  return result.recordset;
};



const countAll = async ({ type, status, from, to, search }) => {
  let filter = "WHERE 1=1";

  const pool = await poolPromise;
  const request = pool.request();

  if (type === "income") {
    filter += ` AND t.transaction_type IN ('deposit', 'transfer', 'refund')`;
  } else if (type === "expense") {
    filter += ` AND t.transaction_type IN ('withdraw', 'bill', 'transfer', 'refund')`;
  } else if (type) {
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

  if (search) {
    filter += ` AND (
      t.reference_number LIKE @search OR
      t.description LIKE @search OR
      s.f_name + ' ' + s.l_name LIKE @search OR
      r.f_name + ' ' + r.l_name LIKE @search OR
      TRY_CAST(t.sender_id AS VARCHAR) = @exactSearch OR
      TRY_CAST(t.receiver_id AS VARCHAR) = @exactSearch
    )`;
    request.input("search", sql.NVarChar, `%${search}%`);
    request.input("exactSearch", sql.VarChar, search);
  }

  const result = await request.query(`
    SELECT COUNT(*) AS total 
    FROM [TRANSACTIONS] t
    LEFT JOIN [USERS] s ON t.sender_id = s.user_id
    LEFT JOIN [USERS] r ON t.receiver_id = r.user_id
    ${filter}
  `);

  return result.recordset[0].total;
};

const findByUserId = async (
  userId,
  { limit, offset, type, status, from, to, search },
) => {
  let filter = `WHERE (t.sender_id = @userId OR t.receiver_id = @userId)`;

  const pool = await poolPromise;
  const request = pool
    .request()
    .input("userId", sql.Int, userId)
    .input("limit", sql.Int, limit)
    .input("offset", sql.Int, offset);

  if (type === "income") {
    filter += ` AND ((t.transaction_type = 'deposit') OR (t.transaction_type = 'transfer' AND t.receiver_id = @userId))`;
  } else if (type === "expense") {
    filter += ` AND ((t.transaction_type IN ('withdraw', 'bill')) OR (t.transaction_type = 'transfer' AND t.sender_id = @userId))`;
  } else if (type) {
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

  if (search) {
    filter += ` AND (
      t.reference_number LIKE @search OR
      t.description LIKE @search OR
      s.f_name + ' ' + s.l_name LIKE @search OR
      r.f_name + ' ' + r.l_name LIKE @search
    )`;
    request.input("search", sql.NVarChar, `%${search}%`);
  }

  const result = await request.query(`
    SELECT t.*,
           s.f_name + ' ' + s.l_name AS sender_name,
           s.user_name AS sender_username,
           r.f_name + ' ' + r.l_name AS receiver_name,
           r.user_name AS receiver_username
    FROM [TRANSACTIONS] t
    LEFT JOIN [USERS] s ON t.sender_id = s.user_id
    LEFT JOIN [USERS] r ON t.receiver_id = r.user_id
    ${filter}
    ORDER BY t.created_at DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
  `);

  return result.recordset;
};

const countByUserId = async (userId, { type, status, from, to, search }) => {
  let filter = `WHERE (t.sender_id = @userId OR t.receiver_id = @userId)`;

  const pool = await poolPromise;
  const request = pool.request().input("userId", sql.Int, userId);

  if (type === "income") {
    filter += ` AND ((t.transaction_type = 'deposit') OR (t.transaction_type = 'transfer' AND t.receiver_id = @userId))`;
  } else if (type === "expense") {
    filter += ` AND ((t.transaction_type IN ('withdraw', 'bill')) OR (t.transaction_type = 'transfer' AND t.sender_id = @userId))`;
  } else if (type) {
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

  if (search) {
    filter += ` AND (
      t.reference_number LIKE @search OR
      t.description LIKE @search OR
      s.f_name + ' ' + s.l_name LIKE @search OR
      r.f_name + ' ' + r.l_name LIKE @search
    )`;
    request.input("search", sql.NVarChar, `%${search}%`);
  }

  const result = await request.query(`
    SELECT COUNT(*) AS total 
    FROM [TRANSACTIONS] t
    LEFT JOIN [USERS] s ON t.sender_id = s.user_id
    LEFT JOIN [USERS] r ON t.receiver_id = r.user_id
    ${filter}
  `);

  return result.recordset[0].total;
};

const getPinByUserId = async (userId) => {
  const pool = await poolPromise;

  const request = pool.request().input("userId", sql.Int, userId);

  const result = await request.query(`
    SELECT transaction_Pin 
    FROM Users 
    WHERE user_id = @userId
  `);

  if (result.recordset.length === 0) {
    return null;
  }

  return result.recordset[0].transaction_Pin;
};

const getTransactionById = async (id) => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input("id", sql.Int, id)
    .query("SELECT * FROM TRANSACTIONS WHERE transaction_id = @id");
  return result.recordset[0];
};

const updateTransactionStatus = async (id, status) => {
  const pool = await poolPromise;
  await pool.request()
    .input("id", sql.Int, id)
    .input("status", sql.VarChar, status)
    .query("UPDATE TRANSACTIONS SET status = @status WHERE transaction_id = @id");
};

module.exports = {
  createBillTransaction,
  createTransaction,
  createAtmTransaction,
  findByUserId,
  countByUserId,
  getAllTransactions,
  countAll,
  getPinByUserId,
  getTransactionById,
  updateTransactionStatus,
};
