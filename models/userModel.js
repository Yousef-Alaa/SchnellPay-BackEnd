const { poolPromise, sql } = require("../config/db");

// ── Find ──────────────────────────────────────────────────────────────────────

const findById = async (id) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("id", sql.Int, id)
    .query(`SELECT * FROM [USERS] WHERE user_id = @id`);
  return result.recordset[0] || null;
};

const findByEmail = async (email) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("email", sql.NVarChar, email)
    .query("SELECT * FROM [USERS] WHERE email = @email");
  return result.recordset[0] || null; // Return the user object or null if not found
};

const findByUsername = async (username) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("username", sql.NVarChar, username)
    .query("SELECT * FROM [USERS] WHERE user_name = @username");
  return result.recordset[0] || null;
};

// For admin listing with pagination and search

const findAll = async ({ limit, skip, search, sort, order }) => {
  const pool = await poolPromise;
  const searchParam = search ? `%${search}%` : "%";
  const allowedSortFields = [
    "creation_date",
    "f_name",
    "email",
    "user_name",
    "role",
  ];

  const sortField = allowedSortFields.includes(sort) ? sort : "creation_date";
  const orderDirection = order === "ASC" ? "ASC" : "DESC";

  const result = await pool
    .request()
    .input("search", sql.NVarChar, searchParam)
    .input("limit", sql.Int, limit)
    .input("skip", sql.Int, skip).query(`
      SELECT user_id, f_name, l_name, email, user_name, phone,
             role, account_status, creation_date, country
      FROM [USERS]
      WHERE f_name LIKE @search OR l_name LIKE @search
         OR email LIKE @search OR user_name LIKE @search
      ORDER BY ${sortField} ${orderDirection}
      OFFSET @skip ROWS FETCH NEXT @limit ROWS ONLY
    `);

  return result.recordset;
};

const count = async (search) => {
  const pool = await poolPromise;
  const searchParam = search ? `%${search}%` : "%";
  const result = await pool
    .request()
    .input("search", sql.NVarChar, searchParam)
    .query(
      `SELECT COUNT(*) AS total FROM [USERS]
       WHERE f_name LIKE @search OR l_name LIKE @search
          OR email LIKE @search OR user_name LIKE @search`,
    );
  return result.recordset[0].total;
};

// ── Create ────────────────────────────────────────────────────────────────────

const create = async ({
  f_name,
  l_name,
  email,
  user_name,
  phone,
  password,
  role,
  country,
  transaction_PIN,
}) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    // Use parameterized queries to prevent SQL injection
    .input("f_name", sql.NVarChar, f_name)
    .input("l_name", sql.NVarChar, l_name)
    .input("email", sql.NVarChar, email)
    .input("user_name", sql.NVarChar, user_name)
    .input("phone", sql.NVarChar, phone || null)
    .input("password", sql.NVarChar, password)
    .input("role", sql.NVarChar, role || "user")
    .input("country", sql.NVarChar, country || null)
    .input("transaction_PIN", sql.NVarChar, transaction_PIN)
    .query(
      `INSERT INTO [USERS] (f_name, l_name, email, user_name, phone, password, role, country, transaction_PIN)
       OUTPUT INSERTED.user_id
       VALUES (@f_name, @l_name, @email, @user_name, @phone, @password, @role, @country, @transaction_PIN)`,
    );
  return result.recordset[0].user_id;
};

// ── Update ────────────────────────────────────────────────────────────────────

const update = async (id, fields) => {
  const pool = await poolPromise;
  const allowed = [
    "f_name",
    "l_name",
    "phone",
    "country",
    "account_status",
    "role",
  ];
  const setClauses = [];
  const request = pool.request().input("id", sql.Int, id);

  for (const key of allowed) {
    if (fields[key] !== undefined) {
      setClauses.push(`${key} = @${key}`);
      request.input(key, sql.NVarChar, fields[key]);
    }
  }

  if (setClauses.length === 0) return null;

  const result = await request.query(
    `UPDATE [USERS] SET ${setClauses.join(", ")}
     OUTPUT INSERTED.user_id, INSERTED.f_name, INSERTED.l_name,
            INSERTED.email, INSERTED.user_name, INSERTED.account_status
     WHERE user_id = @id`,
  );
  return result.recordset[0] || null;
};

const updateOTP = async (email, otp, expires) => {
  const pool = await poolPromise;

  await pool
    .request()
    .input("email", sql.VarChar, email)
    .input("otp", sql.VarChar, otp)
    .input("expires", sql.BigInt, expires).query(`
      UPDATE USERS
      SET email_otp = @otp,
          email_otp_expires = @expires
      WHERE email = @email
    `);
};

const activateUser = async (email) => {
  const pool = await poolPromise;
  const result = await pool.request().input("email", sql.VarChar, email).query(`
      UPDATE [USERS]   
      SET is_verified = 1, 
          email_otp = NULL, 
          email_otp_expires = NULL 
      OUTPUT INSERTED.user_id 
      WHERE email = @email
    `);
  return result.recordset[0] || null;
};

const updatePassword = async (email, hashedPassword) => {
  const pool = await poolPromise;
  await pool
    .request()
    .input("password", sql.NVarChar, hashedPassword)
    .input("email", sql.VarChar, email)
    .query("UPDATE [USERS] SET password = @password WHERE email = @email");
};

const updatePasswordById = async (id, hashedPassword) => {
  const pool = await poolPromise;
  await pool
    .request()
    .input("password", sql.NVarChar, hashedPassword)
    .input("id", sql.Int, id)
    .query("UPDATE [USERS] SET password = @password WHERE user_id = @id");
};

const saveResetOtp = async (email, otp, expires) => {
  const pool = await poolPromise;

  await pool
    .request()
    .input("email", sql.VarChar, email)
    .input("otp", sql.VarChar, otp)
    .input("expires", sql.BigInt, expires).query(`
      UPDATE USERS
      SET reset_otp = @otp,
          reset_otp_expires = @expires,
          reset_otp_verified = 0
      WHERE email = @email
    `);
};

const markOtpVerified = async (email) => {
  const pool = await poolPromise;

  await pool.request().input("email", sql.VarChar, email).query(`
      UPDATE USERS
      SET reset_otp_verified = 1
      WHERE email = @email
    `);
};

// ── Delete ────────────────────────────────────────────────────────────────────

const deleteUser = async (id) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("id", sql.Int, id)
    .query("DELETE FROM [USERS] OUTPUT DELETED.user_id WHERE user_id = @id");
  return result.recordset[0] || null;
};

const clearResetOtp = async (email) => {
  const pool = await poolPromise;

  await pool.request().input("email", sql.VarChar, email).query(`
      UPDATE USERS
      SET reset_otp = NULL,
          reset_otp_expires = NULL,
          reset_otp_verified = 0
      WHERE email = @email
    `);
};

module.exports = {
  findById,
  findByEmail,
  findByUsername,
  findAll,
  count,
  create,
  update,
  deleteUser,
  updateOTP,
  activateUser,
  updatePassword,
  updatePasswordById,
  saveResetOtp,
  markOtpVerified,
  clearResetOtp,
};
