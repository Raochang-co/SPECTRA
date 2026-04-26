// src/socket.js
import { io } from 'socket.io-client';

// Auto-detect environment
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 
                   (window.location.origin.replace('3000', '3001')) ||
                   'http://localhost:3001';

export const createSocket = (slotNumber, playerId) => {
  const socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
  });
  
  socket.on('connect', () => {
    console.log('✅ Socket connected to:', SOCKET_URL);
    socket.emit('joinGame', { 
      slotNumber, 
      playerId, 
      playerName: `Player_${playerId.slice(0, 8)}` 
    });
  });
  
  socket.on('connect_error', (error) => {
    console.error('❌ Socket connection error:', error);
  });
  
  return socket;
};

export default createSocket;
