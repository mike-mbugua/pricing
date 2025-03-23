// utils/puppeteerScraper.js
import puppeteer from 'puppeteer';

// Configuration options for Puppeteer
const PUPPETEER_OPTIONS = {
  headless: 'new',
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--disable-gpu'
  ],
  defaultViewport: { width: 1280, height: 800 }
};

/**
 * Scrape a product page to extract prices
 * @param {string} url - URL of the product to scrape
 * @returns {Promise<{newPrice: number, isOnOffer: boolean, originalPrice: number|null}>}
 */
export async function scrapeProductPrice(url) {
  let browser = null;
  
  try {
    browser = await puppeteer.launch(PUPPETEER_OPTIONS);
    const page = await browser.newPage();
    
    // Set user agent to avoid being detected as a bot
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    );
    
    // Navigate to the product page
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Initialize variables
    let newPrice = null;
    let isOnOffer = false;
    let originalPrice = null;
    
    // First, check if the product is on offer
    const offerElement = await page.$('.css-1oh8fze');
    
    if (offerElement) {
      // Product is on offer
      isOnOffer = true;
      
      try {
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
      } catch (error) {
        console.error('Error extracting offer price data:', error);
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
        console.error('Error extracting regular price data:', error);
      }
    }
    
    // Close the page to free up memory
    await page.close();
    
    return {
      newPrice,
      isOnOffer,
      originalPrice
    };
  } catch (error) {
    console.error('Error scraping product:', error);
    throw error;
  } finally {
    // Always close the browser to prevent memory leaks
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Batch scrape multiple products
 * @param {Array} products - Array of product objects with urls
 * @param {Function} onProgress - Callback function to report progress
 * @returns {Promise<Array>} - Array of products with updated price info
 */
export async function batchScrapeProducts(products, onProgress = null) {
  const updatedProducts = [];
  const priceChanges = [];
  
  // Initialize browser once for all products
  const browser = await puppeteer.launch(PUPPETEER_OPTIONS);
  
  try {
    // Process each product
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      
      try {
        // Report progress
        if (onProgress) {
          onProgress({
            product: product.name,
            completed: i,
            total: products.length
          });
        }
        
        const page = await browser.newPage();
        await page.setUserAgent(
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        );
        
        // Set longer timeout and wait for network to be idle
        await page.goto(product.url, { waitUntil: 'networkidle2', timeout: 30000 });
        
        // Initialize variables
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
      
      // Add a small delay between requests to avoid overloading the server
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  } finally {
    // Always close the browser
    await browser.close();
  }
  
  return {
    updatedProducts,
    priceChanges
  };
}

export default {
  scrapeProductPrice,
  batchScrapeProducts
};