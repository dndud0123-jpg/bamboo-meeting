const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const os = require('os');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

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

// In-memory Cork Notice Board Posts
const boardPosts = [
  {
    id: 'post_seed_1',
    author: '대나무숲 운영자',
    avatarIndex: 0,
    title: '🎋 대나무숲 비밀 게시판 오픈!',
    content: '익명으로 자유롭게 하고 싶은 이야기나 건의사항을 남겨보세요. 공감되는 글에는 하트(❤️)를 눌러주세요!',
    likes: 12,
    likedUsers: [],
    color: 'yellow',
    createdAt: Date.now() - 3600000 * 2
  },
  {
    id: 'post_seed_2',
    author: '야근요정',
    avatarIndex: 4,
    title: '오늘 저녁 메뉴 추천받습니다 🍜',
    content: '마을 상점 쪽에 새로 생긴 라멘집 괜찮나요? 맛있는 집 아시는 분 댓글이나 하트 남겨주세요 ㅎㅎ',
    likes: 7,
    likedUsers: [],
    color: 'pink',
    createdAt: Date.now() - 3600000
  },
  {
    id: 'post_seed_3',
    author: '신입시바',
    avatarIndex: 2,
    title: '도트 마을 공기 너무 맑네요 🐾',
    content: '마을 분수대랑 집들이 너무 아기자기해서 산책만 해도 힐링돼요! 다들 오늘도 파이팅입니다!',
    likes: 15,
    likedUsers: [],
    color: 'mint',
    createdAt: Date.now() - 1800000
  }
];

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
    port: PORT,
    onlineCount: players.size
  });
});

app.get('/api/chat', (req, res) => {
  res.json(chatHistory);
});

app.get('/api/board', (req, res) => {
  res.json(boardPosts);
});

// Single-Origin Frontend Hosting: Serve built React static assets
const clientDistPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientDistPath));

// SPA Fallback: Serve index.html for all non-API routes (Express 4 & 5 compatible)
app.use((req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
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
      chatHistory: chatHistory.slice(-50),
      boardPosts: boardPosts
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

  // 5. Create Cork Board Post
  socket.on('create_post', (data) => {
    const playerId = socketToPlayerId.get(socket.id) || socket.id;
    const player = players.get(playerId);
    const author = player ? player.nickname : (data.author || '익명 주민');
    const avatarIndex = player ? player.charIndex : (typeof data.avatarIndex === 'number' ? data.avatarIndex : 0);

    const title = (data.title || '').trim().slice(0, 30);
    const content = (data.content || '').trim().slice(0, 200);
    if (!title || !content) return;

    const newPost = {
      id: 'post_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      author,
      authorId: data.authorId || playerId,
      avatarIndex,
      title,
      content,
      likes: 0,
      likedUsers: [],
      color: data.color || 'yellow',
      createdAt: Date.now()
    };

    boardPosts.unshift(newPost);
    io.emit('post_created', newPost);
  });

  // 6. Toggle Like Cork Board Post (Add +1 or Cancel -1)
  const handleToggleLike = ({ postId, userId }) => {
    const post = boardPosts.find((p) => p.id === postId);
    if (!post) return;

    if (!post.likedUsers) {
      post.likedUsers = [];
    }

    const uId = userId || socketToPlayerId.get(socket.id) || socket.id;
    const userIndex = post.likedUsers.indexOf(uId);
    let isLikedNow = false;

    if (userIndex === -1) {
      // 좋아요 추가
      post.likedUsers.push(uId);
      post.likes = (post.likes || 0) + 1;
      isLikedNow = true;
    } else {
      // 좋아요 취소
      post.likedUsers.splice(userIndex, 1);
      post.likes = Math.max(0, (post.likes || 1) - 1);
      isLikedNow = false;
    }

    // 전체 클라이언트에 업데이트된 포스트 및 랭킹 브로드캐스트
    io.emit('post_liked_updated', {
      postId,
      likes: post.likes,
      likedUsers: post.likedUsers,
      isLikedNow,
      updatedPosts: boardPosts.sort((a, b) => (b.likes || 0) - (a.likes || 0))
    });
    // 호환성을 위한 기존 이벤트 발송
    io.emit('post_liked', {
      postId: post.id,
      likes: post.likes,
      likedUsers: post.likedUsers
    });
  };

  socket.on('toggle_like_post', handleToggleLike);
  socket.on('like_post', handleToggleLike);

  // 7. Delete Cork Board Post (Author only)
  socket.on('delete_post', ({ postId, userId }) => {
    const postIndex = boardPosts.findIndex((p) => p.id === postId);
    if (postIndex === -1) return;

    const uId = userId || socketToPlayerId.get(socket.id) || socket.id;
    // 본인이 작성한 글인지 검증
    if (boardPosts[postIndex].authorId === uId) {
      boardPosts.splice(postIndex, 1);
      io.emit('post_deleted', { postId });
    }
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

server.listen(PORT, '0.0.0.0', () => {
  const localIp = getLocalIpAddress();
  console.log(`🚀 DotRoom Server running on port ${PORT}`);
  console.log(`   - Local:   http://localhost:${PORT}`);
  console.log(`   - Network: http://${localIp}:${PORT}`);
});
