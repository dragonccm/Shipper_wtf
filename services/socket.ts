import { io, Socket } from 'socket.io-client';
import { API_URL } from '@/constants/config';

interface WalletData {
  shipperId: string;
  balance: number;
}

interface DepositResponse {
  success: boolean;
  message: string;
  newBalance?: number;
}

export const socket: Socket = io(API_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

socket.on('connect', () => {
  console.log('Socket connected');
});

socket.on('disconnect', () => {
  console.log('Socket disconnected');
});

socket.on('error', (error) => {
  console.error('Socket error:', error);
}); 