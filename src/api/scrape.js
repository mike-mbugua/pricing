import puppeteer from 'puppeteer';
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { products } = req.body;
  
  if (!products || !Array.isArray(products)) {
    return res.status(400).json({ error: 'Products array is required' });
  }
  
  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const updatedProducts = [];
    const priceChanges = [];
    
    // Process each product
    for (const product of products) {
      try {
        // Send progress update
        if (req.socket.send) {
          req.socket.send(JSON.stringify({
            type: 'progress',
            product: product.name,
            completed: updatedProducts.length,
            total: products.length
          }));
        }
        
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        
        await page.goto(product.url, { waitUntil: 'networkidle2', timeout: 30000 });
        
        // Check for offer price first
        let newPrice = null;
        let isOnOffer = false;
        let originalPrice = null;
        
        // Check if there's an offer price
        const offerElement = await page.$('.css-1oh8fze');
        
        if (offerElement) {
          // Product is on offer
          isOnOffer = true;
          
          // Get the offer price
          const offerPriceText = await page.$eval('.css-1i90gmp', el => el.textContent);
          const offerPriceMatch = offerPriceText.match(/KES\s+([\d,.]+)/);
          
          if (offerPriceMatch && offerPriceMatch[1]) {
            newPrice = parseFloat(offerPriceMatch[1].replace(/,/g, ''));
          }
          
          // Get the original price
          const originalPriceText = await page.$eval('.css-1bdwabt', el => el.textContent);
          const originalPriceMatch = originalPriceText.match(/KES\s+([\d,.]+)/);
          
          if (originalPriceMatch && originalPriceMatch[1]) {
            originalPrice = parseFloat(originalPriceMatch[1].replace(/,/g, ''));
          }
        } else {
          // Regular price (no offer)
          try {
            const priceText = await page.$eval('.css-17ctnp', el => el.textContent);
            const priceMatch = priceText.match(/KES\s+([\d,.]+)/);
            
            if (priceMatch && priceMatch[1]) {
              newPrice = parseFloat(priceMatch[1].replace(/,/g, ''));
            }
          } catch (error) {
            console.error(`Error extracting price for ${product.name}:`, error);
          }
        }
        
        // Close the page to free up memory
        await page.close();
        
        // If we successfully got a price
        if (newPrice !== null) {
          const updatedProduct = {
            ...product,
            newPrice,
            isOnOffer,
            originalPrice,
            lastChecked: new Date().toISOString()
          };
          
          updatedProducts.push(updatedProduct);
          
          // Check if price has changed
          if (product.currentPrice !== newPrice) {
            const priceChange = {
              id: product.id,
              name: product.name,
              url: product.url,
              oldPrice: product.currentPrice,
              newPrice,
              difference: newPrice - product.currentPrice,
              percentageChange: ((newPrice - product.currentPrice) / product.currentPrice * 100).toFixed(2),
              isOnOffer,
              originalPrice
            };
            
            priceChanges.push(priceChange);
          }
        }
      } catch (error) {
        console.error(`Error processing product ${product.name}:`, error);
      }
    }
    
    // Close the browser
    await browser.close();
    
    // If there are price changes, send notification email
    if (priceChanges.length > 0) {
      await sendPriceChangeEmail(priceChanges);
    }
    
    // Update products in database
    for (const product of updatedProducts) {
      try {
        // Only update if price has changed
        if (product.currentPrice !== product.newPrice) {
          await fetch('https://price-scraper.michael-135.workers.dev/products', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id: product.id,
              currentPrice: product.newPrice,
              priceHistory: [
                ...(product.priceHistory || []),
                {
                  price: product.newPrice,
                  date: new Date().toISOString(),
                }
              ],
              lastChecked: new Date().toISOString(),
              isOnOffer: product.isOnOffer,
              originalPrice: product.originalPrice
            }),
          });
        }
      } catch (updateError) {
        console.error(`Error updating product ${product.name} in database:`, updateError);
      }
    }
    
    res.status(200).json({
      success: true,
      updatedProducts,
      priceChanges
    });
  } catch (error) {
    console.error('Error during price scraping:', error);
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
  } catch (error) {
    console.error('Error sending email notification:', error);
  }
}