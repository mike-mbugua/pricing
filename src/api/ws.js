// /api/ws.js
import { Server } from 'socket.io';

// Store active connections
let connections = [];

export default function handler(req, res) {
  if (res.socket.server.io) {
    console.log('Socket already running');
    res.end();
    return;
  }
  
  console.log('Setting up socket');
  const io = new Server(res.socket.server);
  res.socket.server.io = io;
  
  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    connections.push(socket);
    
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      connections = connections.filter(conn => conn.id !== socket.id);
    });
  });
  
  res.end();
}

// Helper function to broadcast scraping progress to all clients
export function broadcastProgress(data) {
  if (connections.length > 0) {
    connections.forEach(socket => {
      socket.emit('message', JSON.stringify({
        type: 'progress',
        ...data
      }));
    });
  }
}

// Helper function to broadcast price changes to all clients
export function broadcastPriceChanges(data) {
  if (connections.length > 0) {
    connections.forEach(socket => {
      socket.emit('message', JSON.stringify({
        type: 'priceChange',
        ...data
      }));
    });
  }
}

// Helper function to broadcast completion to all clients
export function broadcastComplete(data) {
  if (connections.length > 0) {
    connections.forEach(socket => {
      socket.emit('message', JSON.stringify({
        type: 'complete',
        ...data
      }));
    });
  }
}