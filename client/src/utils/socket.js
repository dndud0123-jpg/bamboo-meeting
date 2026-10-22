import { io } from 'socket.io-client';

// Connect automatically to the current serving origin (Single-Origin Architecture)
export const socket = io({
  transports: ['websocket', 'polling']
});
