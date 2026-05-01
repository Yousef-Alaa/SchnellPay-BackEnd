const welcomeTemplate = (userName) => `
<div style="background-color: #020817; padding: 40px 10px; font-family: sans-serif; color: #f8fafc; text-align: center;">
  <div style="max-width: 500px; margin: 0 auto; background-color: #0b1120; border: 1px solid #1e293b; border-radius: 16px; padding: 30px;">
    
    <h2 style="color: #00ffb0; margin: 0; font-size: 24px;">Welcome to SchnellPay!</h2>
    <hr style="border: 0; border-top: 1px solid #1e293b; margin: 20px 0;">
    
    <p style="color: #94a3b8; font-size: 16px; line-height: 1.5;">
      Hi <span style="color: #f8fafc; font-weight: bold;">${userName}</span>, your account is now active.
    </p>

    <div style="margin: 25px 0; padding: 15px 20px; background-color: #0f172a; border-left: 4px solid #00ffb0; border-radius: 8px; text-align: left;">
      <p style="color: #f8fafc; margin: 0; font-size: 14px; display: flex; align-items: center;">
        <span style="color: #00ffb0; margin-right: 8px;">✔</span> Secure Wallet Created
      </p>
      <p style="color: #f8fafc; margin: 10px 0 0 0; font-size: 14px; display: flex; align-items: center;">
        <span style="color: #00ffb0; margin-right: 8px;">✔</span> Instant Transfers Enabled
      </p>
    </div>

    <p style="color: #64748b; font-size: 13px;">Start your first transaction now!</p>

    <hr style="border: 0; border-top: 1px solid #1e293b; margin: 20px 0;">

    <p style="font-size: 11px; color: #64748b; line-height: 1.4; text-align: center;">
      You received this email because you recently created an account with SchnellPay. If this wasn't you, please secure your email account immediately.
    </p>

    <div style="margin-top: 20px; font-size: 11px; color: #00ffb0; opacity: 0.7; text-align: center;">
      © 2026 SchnellPay | Secure Electronic Wallet
    </div>
  </div>
</div>
`;

module.exports = welcomeTemplate;
