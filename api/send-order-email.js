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
          email: "formiquestore@gmail.com" 
        },
        to: [{ email: to_email, name: to_name }],
        subject: `Confirm Your Formique Order #${order_id}`,
        htmlContent: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <!-- Import Store Fonts for supported mail clients -->
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&family=Playfair+Display:wght@400;500&display=swap" rel="stylesheet">
          </head>
          <body style="margin: 0; padding: 0; background-color: #fafafa; -webkit-font-smoothing: antialiased;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fafafa; padding: 60px 20px;">
              <tr>
                <td align="center">
                  <!-- Main Minimalist Container -->
                  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border: 1px solid #eeeeee;">
                    
                    <!-- Header / Logo -->
                    <tr>
                      <td align="center" style="padding: 50px 40px 30px; border-bottom: 1px solid #eeeeee;">
                        <h1 style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 28px; font-weight: 500; letter-spacing: 1px; color: #000000;">Formique</h1>
                      </td>
                    </tr>
                    
                    <!-- Body Content -->
                    <tr>
                      <td style="padding: 50px 40px 40px;">
                        <p style="margin: 0 0 24px; font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 300; color: #1a1a1a; line-height: 1.8; letter-spacing: 0.5px;">Dear ${to_name},</p>
                        <p style="margin: 0 0 40px; font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 300; color: #1a1a1a; line-height: 1.8; letter-spacing: 0.5px;">Thank you for your refined selection. Your order has been securely received and is currently being prepared. To finalize your transaction and initiate dispatch, please confirm your order details below.</p>

                        <!-- Sleek Order Details -->
                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 40px; border-top: 1px solid #eeeeee; border-bottom: 1px solid #eeeeee;">
                          <tr>
                            <td style="padding: 24px 0;">
                              <p style="margin: 0 0 8px; font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px; color: #757575;">Order Number</p>
                              <p style="margin: 0; font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 400; color: #000000;">#${order_id}</p>
                            </td>
                            <td align="right" style="padding: 24px 0;">
                              <p style="margin: 0 0 8px; font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px; color: #757575;">Total Amount</p>
                              <p style="margin: 0; font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 400; color: #000000;">${order_total}</p>
                            </td>
                          </tr>
                        </table>

                        <!-- CTA Button -->
                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                          <tr>
                            <td align="center">
                              <a href="${confirmation_link}" style="display: inline-block; padding: 18px 45px; background-color: #000000; color: #ffffff; text-decoration: none; font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase;">Verify Order</a>
                            </td>
                          </tr>
                        </table>

                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 20px 40px 50px; text-align: center; background-color: #ffffff;">
                        <p style="margin: 0; font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 10px; font-weight: 300; color: #757575; letter-spacing: 1px; line-height: 1.8; text-transform: uppercase;">
                          If you did not initiate this transaction, please disregard this email.<br><br>
                          &copy; ${new Date().getFullYear()} Formique Official Store.<br>All rights reserved.
                        </p>
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