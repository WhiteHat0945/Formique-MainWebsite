export default async function handler(req, res) {
  // 1. Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { to_email, to_name, order_id, order_total, confirmation_link } = req.body;

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: { 
          name: "Formique Official", 
          email: "formiquestore@gmail.com" // <--- CHANGE THIS
        },
        to: [{ email: to_email, name: to_name }],
        subject: `Confirm Your Formique Order #${order_id}`,
        htmlContent: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f5; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <!-- Main Card Container -->
                  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); overflow: hidden;">
                    
                    <!-- Header -->
                    <tr>
                      <td align="center" style="padding: 40px 20px 20px; text-align: center;">
                        <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 2px; color: #111827; text-transform: uppercase;">Formique</h1>
                      </td>
                    </tr>
                    
                    <!-- Body Content -->
                    <tr>
                      <td style="padding: 20px 40px 30px;">
                        <p style="margin: 0 0 20px; font-size: 16px; color: #4b5563; line-height: 1.6;">Hello ${to_name},</p>
                        <p style="margin: 0 0 30px; font-size: 16px; color: #4b5563; line-height: 1.6;">Thank you for your purchase! We are getting your order ready. To finalize your transaction and proceed to shipping, please verify your order details below.</p>

                        <!-- Order Details Box -->
                        <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 32px;">
                          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td style="padding-bottom: 12px; border-bottom: 1px solid #e5e7eb;">
                                <p style="margin: 0; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280;">Order Number</p>
                                <p style="margin: 4px 0 0; font-size: 18px; font-weight: 600; color: #111827;">#${order_id}</p>
                              </td>
                              <td align="right" style="padding-bottom: 12px; border-bottom: 1px solid #e5e7eb;">
                                <p style="margin: 0; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280;">Total Amount</p>
                                <p style="margin: 4px 0 0; font-size: 18px; font-weight: 600; color: #111827;">${order_total}</p>
                              </td>
                            </tr>
                          </table>
                        </div>

                        <!-- Call to Action Button -->
                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                          <tr>
                            <td align="center">
                              <a href="${confirmation_link}" style="display: inline-block; padding: 16px 36px; background-color: #111827; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px; text-align: center; transition: background-color 0.2s;">Verify My Order</a>
                            </td>
                          </tr>
                        </table>

                        <p style="margin: 32px 0 0; font-size: 14px; color: #9ca3af; text-align: center; line-height: 1.5;">If you didn't make this purchase, you can safely ignore this email.</p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="margin: 0; font-size: 12px; color: #9ca3af;">&copy; ${new Date().getFullYear()} Formique. All rights reserved.</p>
                      </td>
                    </tr>

                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `
      })
    });

    if (response.ok) {
      return res.status(200).json({ success: true });
    } else {
      const errorData = await response.json();
      console.error('Brevo API Error:', errorData);
      return res.status(500).json({ message: 'Brevo failed to send' });
    }
  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ message: error.message });
  }
}