import { configureStore } from '@reduxjs/toolkit';
import productReducer from './slices/productSlice';

export const store = configureStore({
    reducer: {
      products: productReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActionPaths: ['payload.priceHistory.date', 'meta.arg.date'],
          ignoredPaths: ['products.items.priceHistory.date'],
        },
      }),
  });
  
// Remove TypeScript type definitions
export const getState = store.getState;
export const dispatch = store.dispatch;