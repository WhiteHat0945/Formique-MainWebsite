// api/send-order-email.js
export default async function handler(req, res) {
    // Only allow POST requests from your frontend
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { to_email, to_name, order_id, order_total, confirmation_link } = req.body;

    // The data sent to Brevo
    const brevoPayload = {
        sender: { 
            name: "Formique Official", 
            email: "YOUR_VERIFIED_BREVO_EMAIL@domain.com" // Replace this!
        },
        to: [{ email: to_email, name: to_name }],
        subject: `Your Formique Order Confirmation (${order_id})`,
        htmlContent: `
            <h2>Thank you for your order, ${to_name}!</h2>
            <p>Your order <strong>#${order_id}</strong> for <strong>${order_total}</strong> has been placed successfully.</p>
            <p>Please click the link below to confirm your transaction:</p>
            <a href="${confirmation_link}" style="display:inline-block; padding:10px 20px; background:#000; color:#fff; text-decoration:none;">Confirm Order</a>
        `
    };

    try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'api-key': process.env.BREVO_API_KEY
            },
            body: JSON.stringify(brevoPayload)
        });

        if (!response.ok) {
            throw new Error(`Brevo responded with status: ${response.status}`);
        }

        const data = await response.json();
        res.status(200).json({ success: true, messageId: data.messageId });
    } catch (error) {
        console.error("Email Error:", error);
        res.status(500).json({ success: false, error: 'Failed to send confirmation email' });
    }
}