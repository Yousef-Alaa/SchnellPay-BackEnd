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

const findAll = async ({ limit, offset, search }) => {
  const pool = await poolPromise;
  const searchParam = search ? `%${search}%` : "%";
  const result = await pool
    .request()
    .input("search", sql.NVarChar, searchParam)
    .input("limit", sql.Int, limit)
    .input("offset", sql.Int, offset)
    .query(
      `SELECT user_id, f_name, l_name, email, user_name, phone,
              role, account_status, creation_date, country
       FROM [USERS]
       WHERE f_name LIKE @search OR l_name LIKE @search
          OR email LIKE @search OR user_name LIKE @search
       ORDER BY creation_date DESC
       OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`,
    );
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
    .query(
      `INSERT INTO [USERS] (f_name, l_name, email, user_name, phone, password, role, country)
       OUTPUT INSERTED.user_id
       VALUES (@f_name, @l_name, @email, @user_name, @phone, @password, @role, @country)`,
    );
  return result.recordset[0].user_id;
};

module.exports = {
  findById,
  findByEmail,
  findByUsername,
  findAll,
  count,
  create,
};
