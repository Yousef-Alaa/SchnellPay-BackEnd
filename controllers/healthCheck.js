const nodemailer = require("nodemailer");

const { poolPromise } = require("../config/db");
const asyncWrapper = require("../middleware/asyncWrapper");
const sendWebhookAlert = require("../utils/sendWebhookAlert");



const healthCheck = asyncWrapper(async (req, res) => {
    
    
    let hasError = false;
    const status = { DB: 'OK', Mail: 'OK' };


    // 1. Verify Database Connection
    try {
        const pool = await poolPromise;
        const result = await pool
            .request()
            .query("SELECT * FROM [USERS]");
        if (result.recordset.length == 0) throw new Error("Can't Access Users Table");
    } catch (err) {
        status.DB = 'FAILED: ' + err.message;
        hasError = true;
    }



    // 2. Verify Email Credentials/Key
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
        },
    });

    try {
        await transporter.verify(); // Tests SMTP connection & auth key validity
    } catch (err) {
        status.Mail = 'FAILED: ' + err.message;
        hasError = true;
    }

    if (hasError) {
        // Send immediate alert to Discord/Telegram Webhook
        await sendWebhookAlert(status, "Health Check Failed ❌");
        return res.status(500).json(status);
    }
    
    await sendWebhookAlert(status, "Health Check Done ✅");
    return res.status(200).json(status);
});


module.exports = healthCheck;