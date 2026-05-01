// api/send-order-email.js
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { to_email, to_name, order_id, order_total, confirmation_link } = req.body;

    const brevoPayload = {
        sender: { 
            name: "Formique Official", 
            email: "YOUR_VERIFIED_BREVO_EMAIL@domain.com" // IMPORTANT: Replace with your verified Brevo email
        },
        to: [{ email: to_email, name: to_name }],
        subject: `Action Required: Confirm Your Formique Order (${order_id})`,
        htmlContent: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Formique Order Confirmation</title>
            </head>
            <body style="margin: 0; padding: 0; background-color: #fafafa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
                
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fafafa; padding: 60px 20px;">
                    <tr>
                        <td align="center">
                            
                            <!-- Main Email Card -->
                            <table width="100%" max-width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border: 1px solid #eeeeee; max-width: 600px; width: 100%;">
                                
                                <!-- Brand Header -->
                                <tr>
                                    <td style="padding: 40px 40px 30px 40px; text-align: center; border-bottom: 1px solid #eeeeee;">
                                        <h1 style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 28px; font-weight: normal; color: #1a1a1a; letter-spacing: -0.5px;">Formique</h1>
                                    </td>
                                </tr>
                                
                                <!-- Email Body -->
                                <tr>
                                    <td style="padding: 50px 40px 40px 40px;">
                                        <h2 style="margin: 0 0 24px 0; font-size: 12px; font-weight: 600; color: #757575; text-transform: uppercase; letter-spacing: 2px;">Action Required</h2>
                                        
                                        <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.8; color: #1a1a1a;">Hello ${to_name},</p>
                                        
                                        <p style="margin: 0 0 40px 0; font-size: 15px; line-height: 1.8; color: #444444;">
                                            Thank you for shopping with Formique. We have successfully reserved your items for Order <strong>#${order_id}</strong>. To complete your secure purchase of <strong>${order_total}</strong>, please verify your transaction by clicking the button below.
                                        </p>
                                        
                                        <!-- CTA Button -->
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td align="center">
                                                    <a href="${confirmation_link}" style="display: inline-block; padding: 16px 40px; background-color: #000000; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px;">Verify & Confirm Order</a>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <p style="margin: 50px 0 0 0; font-size: 13px; line-height: 1.6; color: #888888; border-top: 1px solid #eeeeee; padding-top: 30px;">
                                            If you did not initiate this transaction, please ignore this email or contact our support team immediately.
                                        </p>
                                    </td>
                                </tr>
                                
                            </table>

                            <!-- Footer Content -->
                            <table width="100%" max-width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%;">
                                <tr>
                                    <td style="padding: 30px 20px; text-align: center;">
                                        <p style="margin: 0; font-size: 11px; color: #aaaaaa; text-transform: uppercase; letter-spacing: 1px;">&copy; 2026 Formique Official Store. All rights reserved.</p>
                                    </td>
                                </tr>
                            </table>

                        </td>
                    </tr>
                </table>

            </body>
            </html>
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
            throw new Error(\`Brevo responded with status: \${response.status}\`);
        }

        const data = await response.json();
        res.status(200).json({ success: true, messageId: data.messageId });
    } catch (error) {
        console.error("Email Error:", error);
        res.status(500).json({ success: false, error: 'Failed to send confirmation email' });
    }
}