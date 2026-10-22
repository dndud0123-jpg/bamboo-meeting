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
import PostCreateModal from './components/PostCreateModal';

export default function App() {
  const [joined, setJoined] = useState(false);
  const [myProfile, setMyProfile] = useState(null);
  
  // Stable unique ID for this client instance
  const [selfId] = useState(() => 'usr_' + Math.random().toString(36).substring(2, 9));
  
  // Players stored as Record<string, Player> to guarantee unique IDs
  const [players, setPlayers] = useState({});
  const [messages, setMessages] = useState([]);
  const [qrOpen, setQrOpen] = useState(false);
  const [joinUrl, setJoinUrl] = useState('');
  const [virtualDirection, setVirtualDirection] = useState(null);
  const [jumpSignal, setJumpSignal] = useState(0);
  const [remoteJumpTrigger, setRemoteJumpTrigger] = useState(null);

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

  // Cork Notice Board state (Starts completely clean with 0 posts)
  const [boardPosts, setBoardPosts] = useState([]);
  const [isBoardOpen, setIsBoardOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

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
        if (info.localIp && info.localIp !== 'localhost') {
          setJoinUrl(`http://${info.localIp}:${info.port || 5173}`);
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

  // Handler: Join Room (protected with hasJoinedRef against StrictMode double calls)
  const handleJoin = ({ nickname, charIndex }) => {
    if (hasJoinedRef.current) return;
    hasJoinedRef.current = true;

    const profile = {
      nickname,
      charIndex: typeof charIndex === 'number' ? charIndex : 0
    };
    setMyProfile(profile);
    myProfileRef.current = profile;
    setJoined(true);

    const initialPlayer = {
      id: selfId,
      nickname,
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

    // Emit to Socket.io server with consistent selfId
    if (socketRef.current) {
      socketRef.current.emit('join', {
        id: selfId,
        nickname,
        charIndex: profile.charIndex,
        x: 610,
        y: 520
      });
    }

    // Welcome message
    const welcomeMsg = {
      id: 'msg_welcome_' + selfId,
      senderId: 'system',
      senderNickname: '시스템',
      charIndex: profile.charIndex,
      text: `[${nickname}] 님이 대나무숲 회의실에 입장하셨습니다!`,
      timestamp: Date.now()
    };
    addMessageSafely(welcomeMsg);
    if (channelRef.current) {
      channelRef.current.postMessage({ type: 'chat_message', payload: welcomeMsg });
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

  const isModalActive = !joined || qrOpen || isBoardOpen || isCreateOpen;

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
                onOpenBoard={() => setIsBoardOpen(true)}
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

            {/* Desktop Top-right Notice Board Button */}
            <div className="absolute top-3 right-3 z-20 pointer-events-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsBoardOpen(true)}
                className="flex items-center gap-1.5 text-xs font-pixel font-bold bg-[#3d220f]/90 hover:bg-[#53341b] active:scale-95 text-[#fef08a] px-3.5 py-1.5 rounded-xl border border-[#b45309]/80 cursor-pointer shadow-lg transition-all"
                aria-label="비밀 게시판 열기"
              >
                <span className="text-sm">📜</span>
                <span className="tracking-wide">비밀 게시판</span>
              </button>
            </div>
          </div>

          {/* Desktop Right Chat Sidebar */}
          <div className="h-full w-80 md:w-96 shrink-0 z-20">
            <ChatSidebar
              messages={messages}
              onSendMessage={handleSendMessage}
              onSendReaction={handleSendMessage}
              onlineCount={Object.keys(players).length}
              onOpenQR={() => setQrOpen(true)}
            />
          </div>
        </div>
      ) : (
        /* Mobile Smartphone Layout: 100% Fullscreen Canvas, No Flex-Col, Zero Bottom Gap */
        <div className="relative w-full h-full overflow-hidden select-none bg-[#0a0d14]">
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

          {/* 2. 상단 20% 반투명 플로팅 채팅창 */}
          <div className="absolute top-0 left-0 right-0 h-[20%] min-h-[110px] max-h-[160px] z-20 pointer-events-auto">
            <MobileTopChatHud
              messages={messages}
              onlineCount={Object.keys(players).length}
              myProfile={myProfile}
              onOpenBoard={() => setIsBoardOpen(true)}
              onOpenQR={() => setQrOpen(true)}
            />
          </div>

          {/* 3. 하단 좌/우 조작 컨트롤러 (D-Pad 좌측, 점프/이모지 우측) */}
          <OverlayControls
            onDirectionChange={setVirtualDirection}
            onTriggerJump={() => setJumpSignal(s => s + 1)}
            onSendReaction={handleSendMessage}
          />

          {/* 4. 최하단 반투명 플로팅 입력바 (바닥에 슬림하게 밀착) */}
          <div className="absolute bottom-3 left-3 right-3 z-30 pb-[env(safe-area-inset-bottom)] pointer-events-auto">
            <MobileInputBar
              onSendMessage={handleSendMessage}
              onSendReaction={handleSendMessage}
            />
          </div>
        </div>
      )}

      {/* 5. Cork Board Modal (Interactive Notice Board) */}
      {isBoardOpen && (
        <BoardModal
          isOpen={isBoardOpen}
          onClose={() => setIsBoardOpen(false)}
          posts={boardPosts}
          onLike={handleLikePost}
          onDelete={handleDeletePost}
          onOpenCreate={() => setIsCreateOpen(true)}
          currentUserId={selfId}
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
    </div>
  );
}
