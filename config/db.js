const sql = require("mssql");
const sendWebhookAlert = require("../utils/sendWebhookAlert");
require("dotenv").config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  connectionTimeout: 30000, // 30 seconds connection timeout for cold starts / DB wake-up
  requestTimeout: 30000,    // 30 seconds request timeout
  options: {
    encrypt: true,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let poolPromise = null;

function getPool() {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(config)
      .connect()
      .then((pool) => {
        console.log("Connected to SQL Server");
        return pool;
      })
      .catch(async (err) => {
        console.log("DB Connection Failed:", err.message);
        poolPromise = null; // Reset promise so subsequent requests can attempt to reconnect
        await sendWebhookAlert(
          { error: err.message, code: err.code },
          "DB Connection Failed ❌"
        );
        throw err;
      });
  }
  return poolPromise;
}

module.exports = {
  sql,
  get poolPromise() {
    return getPool();
  },
};

