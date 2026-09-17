const sql = require("mssql");
const sendWebhookAlert = require("../utils/sendWebhookAlert");
require("dotenv").config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  connectionTimeout: 10000,
  requestTimeout: 15000,
  options: {
    encrypt: true,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 15000,
  },
};

let poolPromise = null;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function createPool(retries = 5, delayMs = 3000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const pool = await new sql.ConnectionPool(config).connect();
      console.log("Connected to SQL Server");
      return pool;
    } catch (err) {
      console.log(`DB Connection attempt ${attempt}/${retries} failed: ${err.message}`);

      if (attempt === retries) {
        // All retries exhausted — alert and throw
        poolPromise = null;
        await sendWebhookAlert(
          { error: err.message, code: err.code },
          "DB Connection Failed ❌"
        );
        throw err;
      }

      console.log(`Retrying in ${delayMs / 1000}s...`);
      await sleep(delayMs);
    }
  }
}

function getPool() {
  if (!poolPromise) {
    poolPromise = createPool().catch((err) => {
      poolPromise = null; // Reset so future requests can retry
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