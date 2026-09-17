const { poolPromise, sql } = require("../config/db");

const insertNotification = async (userId, title, body, type) => {
  const pool = await poolPromise;
  return await pool
    .request()
    .input("userId", sql.Int, userId)
    .input("title", sql.NVarChar(255), title)
    .input("body", sql.NVarChar(sql.MAX), body)
    .input("type", sql.NVarChar(50), type)
    .query(`INSERT INTO NOTIFICATIONS (user_id, title, body, type) 
                    VALUES (@userId, @title, @body, @type)`);
};

const listNotifications = async (userId, limit = 10, offset = 0) => {
  const pool = await poolPromise;
  return await pool.request()
    .input("userId", sql.Int, userId)
    .input("limit", sql.Int, limit)
    .input("offset", sql.Int, offset)
    .query(`SELECT * FROM NOTIFICATIONS 
            WHERE user_id = @userId 
            ORDER BY is_read ASC, created_at DESC
            OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`);
};

const countNotifications = async (userId) => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input("userId", sql.Int, userId)
    .query("SELECT COUNT(*) as total FROM NOTIFICATIONS WHERE user_id = @userId");
  return result.recordset[0].total;
};

const markRead = async (id, userId) => {
  const pool = await poolPromise;
  return await pool
    .request()
    .input("id", sql.Int, id)
    .input("userId", sql.Int, userId)
    .query(
      "UPDATE NOTIFICATIONS SET is_read = 1 WHERE notification_id = @id AND user_id = @userId",
    );
};

const markAllRead = async (userId) => {
  const pool = await poolPromise;
  return await pool
    .request()
    .input("userId", sql.Int, userId)
    .query("UPDATE NOTIFICATIONS SET is_read = 1 WHERE user_id = @userId");
};

const deleteNotification = async (id, userId) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("notifId", sql.Int, id)
    .input("uId", sql.Int, userId)
    .query("DELETE FROM NOTIFICATIONS WHERE notification_id = @notifId AND user_id = @uId");

  return result.rowsAffected[0];
};

const deleteAll = async (userId) => {
  const pool = await poolPromise;
  return await pool
    .request()
    .input("userId", sql.Int, userId)
    .query("DELETE FROM NOTIFICATIONS WHERE user_id = @userId");
};

module.exports = {
  insert: insertNotification,
  list: listNotifications,
  markRead: markRead,
  markAllRead: markAllRead,
  delete: deleteNotification,
  deleteAll: deleteAll,
  count: countNotifications,
};
