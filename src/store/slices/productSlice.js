import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import z from 'zod';

const ProductSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  competitorName: z.string(),
  url: z.string().url(),
  currentPrice: z.number(),
  newPrice: z.number().optional(),
  lastChecked: z.date().optional(),
  priceHistory: z.array(
    z.object({
      price: z.number(),
      date: z.date()
    })
  ).optional()
});

export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('https://price-scraper.michael-135.workers.dev/products');
      
      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.products && Array.isArray(data.products)) {
        const productsWithIds = data.products.map((product, index) => ({
          ...product,
          id: product.id || `${product.competitorName}-${index}`,
          priceHistory: product.priceHistory || [{
            price: product.currentPrice,
            date: new Date().toISOString(), 
          }]
        }));
        
        return productsWithIds;
      } 
      else if (Array.isArray(data)) {
        const productsWithIds = data.map((product, index) => ({
          ...product,
          id: product.id || `${product.competitorName}-${index}`,
          priceHistory: product.priceHistory || [{
            price: product.currentPrice,
            date: new Date().toISOString(), 
          }]
        }));
        
        return productsWithIds;
      }
      else {
        console.error('Unexpected API response format:', data);
        throw new Error('Unexpected API response format');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const saveProduct = createAsyncThunk(
  'products/saveProduct',
  async (productData, { rejectWithValue }) => {
    try {
      const result = ProductSchema.safeParse(productData);
      if (!result.success) {
        throw new Error('Invalid product data: ' + result.error.message);
      }
      
      const formattedData = {
        ...productData,
        id: productData.id || `${productData.competitorName}-${Date.now()}`,
        priceHistory: productData.priceHistory || [{
          price: productData.currentPrice,
          date: new Date().toISOString(),
        }],
        lastChecked: productData.lastChecked || new Date().toISOString()
      };
      
      const response = await fetch('https://price-scraper.michael-135.workers.dev/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API responded with status ${response.status}`);
      }
      
      const data = await response.json();
      return formattedData; 
    } catch (error) {
      console.error('Error saving product:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const updateProductPrices = createAsyncThunk(
  'products/updatePrices',
  async (productIds, { getState, rejectWithValue }) => {
    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productIds }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update prices');
      }
      
      const updatedProducts = await response.json();
      return updatedProducts;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// New thunk for price scraping
export const scrapePrices = createAsyncThunk(
  'products/scrapePrices',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const products = state.products.items;
      
      const response = await fetch('/api/scrape-prices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ products }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to scrape prices');
      }
      
      const scrapedData = await response.json();
      
      // If there are price changes, send email notification
      if (scrapedData.priceChanges && scrapedData.priceChanges.length > 0) {
        await fetch('/api/send-price-notification', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ priceChanges: scrapedData.priceChanges }),
        });
      }
      
      return scrapedData;
    } catch (error) {
      console.error('Error scraping prices:', error);
      return rejectWithValue(error.message);
    }
  }
);

const productSlice = createSlice({
  name: 'products',
  initialState: {
    items: [],
    loading: false,
    error: null,
    lastUpdated: null,
    scrapeProgress: {
      total: 0,
      completed: 0,
      inProgress: false,
      priceChanges: [],
      completedProducts: []
    }
  },
  reducers: {
    addProduct: (state, action) => {
      const result = ProductSchema.safeParse(action.payload);
      if (result.success) {
        state.items.push({
          ...result.data,
          priceHistory: result.data.priceHistory || [{
            price: result.data.currentPrice,
            date: new Date().toISOString(), 
          }]
        });
      }
    },
    removeProduct: (state, action) => {
      state.items = state.items.filter(product => product.id !== action.payload);
    },
    updateScrapeProgress: (state, action) => {
      state.scrapeProgress = {
        ...state.scrapeProgress,
        ...action.payload
      };
    },
    resetScrapeProgress: (state) => {
      state.scrapeProgress = {
        total: 0,
        completed: 0,
        inProgress: false,
        priceChanges: [],
        completedProducts: []
      };
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(saveProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(saveProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.items.push(action.payload);
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(saveProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateProductPrices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProductPrices.fulfilled, (state, action) => {
        state.loading = false;
        
        action.payload.forEach(updatedProduct => {
          const index = state.items.findIndex(item => item.id === updatedProduct.id);
          if (index !== -1) {
            state.items[index].priceHistory = [
              ...(state.items[index].priceHistory || []),
              {
                price: updatedProduct.newPrice,
                date: new Date().toISOString(), 
              }
            ];
            
            state.items[index].currentPrice = state.items[index].newPrice || state.items[index].currentPrice;
            state.items[index].newPrice = updatedProduct.newPrice;
            state.items[index].lastChecked = new Date().toISOString();
          }
        });
        
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(updateProductPrices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Handle scrapePrices states
      .addCase(scrapePrices.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.scrapeProgress.inProgress = true;
        state.scrapeProgress.total = state.items.length;
        state.scrapeProgress.completed = 0;
        state.scrapeProgress.priceChanges = [];
        state.scrapeProgress.completedProducts = [];
      })
      .addCase(scrapePrices.fulfilled, (state, action) => {
        state.loading = false;
        
        // Update products with new prices
        action.payload.updatedProducts.forEach(updatedProduct => {
          const index = state.items.findIndex(item => item.id === updatedProduct.id);
          if (index !== -1) {
            // Add to price history
            if (state.items[index].currentPrice !== updatedProduct.newPrice) {
              state.items[index].priceHistory = [
                ...(state.items[index].priceHistory || []),
                {
                  price: updatedProduct.newPrice,
                  date: new Date().toISOString(), 
                }
              ];
            }
            
            // Update current price to match new price
            state.items[index].currentPrice = updatedProduct.newPrice;
            state.items[index].newPrice = updatedProduct.newPrice;
            state.items[index].lastChecked = new Date().toISOString();
            state.items[index].isOnOffer = updatedProduct.isOnOffer;
            state.items[index].originalPrice = updatedProduct.originalPrice;
          }
        });
        
        state.scrapeProgress.inProgress = false;
        state.scrapeProgress.completed = state.items.length;
        state.scrapeProgress.priceChanges = action.payload.priceChanges || [];
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(scrapePrices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.scrapeProgress.inProgress = false;
      });
  }
});

export const { addProduct, removeProduct, updateScrapeProgress, resetScrapeProgress } = productSlice.actions;
export default productSlice.reducer;