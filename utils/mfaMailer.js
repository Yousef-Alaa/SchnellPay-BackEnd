const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host:   process.env.MAIL_HOST,
    port:   Number(process.env.MAIL_PORT) || 587,
    secure: process.env.MAIL_SECURE === "true",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// ─── Templates ────────────────────────────────────────────────────────────────

const otpEmailHtml = (name, otp) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Your verification code</title>
  <style>
    body { margin:0; padding:0; background:#f4f6f9; font-family: 'Segoe UI', Arial, sans-serif; }
    .wrapper { max-width:520px; margin:40px auto; background:#ffffff;
               border-radius:12px; overflow:hidden;
               box-shadow:0 4px 20px rgba(0,0,0,0.08); }
    .header  { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
               padding:36px 40px; text-align:center; }
    .header h1 { margin:0; color:#ffffff; font-size:22px; font-weight:600;
                 letter-spacing:0.5px; }
    .header p  { margin:6px 0 0; color:#a0aec0; font-size:13px; }
    .body    { padding:40px; }
    .greeting{ font-size:16px; color:#2d3748; margin:0 0 16px; }
    .info    { font-size:14px; color:#718096; line-height:1.6; margin:0 0 32px; }
    .otp-box { background:#f7fafc; border:2px dashed #e2e8f0; border-radius:10px;
               text-align:center; padding:28px 20px; margin-bottom:32px; }
    .otp-box .label { font-size:12px; color:#a0aec0; text-transform:uppercase;
                      letter-spacing:1.5px; margin:0 0 12px; }
    .otp-box .code  { font-size:42px; font-weight:700; color:#1a1a2e;
                      letter-spacing:10px; margin:0; font-family:monospace; }
    .expiry  { font-size:13px; color:#e53e3e; text-align:center;
               margin:-20px 0 32px; }
    .divider { border:none; border-top:1px solid #edf2f7; margin:0 0 24px; }
    .footer  { font-size:12px; color:#a0aec0; line-height:1.6; }
    .footer a{ color:#667eea; text-decoration:none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>Two-Factor Authentication</h1>
      <p>Security verification code</p>
    </div>
    <div class="body">
      <p class="greeting">Hi ${name},</p>
      <p class="info">
        You requested to enable two-factor authentication on your account.
        Use the code below to complete verification. <strong>Do not share this code with anyone.</strong>
      </p>

      <div class="otp-box">
        <p class="label">Your verification code</p>
        <p class="code">${otp}</p>
      </div>
      <p class="expiry">⏱ This code expires in <strong>10 minutes</strong>.</p>

      <hr class="divider"/>
      <p class="footer">
        If you did not request this, please ignore this email or
        <a href="mailto:support@yourapp.com">contact support</a> if you have concerns.<br/><br/>
        — The YourApp Security Team
      </p>
    </div>
  </div>
</body>
</html>`;

// ─────────────────────────────────────────────────────────────────────────────

const backupCodesEmailHtml = (name, codes) => {
    const codeRows = codes
        .map(
            (c, i) => `
        <tr>
          <td style="padding:8px 16px; color:#718096; font-size:13px;">${i + 1}.</td>
          <td style="padding:8px 16px; font-family:monospace; font-size:15px;
                     font-weight:600; color:#1a1a2e; letter-spacing:3px;">${c}</td>
        </tr>`
        )
        .join("");

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Your backup codes</title>
  <style>
    body { margin:0; padding:0; background:#f4f6f9; font-family:'Segoe UI',Arial,sans-serif; }
    .wrapper { max-width:540px; margin:40px auto; background:#ffffff;
               border-radius:12px; overflow:hidden;
               box-shadow:0 4px 20px rgba(0,0,0,0.08); }
    .header  { background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);
               padding:36px 40px; text-align:center; }
    .header h1 { margin:0; color:#ffffff; font-size:22px; font-weight:600; }
    .header p  { margin:6px 0 0; color:#a0aec0; font-size:13px; }
    .body    { padding:40px; }
    .greeting{ font-size:16px; color:#2d3748; margin:0 0 16px; }
    .info    { font-size:14px; color:#718096; line-height:1.6; margin:0 0 24px; }
    .warning { background:#fff5f5; border-left:4px solid #fc8181;
               border-radius:6px; padding:14px 18px; margin-bottom:28px; }
    .warning p { margin:0; font-size:13px; color:#c53030; line-height:1.6; }
    .codes-table { width:100%; border-collapse:collapse;
                   background:#f7fafc; border-radius:8px; overflow:hidden;
                   margin-bottom:28px; }
    .codes-table thead tr { background:#edf2f7; }
    .codes-table thead td { padding:10px 16px; font-size:11px; color:#a0aec0;
                            text-transform:uppercase; letter-spacing:1px; font-weight:600; }
    .codes-table tbody tr:nth-child(even) { background:#f0f4f8; }
    .divider { border:none; border-top:1px solid #edf2f7; margin:0 0 24px; }
    .footer  { font-size:12px; color:#a0aec0; line-height:1.6; }
    .footer a{ color:#667eea; text-decoration:none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>Your Backup Codes</h1>
      <p>Two-factor authentication enabled</p>
    </div>
    <div class="body">
      <p class="greeting">Hi ${name}, two-factor authentication is now active on your account.</p>
      <p class="info">
        Save the backup codes below in a safe place. Each code can be used
        <strong>once</strong> to sign in if you ever lose access to your
        authentication method.
      </p>

      <div class="warning">
        <p>⚠️ <strong>Keep these private.</strong> Anyone with these codes can access your account.
        Once a code is used it is permanently invalidated.</p>
      </div>

      <table class="codes-table">
        <thead>
          <tr>
            <td>#</td>
            <td>Backup Code</td>
          </tr>
        </thead>
        <tbody>${codeRows}</tbody>
      </table>

      <hr class="divider"/>
      <p class="footer">
        If you did not enable 2FA, please
        <a href="mailto:support@yourapp.com">contact support</a> immediately.<br/><br/>
        — The YourApp Security Team
      </p>
    </div>
  </div>
</body>
</html>`;
};

// ─── Send functions ───────────────────────────────────────────────────────────

const sendOtpEmail = async (toEmail, name, otp) => {
    await transporter.sendMail({
        from:    `"YourApp Security" <${process.env.EMAIL_USER}>`,
        to:      toEmail,
        subject: "Your two-factor authentication code",
        html:    otpEmailHtml(name, otp),
    });
};

const sendBackupCodesEmail = async (toEmail, name, plainCodes) => {
    await transporter.sendMail({
        from:    `"YourApp Security" <${process.env.EMAIL_USER}>`,
        to:      toEmail,
        subject: "Your 2FA backup codes — save these now",
        html:    backupCodesEmailHtml(name, plainCodes),
    });
};

module.exports = { sendOtpEmail, sendBackupCodesEmail };