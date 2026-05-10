const { poolPromise, sql } = require("../config/db");

const getDashboardStats = async () => {
  const pool = await poolPromise;

  const statsQuery = `
    SELECT 
      (SELECT COUNT(*) FROM [USERS]) as totalUsers,
      (SELECT ISNULL(SUM(amount), 0) FROM [TRANSACTIONS] WHERE status = 'completed') as totalVolume,
      (SELECT COUNT(*) FROM [USERS] WHERE creation_date >= DATEADD(day, -7, GETDATE())) as newUsersThisWeek,
      (SELECT COUNT(*) FROM [TRANSACTIONS] WHERE status = 'pending') as pendingTransactions,
      (SELECT COUNT(DISTINCT sender_id) FROM [TRANSACTIONS] WHERE created_at >= DATEADD(day, -30, GETDATE())) as activeUsers
  `;

  const result = await pool.request().query(statsQuery);
  return result.recordset[0];
};

const getWeeklyGrowth = async () => {
  const pool = await poolPromise;

  const growthQuery = `
    SELECT 
      FORMAT(created_at, 'ddd') as day,
      COUNT(transaction_id) as tx,
      SUM(amount) as volume
    FROM [TRANSACTIONS]
    WHERE created_at >= DATEADD(day, -7, GETDATE())
    GROUP BY FORMAT(created_at, 'ddd'), DATEPART(weekday, created_at)
    ORDER BY DATEPART(weekday, created_at)
  `;

  const result = await pool.request().query(growthQuery);
  return result.recordset;
};

const getUserGrowth = async () => {
  const pool = await poolPromise;

  const growthQuery = `
    SELECT 
      FORMAT(creation_date, 'ddd') as day,
      COUNT(user_id) as users
    FROM [USERS]
    WHERE creation_date >= DATEADD(day, -7, GETDATE())
    GROUP BY FORMAT(creation_date, 'ddd'), DATEPART(weekday, creation_date)
    ORDER BY DATEPART(weekday, creation_date)
  `;

  const result = await pool.request().query(growthQuery);
  return result.recordset;
};

const getRecentRegistrations = async (limit = 5) => {
  const pool = await poolPromise;
  const result = await pool.request().input("limit", sql.Int, limit).query(`
      SELECT TOP (@limit) f_name, l_name, email, creation_date, account_status, is_verified
      FROM [USERS]
      ORDER BY creation_date DESC
    `);
  return result.recordset;
};

module.exports = {
  getDashboardStats,
  getWeeklyGrowth,
  getUserGrowth,
  getRecentRegistrations,
};
