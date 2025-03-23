// /api/send-price-notification.js
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { priceChanges } = req.body;
  
  if (!priceChanges || !Array.isArray(priceChanges) || priceChanges.length === 0) {
    return res.status(400).json({ error: 'Price changes array is required' });
  }
  
  try {
    await sendPriceChangeEmail(priceChanges);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error sending email notification:', error);
    res.status(500).json({ error: error.message });
  }
}

async function sendPriceChangeEmail(priceChanges) {
  // Configure email transport
  const transporter = nodemailer.createTransport({
    // Configure your email provider here
    // For example, for Gmail:
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
  
  // Build email content
  let emailHtml = `
    <h2>Price Change Notification</h2>
    <p>The following products have price changes:</p>
    <table border="1" cellpadding="5" style="border-collapse: collapse;">
      <tr>
        <th>Product</th>
        <th>Previous Price (KES)</th>
        <th>New Price (KES)</th>
        <th>Difference</th>
        <th>% Change</th>
        <th>On Offer</th>
      </tr>
  `;
  
  priceChanges.forEach(change => {
    const priceDirection = change.difference > 0 ? 'increase' : 'decrease';
    const colorStyle = change.difference > 0 ? 'color: red;' : 'color: green;';
    
    emailHtml += `
      <tr>
        <td><a href="${change.url}">${change.name}</a></td>
        <td>${change.oldPrice.toFixed(2)}</td>
        <td>${change.newPrice.toFixed(2)}</td>
        <td style="${colorStyle}">${change.difference > 0 ? '+' : ''}${change.difference.toFixed(2)}</td>
        <td style="${colorStyle}">${change.difference > 0 ? '+' : ''}${change.percentageChange}%</td>
        <td>${change.isOnOffer ? `Yes (Original: KES ${change.originalPrice.toFixed(2)})` : 'No'}</td>
      </tr>
    `;
  });
  
  emailHtml += `
    </table>
    <p>View all products: <a href="${process.env.APP_URL || 'https://your-app-url.com'}/products">Open Product Dashboard</a></p>
  `;
  
  // Send email
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.NOTIFICATION_EMAIL || process.env.EMAIL_USER,
      subject: `Price Change Alert - ${priceChanges.length} products updated`,
      html: emailHtml
    });
    
    console.log('Price change notification email sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending email notification:', error);
    throw error;
  }
}