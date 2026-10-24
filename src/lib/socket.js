import { io } from 'socket.io-client';

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://tien-len-backend.onrender.com';

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(BACKEND_URL, {
      reconnectionDelay: 800,
      reconnectionDelayMax: 5000,
      timeout: 20000
    });
  }
  return socket;
}
