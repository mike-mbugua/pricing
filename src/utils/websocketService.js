// utils/websocketService.js
import { updateScrapeProgress } from '../store/slices/productSlice';

let socket = null;

const connectWebSocket = (dispatch) => {
  // Close existing connection if any
  if (socket) {
    socket.close();
  }
  
  // Create a new WebSocket connection
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || `ws://${window.location.host}/api/ws`;
  socket = new WebSocket(wsUrl);
  
  socket.onopen = () => {
    console.log('WebSocket connection established');
  };
  
  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      
      if (data.type === 'progress') {
        dispatch(updateScrapeProgress({
          completed: data.completed,
          total: data.total,
          currentProduct: data.product
        }));
      } else if (data.type === 'priceChange') {
        dispatch(updateScrapeProgress({
          priceChanges: data.priceChanges
        }));
      } else if (data.type === 'complete') {
        dispatch(updateScrapeProgress({
          inProgress: false,
          completed: data.total,
          priceChanges: data.priceChanges
        }));
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  };
  
  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
  
  socket.onclose = () => {
    console.log('WebSocket connection closed');
    
    // Reconnect after a delay if not intentionally closed
    setTimeout(() => {
      if (socket.readyState === WebSocket.CLOSED) {
        connectWebSocket(dispatch);
      }
    }, 5000);
  };
  
  return socket;
};

const closeWebSocket = () => {
  if (socket) {
    socket.close();
    socket = null;
  }
};

export { connectWebSocket, closeWebSocket };