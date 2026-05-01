const transactionTemplate = (amount, currency, status) => `
<div style="background-color: #020817; padding: 40px 10px; font-family: sans-serif; color: #f8fafc; text-align: center;">
  <div style="max-width: 500px; margin: 0 auto; background-color: #0b1120; border: 1px solid #1e293b; border-radius: 16px; padding: 30px;">
    
    <h2 style="color: #00ffb0; margin: 0;">Transaction Alert</h2>
    <hr style="border: 0; border-top: 1px solid #1e293b; margin: 20px 0;">
    
    <div style="margin: 20px 0; padding: 20px 10px; background-color: #0f172a; border-radius: 12px; border: 1px solid #1e293b;">
      <span style="display: block; color: #94a3b8; font-size: 13px; text-transform: uppercase; margin-bottom: 5px;">Amount</span>
      
      <div style="font-size: 28px; font-weight: bold; color: #f8fafc; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
        ${amount} <span style="color: #00ffb0; font-size: 20px;">${currency}</span>
      </div>

      <div style="margin-top: 15px; display: inline-block; padding: 5px 15px; border-radius: 20px; background-color: rgba(30, 41, 59, 0.5); font-size: 14px; color: ${status === "Success" ? "#22c55e" : "#ef4444"}; font-weight: bold;">
        ● ${status}
      </div>
    </div>

    <p style="color: #64748b; font-size: 12px; margin-bottom: 0;">
      If this wasn't you, please contact <b>SchnellPay</b> support immediately.
    </p>

    <hr style="border: 0; border-top: 1px solid #1e293b; margin: 20px 0;">

    <p style="font-size: 11px; color: #64748b; line-height: 1.4; text-align: center;">
      This is an automated notification for your account activity. Secure transactions are our top priority.
    </p>

    <div style="margin-top: 20px; font-size: 11px; color: #00ffb0; opacity: 0.7; text-align: center;">
      © 2026 SchnellPay | Secure Electronic Wallet
    </div>
  </div>
</div>
`;

module.exports = transactionTemplate;
