const nodemailer = require("nodemailer");

const otpTemplate = require("./emailTemplates/otp");
const welcomeTemplate = require("./emailTemplates/welcome");
const transactionTemplate = require("./emailTemplates/transaction");
const notificationTemplate = require("./emailTemplates/notification");
const templates = {
  OTP: otpTemplate,
  WELCOME: welcomeTemplate,
  TRANSACTION: transactionTemplate,
  NOTIFICATION: notificationTemplate,
};

const sendEmail = async (to, subject, type, dataArray) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const htmlContent = templates[type](...dataArray);

    await transporter.sendMail({
      from: `"SchnellPay" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: htmlContent,
    });

    console.log(`Email sent successfully to ${to}`);
  } catch (error) {
    console.error("Email error:", error);
  }
};

module.exports = sendEmail;
