const sendWebhookAlert = async (statusDetails, title) => {
    
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    
    const message = `
🚨 <b>Message from Schnell-Pay</b>\n
<b>Title:</b> ${title}
<b>Details</b>: ${JSON.stringify(statusDetails, null, 2)}`;

    try {
        const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: CHAT_ID,
            text: message,
            parse_mode: 'HTML' // Allows <b>bold</b>, <code>code</code>, etc.
        })
        });

        const data = await response.json();
        if (!data.ok) throw new Error(data.description);
        
    } catch (error) {
        console.error('Failed to send Telegram alert:', error.message);
    }
}

module.exports = sendWebhookAlert;