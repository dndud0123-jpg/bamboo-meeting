import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import LoginModal from './components/LoginModal';
import GameCanvas from './components/GameCanvas';
import MobileTopChatHud from './components/MobileTopChatHud';
import OverlayControls from './components/OverlayControls';
import MobileInputBar from './components/MobileInputBar';
import CharacterAvatar from './components/CharacterAvatar';
import ChatSidebar from './components/ChatSidebar';
import QRCodeModal from './components/QRCodeModal';
import BoardModal from './components/BoardModal';
import BoardSidebar from './components/BoardSidebar';
import PostCreateModal from './components/PostCreateModal';
import AdminAuthModal from './components/AdminAuthModal';
import UserListModal from './components/UserListModal';
import { Lock, Shield } from 'lucide-react';

export default function App() {
  const [joined, setJoined] = useState(false);
  const [myProfile, setMyProfile] = useState(null);
  
  // Stable unique ID for this client instance
  const [selfId] = useState(() => 'usr_' + Math.random().toString(36).substring(2, 9));
  
  // Players stored as Record<string, Player> to guarantee unique IDs
  const [players, setPlayers] = useState({});
  const [messages, setMessages] = useState([]);
  const [qrOpen, setQrOpen] = useState(false);
  const [isBoardOpen, setIsBoardOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [boardPosts, setBoardPosts] = useState([]);

  // Sidebar Mode ('chat' | 'board') for PC Desktop View
  const [sidebarMode, setSidebarMode] = useState('chat');
  const [joinUrl, setJoinUrl] = useState('');
  const [virtualDirection, setVirtualDirection] = useState(null);
  const [jumpSignal, setJumpSignal] = useState(0);
  const [remoteJumpTrigger, setRemoteJumpTrigger] = useState(null);

  // Master Admin & Moderation States
  const [isAdmin, setIsAdmin] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('isAdmin') === 'true';
    }
    return false;
  });
  const [adminAuthOpen, setAdminAuthOpen] = useState(false);
  const [userListOpen, setUserListOpen] = useState(false);
  const [isKicked, setIsKicked] = useState(false);
  const [kickReason, setKickReason] = useState('');

  // Responsive device viewport tracker
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);



  const socketRef = useRef(null);
  const channelRef = useRef(null);
  const myProfileRef = useRef(null);
  const hasJoinedRef = useRef(false);
  const latestLocalPosRef = useRef({ x: 610, y: 520, direction: 'down' });

  // Safe message adding function with duplicate ID prevention
  const addMessageSafely = useCallback((newMsg) => {
    if (!newMsg || !newMsg.text) return;
    setMessages((prev) => {
      if (prev.some((m) => m.id === newMsg.id)) return prev;
      return [...prev.slice(-99), newMsg];
    });

    if (newMsg.senderId && newMsg.senderId !== 'system') {
      setPlayers((prev) => {
        if (!prev[newMsg.senderId]) return prev;
        return {
          ...prev,
          [newMsg.senderId]: {
            ...prev[newMsg.senderId],
            bubble: {
              text: newMsg.text,
              expiresAt: Date.now() + 3000
            }
          }
        };
      });
    }
  }, []);

  const addMessageSafelyRef = useRef(addMessageSafely);
  useEffect(() => {
    addMessageSafelyRef.current = addMessageSafely;
  }, [addMessageSafely]);

  // Initialize BroadcastChannel & Socket.io
  useEffect(() => {
    // 1. Setup BroadcastChannel for Instant Multi-Tab Sync
    let channel = null;
    try {
      channel = new BroadcastChannel('dotroom_sync');
      channelRef.current = channel;

      channel.onmessage = (event) => {
        const { type, payload } = event.data;
        if (!type || !payload || payload.id === selfId) return; // Ignore own messages

        if (type === 'player_joined') {
          setPlayers(prev => ({
            ...prev,
            [payload.id]: payload
          }));

          // Send back our presence with latest actual coordinates
          if (myProfileRef.current) {
            channel.postMessage({
              type: 'player_presence',
              payload: {
                id: selfId,
                nickname: myProfileRef.current.nickname,
                charIndex: myProfileRef.current.charIndex ?? 0,
                x: latestLocalPosRef.current.x,
                y: latestLocalPosRef.current.y,
                direction: latestLocalPosRef.current.direction,
                isMoving: false
              }
            });
          }
        } else if (type === 'player_presence') {
          setPlayers(prev => ({
            ...prev,
            [payload.id]: payload
          }));
        } else if (type === 'player_moved') {
          setPlayers(prev => {
            if (!prev[payload.id]) return prev;
            return {
              ...prev,
              [payload.id]: {
                ...prev[payload.id],
                x: payload.x,
                y: payload.y,
                direction: payload.direction,
                isMoving: payload.isMoving
              }
            };
          });
        } else if (type === 'chat_message') {
          // Ignore own message echoes
          if (payload.senderId === selfId) return;
          addMessageSafelyRef.current(payload);
        } else if (type === 'player_left') {
          setPlayers(prev => {
            if (!prev[payload.id]) return prev;
            const next = { ...prev };
            delete next[payload.id];
            return next;
          });
        } else if (type === 'player_jump') {
          if (payload.id === selfId) return;
          setRemoteJumpTrigger({ id: payload.id, timestamp: Date.now() });
        } else if (type === 'board_post_created') {
          setBoardPosts(prev => {
            if (prev.some(p => p.id === payload.id)) return prev;
            return [payload, ...prev];
          });
        } else if (type === 'board_post_liked' || type === 'board_post_liked_updated') {
          if (payload.updatedPosts && Array.isArray(payload.updatedPosts)) {
            setBoardPosts(payload.updatedPosts);
          } else if (payload.postId) {
            setBoardPosts(prev => prev.map(p => {
              if (p.id === payload.postId) {
                return { ...p, likes: payload.likes, likedUsers: payload.likedUsers };
              }
              return p;
            }));
          }
        } else if (type === 'board_post_deleted') {
          setBoardPosts(prev => prev.filter(p => p.id !== payload.postId));
        } else if (type === 'chat_message_deleted') {
          setMessages(prev => prev.filter(m => m.id !== payload.messageId));
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel not supported:', e);
    }

    // 2. Setup Socket.io for Mobile & LAN Multi-device Sync
    const socket = io('/', {
      transports: ['websocket', 'polling']
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Socket] Connected');
      // If we already joined before connect/reconnect, re-emit join with actual coordinates
      if (myProfileRef.current) {
        socket.emit('join', {
          id: selfId,
          nickname: myProfileRef.current.nickname,
          charIndex: myProfileRef.current.charIndex ?? 0,
          x: latestLocalPosRef.current.x,
          y: latestLocalPosRef.current.y
        });
      }

      // Re-authenticate admin session on socket reconnect if previously authenticated
      const savedAdminPw = sessionStorage.getItem('adminPassword');
      if (savedAdminPw) {
        socket.emit('admin_login', { password: savedAdminPw }, (res) => {
          if (res && res.success) {
            setIsAdmin(true);
          }
        });
      }
    });

    socket.on('init_state', (data) => {
      if (data.players) {
        setPlayers(prev => {
          const next = { ...prev };
          data.players.forEach(p => {
            // Strictly exclude local player from remote overwrite
            if (p.id !== selfId) {
              next[p.id] = p;
            }
          });
          return next;
        });
      }
      if (data.chatHistory && data.chatHistory.length > 0) {
        setMessages(data.chatHistory);
      }
      if (data.boardPosts && Array.isArray(data.boardPosts)) {
        setBoardPosts(data.boardPosts);
      }
    });

    socket.on('player_joined', (p) => {
      if (p.id === selfId) return; // Prevent duplicating self
      setPlayers(prev => ({
        ...prev,
        [p.id]: p
      }));
    });

    socket.on('world_state_update', (batch) => {
      if (!batch || typeof batch !== 'object') return;
      setPlayers(prev => {
        let changed = false;
        let next = prev;
        for (const id in batch) {
          if (id === selfId) continue;
          if (prev[id]) {
            if (next === prev) next = { ...prev };
            const item = batch[id];
            next[id] = {
              ...next[id],
              x: item.x,
              y: item.y,
              direction: item.direction,
              isMoving: item.isMoving
            };
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    });

    socket.on('player_moved', (data) => {
      if (data.id === selfId) return;
      setPlayers(prev => {
        if (!prev[data.id]) return prev;
        return {
          ...prev,
          [data.id]: {
            ...prev[data.id],
            x: data.x,
            y: data.y,
            direction: data.direction,
            isMoving: data.isMoving
          }
        };
      });
    });

    socket.on('chat_message', (msg) => {
      // Ignore own message echoes
      if (msg.senderId === selfId) return;
      addMessageSafelyRef.current(msg);
    });

    socket.on('chat_message_deleted', ({ messageId }) => {
      setMessages(prev => prev.filter(m => m.id !== messageId));
    });

    socket.on('kicked_by_admin', (data) => {
      setIsKicked(true);
      setKickReason(data?.reason || '회의실 관리자에 의해 퇴장 조치되었습니다.');
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    });

    socket.on('post_created', (newPost) => {
      setBoardPosts(prev => {
        if (prev.some(p => p.id === newPost.id)) return prev;
        return [newPost, ...prev];
      });
    });

    socket.on('post_liked_updated', (data) => {
      if (data.updatedPosts && Array.isArray(data.updatedPosts)) {
        setBoardPosts(data.updatedPosts);
      } else if (data.postId) {
        setBoardPosts(prev => prev.map(p => {
          if (p.id === data.postId) {
            return { ...p, likes: data.likes, likedUsers: data.likedUsers };
          }
          return p;
        }));
      }
    });

    socket.on('post_liked', (data) => {
      setBoardPosts(prev => prev.map(p => {
        if (p.id === data.postId) {
          return { ...p, likes: data.likes, likedUsers: data.likedUsers };
        }
        return p;
      }));
    });

    socket.on('post_deleted', ({ postId }) => {
      setBoardPosts(prev => prev.filter(p => p.id !== postId));
    });

    socket.on('player_left', (data) => {
      setPlayers(prev => {
        if (!prev[data.id]) return prev;
        const next = { ...prev };
        delete next[data.id];
        return next;
      });
    });

    socket.on('player_jump', (data) => {
      if (data.id === selfId) return;
      setRemoteJumpTrigger({ id: data.id, timestamp: Date.now() });
    });

    // 3. Fetch Initial Cork Board Posts & LAN IP for Mobile QR code
    fetch('/api/board')
      .then(r => r.json())
      .then(posts => {
        if (Array.isArray(posts) && posts.length > 0) {
          setBoardPosts(posts);
        }
      })
      .catch(() => {});

    fetch('/api/info')
      .then(r => r.json())
      .then(info => {
        if (typeof window !== 'undefined' && window.location.origin) {
          // If deployed on public cloud (e.g. Render), always bind to current public origin!
          if (!window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')) {
            setJoinUrl(window.location.origin);
            return;
          }
        }
        if (info.localIp && info.localIp !== 'localhost' && !info.localIp.startsWith('10.')) {
          setJoinUrl(`http://${info.localIp}:${info.port || 3001}`);
        } else {
          setJoinUrl(window.location.origin);
        }
      })
      .catch(() => {
        setJoinUrl(window.location.origin);
      });

    // Clean up on tab close
    const handleUnload = () => {
      if (channelRef.current) {
        channelRef.current.postMessage({ type: 'player_left', payload: { id: selfId } });
      }
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      if (channelRef.current) {
        channelRef.current.close();
        channelRef.current = null;
      }
      if (socketRef.current) {
        socketRef.current.off('connect');
        socketRef.current.off('init_state');
        socketRef.current.off('player_joined');
        socketRef.current.off('player_moved');
        socketRef.current.off('world_state_update');
        socketRef.current.off('chat_message');
        socketRef.current.off('chat_message_deleted');
        socketRef.current.off('kicked_by_admin');
        socketRef.current.off('post_created');
        socketRef.current.off('post_liked');
        socketRef.current.off('post_liked_updated');
        socketRef.current.off('post_deleted');
        socketRef.current.off('player_left');
        socketRef.current.off('player_jump');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [selfId]);

  // Handler: Join Room (with server & local duplicate nickname verification)
  const handleJoin = ({ nickname, charIndex }, callback) => {
    const trimmed = (nickname || '').trim();

    // 1. Check local tabs duplicate via BroadcastChannel cached players
    const isLocalDuplicate = Object.values(players).some(
      (p) => p.id !== selfId && p.nickname && p.nickname.trim().toLowerCase() === trimmed.toLowerCase()
    );

    if (isLocalDuplicate) {
      if (typeof callback === 'function') {
        callback({ success: false, message: '이미 사용 중인 닉네임입니다. 다른 닉네임을 입력해 주세요.' });
      }
      return;
    }

    const completeJoin = () => {
      if (hasJoinedRef.current) return;
      hasJoinedRef.current = true;

      const profile = {
        nickname: trimmed,
        charIndex: typeof charIndex === 'number' ? charIndex : 0
      };
      setMyProfile(profile);
      myProfileRef.current = profile;
      setJoined(true);

      const initialPlayer = {
        id: selfId,
        nickname: profile.nickname,
        charIndex: profile.charIndex,
        x: 610,
        y: 520,
        direction: 'down',
        isMoving: false,
        bubble: null
      };

      // Store in keyed object
      setPlayers(prev => ({
        ...prev,
        [selfId]: initialPlayer
      }));

      // Broadcast to other tabs
      if (channelRef.current) {
        channelRef.current.postMessage({
          type: 'player_joined',
          payload: initialPlayer
        });
      }

      // Welcome message
      const welcomeMsg = {
        id: 'msg_welcome_' + selfId,
        senderId: 'system',
        senderNickname: '시스템',
        charIndex: profile.charIndex,
        text: `[${profile.nickname}] 님이 대나무숲 회의실에 입장하셨습니다!`,
        timestamp: Date.now()
      };
      addMessageSafely(welcomeMsg);
      if (channelRef.current) {
        channelRef.current.postMessage({ type: 'chat_message', payload: welcomeMsg });
      }
    };

    // 2. Emit to Socket.io server with verification callback
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('join', {
        id: selfId,
        nickname: trimmed,
        charIndex,
        x: 610,
        y: 520
      }, (response) => {
        if (response && !response.success) {
          if (typeof callback === 'function') {
            callback(response);
          }
          return;
        }

        completeJoin();
        if (typeof callback === 'function') {
          callback({ success: true, player: response?.player });
        }
      });
    } else {
      // Offline fallback
      completeJoin();
      if (typeof callback === 'function') {
        callback({ success: true });
      }
    }
  };

  // Handler: Player Move
  const handlePlayerMove = useCallback((moveData) => {
    latestLocalPosRef.current = {
      x: moveData.x,
      y: moveData.y,
      direction: moveData.direction
    };

    // 1. Broadcast to other tabs
    if (channelRef.current) {
      channelRef.current.postMessage({
        type: 'player_moved',
        payload: {
          id: selfId,
          ...moveData
        }
      });
    }

    // 2. Emit to Socket.io server
    if (socketRef.current) {
      socketRef.current.emit('player_move', moveData);
    }
  }, [selfId]);

  // Handler: Player Jump
  const handlePlayerJump = useCallback(() => {
    // 1. Broadcast to other tabs
    if (channelRef.current) {
      channelRef.current.postMessage({
        type: 'player_jump',
        payload: { id: selfId }
      });
    }

    // 2. Emit to Socket.io server
    if (socketRef.current) {
      socketRef.current.emit('player_jump');
    }
  }, [selfId]);

  // Handler: Send Message or Emoticon
  const handleSendMessage = (text) => {
    if (!text || !myProfileRef.current) return;

    const trimmed = text.trim();
    if (!trimmed) return;

    const msg = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9),
      senderId: selfId,
      senderNickname: myProfileRef.current.nickname,
      charIndex: myProfileRef.current.charIndex ?? 0,
      text: trimmed.slice(0, 70),
      timestamp: Date.now()
    };

    // 1. Add locally once (optimistic update & bubble)
    addMessageSafely(msg);

    // 2. BroadcastChannel sync to other local tabs
    if (channelRef.current) {
      channelRef.current.postMessage({
        type: 'chat_message',
        payload: msg
      });
    }

    // 3. Socket.io sync to server with consistent id
    if (socketRef.current) {
      socketRef.current.emit('chat_message', {
        id: msg.id,
        text: msg.text,
        timestamp: msg.timestamp
      });
    }
  };

  // Handler: Create Cork Board Post
  const handleCreatePost = ({ title, content, color }) => {
    if (!myProfileRef.current) return;
    const postPayload = {
      title,
      content,
      color,
      author: myProfileRef.current.nickname,
      authorId: selfId,
      avatarIndex: myProfileRef.current.charIndex ?? 0
    };

    if (socketRef.current) {
      socketRef.current.emit('create_post', postPayload);
    } else {
      // Local fallback
      const localPost = {
        id: 'post_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        ...postPayload,
        likes: 0,
        likedUsers: [],
        createdAt: Date.now()
      };
      setBoardPosts(prev => [localPost, ...prev]);
      if (channelRef.current) {
        channelRef.current.postMessage({ type: 'board_post_created', payload: localPost });
      }
    }
  };

  // Handler: Delete Cork Board Post (Author only)
  const handleDeletePost = (postId) => {
    // 1. Emit to Socket.io server
    if (socketRef.current) {
      socketRef.current.emit('delete_post', { postId, userId: selfId });
    }

    // 2. Optimistic local removal
    setBoardPosts(prev => prev.filter(p => p.id !== postId));

    // 3. Sync to other local tabs
    if (channelRef.current) {
      channelRef.current.postMessage({
        type: 'board_post_deleted',
        payload: { postId }
      });
    }
  };

  // Handler: Toggle Like Cork Board Post (+1 or Cancel -1)
  const handleLikePost = (postId) => {
    if (socketRef.current) {
      socketRef.current.emit('toggle_like_post', { postId, userId: selfId });
    }

    setBoardPosts(prev => {
      const updated = prev.map(p => {
        if (p.id === postId) {
          const likedUsers = Array.isArray(p.likedUsers) ? [...p.likedUsers] : [];
          const userIdx = likedUsers.indexOf(selfId);
          let newLikes = p.likes || 0;
          if (userIdx === -1) {
            likedUsers.push(selfId);
            newLikes += 1;
          } else {
            likedUsers.splice(userIdx, 1);
            newLikes = Math.max(0, newLikes - 1);
          }
          return {
            ...p,
            likes: newLikes,
            likedUsers
          };
        }
        return p;
      });

      if (channelRef.current) {
        channelRef.current.postMessage({
          type: 'board_post_liked_updated',
          payload: { updatedPosts: updated }
        });
      }

      return updated;
    });
  };

  // --- Admin Moderation Handlers ---
  const handleAdminLogin = (password, callback) => {
    if (socketRef.current) {
      socketRef.current.emit('admin_login', { password }, (response) => {
        if (response && response.success) {
          setIsAdmin(true);
          sessionStorage.setItem('isAdmin', 'true');
          sessionStorage.setItem('adminPassword', password);
        }
        if (typeof callback === 'function') callback(response);
      });
    } else {
      if (typeof callback === 'function') callback({ success: false, message: '서버와 연결되어 있지 않습니다.' });
    }
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    sessionStorage.removeItem('isAdmin');
    sessionStorage.removeItem('adminPassword');
  };

  const handleAdminDeletePost = (postId) => {
    if (socketRef.current) {
      socketRef.current.emit('admin_delete_post', { postId });
    }
    setBoardPosts(prev => prev.filter(p => p.id !== postId));
    if (channelRef.current) {
      channelRef.current.postMessage({ type: 'board_post_deleted', payload: { postId } });
    }
  };

  const handleAdminDeleteChat = (messageId) => {
    if (socketRef.current) {
      socketRef.current.emit('admin_delete_chat', { messageId });
    }
    setMessages(prev => prev.filter(m => m.id !== messageId));
    if (channelRef.current) {
      channelRef.current.postMessage({ type: 'chat_message_deleted', payload: { messageId } });
    }
  };

  const handleAdminKickUser = (player) => {
    if (!player) return;
    if (socketRef.current) {
      socketRef.current.emit('admin_kick_user', {
        targetSocketId: player.socketId || player.id,
        targetPlayerId: player.id
      });
    }
  };

  // Handler: Open Cork Board (PC: switch right sidebar, Mobile: open modal)
  const handleOpenBoard = () => {
    if (isDesktop) {
      setSidebarMode(prev => (prev === 'board' ? 'chat' : 'board'));
    } else {
      setIsBoardOpen(true);
    }
  };

  const isModalActive = !joined || qrOpen || (isBoardOpen && !isDesktop) || isCreateOpen || adminAuthOpen || userListOpen || isKicked;

  return (
    <div className="w-screen h-[100dvh] overflow-hidden bg-slate-950 select-none">
      {/* 1. Login Modal */}
      {!joined && <LoginModal onJoin={handleJoin} />}

      {/* 2. QR Code Modal */}
      <QRCodeModal
        isOpen={qrOpen}
        onClose={() => setQrOpen(false)}
        joinUrl={joinUrl}
      />

      {/* 3. Main Responsive Game View */}
      {isDesktop ? (
        /* PC Desktop Layout: Left Full-Height 2D Canvas + Right Fixed Chat Sidebar */
        <div className="flex flex-row w-full h-full overflow-hidden bg-slate-950 select-none">
          {/* Left Canvas View */}
          <div className="relative flex-1 h-full min-h-0 overflow-hidden bg-[#0a0d14]">
            <div className="absolute inset-0 w-full h-full z-0">
              <GameCanvas
                selfId={selfId}
                players={players}
                myProfile={myProfile}
                onPlayerMove={handlePlayerMove}
                onPlayerJump={handlePlayerJump}
                virtualDirection={virtualDirection}
                jumpSignal={jumpSignal}
                remoteJumpTrigger={remoteJumpTrigger}
                onOpenBoard={handleOpenBoard}
                isModalOpen={isModalActive}
              />
            </div>

            {/* Desktop Top-left Status Badge */}
            <div className="absolute top-3 left-3 z-20 pointer-events-auto flex items-center gap-2">
              <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-2 text-xs text-white">
                <span className="font-pixel text-yellow-400 font-bold tracking-wider text-sm whitespace-nowrap">
                  🎋 놀러와요, 대나무숲
                </span>
                <span className="text-slate-600">|</span>
                <span className="text-slate-300 font-sans">익명 소통 회의실</span>
                {myProfile && (
                  <div className="flex items-center gap-1.5 bg-[#242744] px-2 py-0.5 rounded border border-amber-500/30">
                    <CharacterAvatar charIndex={myProfile.charIndex} size="xs" />
                    <span className="text-amber-300 font-bold text-[11px] truncate max-w-[120px]">
                      {myProfile.nickname}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-xs border border-slate-800 px-2.5 py-1 rounded-xl text-[11px] text-slate-400 font-mono">
                <span>🎮 [방향키/WASD] 이동</span>
                <span className="text-slate-600">•</span>
                <span>[Space] 점프 / 게시판</span>
              </div>
            </div>

            {/* Desktop Top-right Notice Board & Admin Buttons */}
            <div className="absolute top-3 right-3 z-20 pointer-events-auto flex items-center gap-2">
              <button
                type="button"
                onClick={handleOpenBoard}
                className={`flex items-center gap-1.5 text-xs font-pixel font-bold px-3.5 py-1.5 rounded-xl border cursor-pointer shadow-lg transition-all active:scale-95 ${
                  sidebarMode === 'board'
                    ? 'bg-amber-400 text-slate-950 border-amber-200 ring-2 ring-amber-400/50'
                    : 'bg-[#3d220f]/90 hover:bg-[#53341b] text-[#fef08a] border-[#b45309]/80'
                }`}
                aria-label="비밀 게시판 열기"
              >
                <span className="text-sm">📜</span>
                <span className="tracking-wide">비밀 게시판</span>
              </button>

              <button
                type="button"
                onClick={() => setAdminAuthOpen(true)}
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border shadow-lg cursor-pointer transition-all active:scale-95 ${
                  isAdmin
                    ? 'bg-rose-950/80 hover:bg-rose-900 border-rose-500/60 text-rose-300'
                    : 'bg-slate-900/80 hover:bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
                title={isAdmin ? '마스터 관리자 모드 (클릭하여 관리)' : '마스터 관리자 로그인'}
              >
                {isAdmin ? (
                  <>
                    <Shield size={13} className="text-amber-400" />
                    <span className="font-pixel text-yellow-300">관리자 모드</span>
                  </>
                ) : (
                  <>
                    <Lock size={13} />
                    <span className="font-sans">관리자</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Desktop Right Panel: ChatSidebar or BoardSidebar */}
          <div className="h-full w-80 md:w-96 shrink-0 z-20">
            {sidebarMode === 'board' ? (
              <BoardSidebar
                posts={boardPosts}
                onLike={handleLikePost}
                onDelete={handleDeletePost}
                onAdminDelete={handleAdminDeletePost}
                onOpenCreate={() => setIsCreateOpen(true)}
                currentUserId={selfId}
                isAdmin={isAdmin}
                onBackToChat={() => setSidebarMode('chat')}
              />
            ) : (
              <ChatSidebar
                messages={messages}
                onSendMessage={handleSendMessage}
                onSendReaction={handleSendMessage}
                onlineCount={Object.keys(players).length}
                onOpenQR={() => setQrOpen(true)}
                onOpenUserList={() => setUserListOpen(true)}
                onSwitchToBoard={() => setSidebarMode('board')}
                isAdmin={isAdmin}
                onAdminDeleteChat={handleAdminDeleteChat}
              />
            )}
          </div>
        </div>
      ) : (
        /* Mobile Smartphone Layout: 100% Fullscreen Canvas, Fixed Inset to prevent Keyboard Push */
        <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none bg-[#0a0d14]">
          {/* 1. 배경 전체 캔버스 (화면 100% 바닥 끝까지 꽉 채움) */}
          <div className="absolute inset-0 w-full h-full z-0">
            <GameCanvas
              selfId={selfId}
              players={players}
              myProfile={myProfile}
              onPlayerMove={handlePlayerMove}
              onPlayerJump={handlePlayerJump}
              virtualDirection={virtualDirection}
              jumpSignal={jumpSignal}
              remoteJumpTrigger={remoteJumpTrigger}
              onOpenBoard={() => setIsBoardOpen(true)}
              isModalOpen={isModalActive}
            />
          </div>

          {/* 2. 상단 통합 채팅 영역 (헤더 + 상단 고정 입력창 + 대화 피드) */}
          <div className="absolute top-0 left-0 right-0 z-20 pointer-events-auto">
            <MobileTopChatHud
              messages={messages}
              onlineCount={Object.keys(players).length}
              myProfile={myProfile}
              onOpenBoard={() => setIsBoardOpen(true)}
              onOpenQR={() => setQrOpen(true)}
              onOpenUserList={() => setUserListOpen(true)}
              onOpenAdminAuth={() => setAdminAuthOpen(true)}
              isAdmin={isAdmin}
              onAdminDeleteChat={handleAdminDeleteChat}
            >
              {/* 상단 헤더 바로 아래 고정 입력창 */}
              <div className="my-1 px-0.5">
                <MobileInputBar
                  onSendMessage={handleSendMessage}
                  onSendReaction={handleSendMessage}
                />
              </div>
            </MobileTopChatHud>
          </div>

          {/* 3. 하단 좌/우 조작 컨트롤러 (D-Pad 좌측, 점프/이모지 우측) */}
          <OverlayControls
            onDirectionChange={setVirtualDirection}
            onTriggerJump={() => setJumpSignal(s => s + 1)}
            onSendReaction={handleSendMessage}
          />
        </div>
      )}

      {/* 5. Cork Board Modal (Interactive Notice Board - Mobile Viewport) */}
      {!isDesktop && isBoardOpen && (
        <BoardModal
          isOpen={isBoardOpen}
          onClose={() => setIsBoardOpen(false)}
          posts={boardPosts}
          onLike={handleLikePost}
          onDelete={handleDeletePost}
          onAdminDelete={handleAdminDeletePost}
          onOpenCreate={() => setIsCreateOpen(true)}
          currentUserId={selfId}
          isAdmin={isAdmin}
        />
      )}

      {/* 6. Post Create Modal */}
      {isCreateOpen && (
        <PostCreateModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onSubmit={handleCreatePost}
          myProfile={myProfile}
        />
      )}

      {/* 7. Admin Auth Modal */}
      <AdminAuthModal
        isOpen={adminAuthOpen}
        onClose={() => setAdminAuthOpen(false)}
        isAdmin={isAdmin}
        onLogin={handleAdminLogin}
        onLogout={handleAdminLogout}
      />

      {/* 8. User List & Kick Modal */}
      <UserListModal
        isOpen={userListOpen}
        onClose={() => setUserListOpen(false)}
        players={players}
        selfId={selfId}
        isAdmin={isAdmin}
        onKickUser={handleAdminKickUser}
      />

      {/* 9. Kicked By Admin Full-screen Warning Screen */}
      {isKicked && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 text-white p-6 text-center select-none backdrop-blur-md">
          <div className="text-5xl sm:text-6xl mb-4 animate-bounce">⚠️</div>
          <h1 className="font-pixel text-xl sm:text-2xl text-rose-500 font-bold mb-2">
            회의실에서 퇴장되었습니다
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-md font-sans mb-5 leading-relaxed">
            {kickReason || '회의실 관리자에 의해 퇴장 조치되었습니다.'}
          </p>
          <div className="bg-rose-950/60 border border-rose-500/50 rounded-xl px-4 py-2 text-xs text-rose-300 font-mono">
            재접속할 수 없습니다. 브라우저 창을 닫아주세요.
          </div>
        </div>
      )}
    </div>
  );
}
