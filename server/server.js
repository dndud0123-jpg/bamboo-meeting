const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const os = require('os');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Helper: Get local network IPv4 address for QR code sharing
function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// In-memory state: key is playerId
const players = new Map();
const socketToPlayerId = new Map();
const chatHistory = [];
const MAX_HISTORY = 100;

// High-concurrency 20Hz Tickrate Batching Map
const dirtyPlayers = new Map();

// 20Hz Server Tickrate Batching Loop (every 50ms):
// Batches movement updates from 70+ players into 1 dictionary packet every 50ms,
// reducing packet overhead from O(N^2) to O(N).
setInterval(() => {
  if (dirtyPlayers.size > 0) {
    const batch = {};
    dirtyPlayers.forEach((state, id) => {
      batch[id] = state;
    });
    dirtyPlayers.clear();
    io.emit('world_state_update', batch);
  }
}, 50);

// API endpoint to get server info & LAN address
app.get('/api/info', (req, res) => {
  res.json({
    localIp: getLocalIpAddress(),
    port: 5173,
    onlineCount: players.size
  });
});

app.get('/api/chat', (req, res) => {
  res.json(chatHistory);
});

io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  // 1. Player joins
  socket.on('join', (data) => {
    const { nickname, characterId, charIndex, x, y, id } = data;
    const playerId = id || socket.id;

    // Track socket mapping
    socketToPlayerId.set(socket.id, playerId);

    const isExisting = players.has(playerId);
    const player = {
      id: playerId,
      socketId: socket.id,
      nickname: nickname || '익명 트레이너',
      characterId: characterId || 'red',
      charIndex: typeof charIndex === 'number' ? charIndex : 0,
      x: typeof x === 'number' ? x : 610,
      y: typeof y === 'number' ? y : 520,
      direction: 'down',
      isMoving: false,
      bubble: null
    };

    players.set(playerId, player);

    // Send existing state to joined player
    socket.emit('init_state', {
      selfId: playerId,
      players: Array.from(players.values()),
      chatHistory: chatHistory.slice(-50)
    });

    // Notify other players
    socket.broadcast.emit('player_joined', player);

    // Only log system message if this is a genuinely new participant
    if (!isExisting) {
      const systemMsg = {
        id: 'sys_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        senderId: 'system',
        senderNickname: '시스템',
        characterId: 'system',
        text: `[${player.nickname}] 님이 회의실에 입장하셨습니다.`,
        timestamp: Date.now()
      };
      chatHistory.push(systemMsg);
      if (chatHistory.length > MAX_HISTORY) chatHistory.shift();
      socket.broadcast.emit('chat_message', systemMsg);
    }
  });

  // 2. Player movement (buffered into 20Hz batching queue)
  socket.on('player_move', (data) => {
    const playerId = socketToPlayerId.get(socket.id) || socket.id;
    const player = players.get(playerId);
    if (player) {
      player.x = data.x;
      player.y = data.y;
      player.direction = data.direction || player.direction;
      player.isMoving = !!data.isMoving;

      // Add to batching map
      dirtyPlayers.set(playerId, {
        x: player.x,
        y: player.y,
        direction: player.direction,
        isMoving: player.isMoving
      });
    }
  });

  // 3. Player jump
  socket.on('player_jump', () => {
    const playerId = socketToPlayerId.get(socket.id) || socket.id;
    socket.broadcast.emit('player_jump', { id: playerId });
  });

  // 4. Player chat / reaction message
  socket.on('chat_message', (data) => {
    const playerId = socketToPlayerId.get(socket.id) || socket.id;
    const player = players.get(playerId);
    if (!player) return;

    const trimmedText = (data.text || '').trim();
    if (!trimmedText) return;

    const message = {
      id: data.id || ('msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4)),
      senderId: playerId,
      senderNickname: player.nickname,
      characterId: player.characterId,
      charIndex: typeof player.charIndex === 'number' ? player.charIndex : 0,
      text: trimmedText.slice(0, 80),
      timestamp: data.timestamp || Date.now()
    };

    chatHistory.push(message);
    if (chatHistory.length > MAX_HISTORY) chatHistory.shift();

    player.bubble = {
      text: message.text,
      expiresAt: Date.now() + 3000
    };

    // Broadcast only to other clients to prevent self-echo duplicate on sender
    socket.broadcast.emit('chat_message', message);
  });

  // 4. Disconnect
  socket.on('disconnect', () => {
    const playerId = socketToPlayerId.get(socket.id);
    socketToPlayerId.delete(socket.id);

    if (playerId) {
      dirtyPlayers.delete(playerId);
      const player = players.get(playerId);
      if (player) {
        players.delete(playerId);
        io.emit('player_left', { id: playerId });

        const leaveMsg = {
          id: 'sys_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          senderId: 'system',
          senderNickname: '시스템',
          characterId: 'system',
          text: `[${player.nickname}] 님이 회의실을 퇴장하셨습니다.`,
          timestamp: Date.now()
        };
        chatHistory.push(leaveMsg);
        io.emit('chat_message', leaveMsg);
        console.log(`[Socket] Player left: ${player.nickname} (${playerId})`);
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  const localIp = getLocalIpAddress();
  console.log(`🚀 DotRoom Server running on port ${PORT}`);
  console.log(`   - Local:   http://localhost:${PORT}`);
  console.log(`   - Network: http://${localIp}:${PORT}`);
});
