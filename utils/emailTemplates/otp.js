const otpTemplate = (otp) => `
<div style="background-color: #020817; padding: 40px 10px; font-family: sans-serif; color: #f8fafc; text-align: center;">
  <div style="max-width: 500px; margin: 0 auto; background-color: #0b1120; border: 1px solid #1e293b; border-radius: 16px; padding: 30px;">
    <h2 style="color: #00ffb0; text-transform: uppercase; margin: 0;">SchnellPay</h2>
    <hr style="border: 0; border-top: 1px solid #1e293b; margin: 20px 0;">
    <h3 style="color: #f8fafc; margin-bottom: 10px;">Verification Code</h3>
    <p style="color: #94a3b8; font-size: 15px;">Use the code below to secure your account.</p>
    
    <div style="margin: 30px 0; padding: 20px 10px; background-color: #0f172a; border: 2px dashed #00ffb0; border-radius: 12px; overflow: hidden;">
      <div style="font-size: 32px; font-weight: bold; color: #00ffb0; letter-spacing: 6px; font-family: monospace; white-space: nowrap; display: inline-block;">
        ${otp}
      </div>
    </div>
    
    <p style="color: #64748b; font-size: 12px;">Valid for 10 minutes.</p>

    <hr style="border: 0; border-top: 1px solid #1e293b; margin: 20px 0;">

    <p style="font-size: 12px; color: #64748b; line-height: 1.4; text-align: center; padding: 0 10px;">
      If you didn't request this code, you can safely ignore this email. Someone might have entered your email address by mistake.
    </p>

    <div style="margin-top: 20px; font-size: 12px; color: #00ffb0; opacity: 0.8; text-align: center;">
      © 2026 SchnellPay | Secure Electronic Wallet
    </div>
  </div>
</div>
`;

module.exports = otpTemplate;
