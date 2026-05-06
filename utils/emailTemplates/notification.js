const notificationTemplate = (title, body) => {
  return `
  <div style="background-color: #020817; padding: 40px 10px; font-family: sans-serif; color: #f8fafc; text-align: center;">
    
    <div style="max-width: 500px; margin: 0 auto; background-color: #0b1120; border: 1px solid #1e293b; border-radius: 16px; padding: 30px;">
      
      <h1 style="color: #00ffb0; margin: 0;">SchnellPay</h1>
      
      <hr style="border: 0; border-top: 1px solid #1e293b; margin: 20px 0;">
      
      <div style="text-align: left; line-height: 1.6;">
        <h2 style="color: #f8fafc; margin-bottom: 10px;">${title}</h2>
        
        <p style="color: #94a3b8; font-size: 14px;">
          ${body}
        </p>

        <p style="margin-top: 25px; font-size: 13px; color: #64748b;">
          If you have any questions, feel free to contact our support team.
        </p>
      </div>

      <hr style="border: 0; border-top: 1px solid #1e293b; margin: 20px 0;">

      <p style="font-size: 11px; color: #64748b; line-height: 1.4;">
        This is an automated notification for your account activity.
      </p>

      <div style="margin-top: 20px; font-size: 11px; color: #00ffb0; opacity: 0.7;">
        © 2026 SchnellPay | Secure Electronic Wallet
      </div>

    </div>
  </div>
  `;
};

module.exports = notificationTemplate;
