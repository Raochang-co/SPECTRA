// src/socket.js - Socket.io client configuration
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';

export const createSocket = (slotNumber, playerId) => {
  const socket = io(SOCKET_URL);
  
  socket.on('connect', () => {
    console.log('Socket connected');
    socket.emit('joinGame', { slotNumber, playerId, playerName: `Player_${playerId.slice(0, 8)}` });
  });
  
  return socket;
};

export default createSocket;