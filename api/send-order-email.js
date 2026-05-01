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
          <div style="font-family: sans-serif; padding: 20px;">
            <h2>Hello ${to_name},</h2>
            <p>Thank you for shopping with Formique. Your order <strong>#${order_id}</strong> for <strong>${order_total}</strong> has been received!</p>
            <p>To finalize your order and proceed to shipping, please click the link below:</p>
            <a href="${confirmation_link}" style="background: black; color: white; padding: 12px 24px; text-decoration: none; display: inline-block;">Verify My Order</a>
          </div>
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