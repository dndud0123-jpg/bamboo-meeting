import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import LoginModal from './components/LoginModal';
import TopGameView from './components/TopGameView';
import BottomChatInput from './components/BottomChatInput';
import ChatSidebar from './components/ChatSidebar';
import QRCodeModal from './components/QRCodeModal';

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

    // 3. Fetch LAN IP for Mobile QR code
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

  return (
    <div className="w-screen h-[100dvh] flex flex-col md:flex-row overflow-hidden bg-slate-950 select-none">
      {/* 1. Login Modal */}
      {!joined && <LoginModal onJoin={handleJoin} />}

      {/* 2. QR Code Modal */}
      <QRCodeModal
        isOpen={qrOpen}
        onClose={() => setQrOpen(false)}
        joinUrl={joinUrl}
      />

      {/* 3. Main Game View:
             - Mobile (< md): Fixed top 50% height with overlay controls
             - PC (>= md): Full-height flex-1 canvas with clean controls */}
      <TopGameView
        selfId={selfId}
        players={players}
        myProfile={myProfile}
        onPlayerMove={handlePlayerMove}
        onPlayerJump={handlePlayerJump}
        virtualDirection={virtualDirection}
        jumpSignal={jumpSignal}
        remoteJumpTrigger={remoteJumpTrigger}
        onDirectionChange={setVirtualDirection}
        onTriggerJump={() => setJumpSignal(s => s + 1)}
        onSendReaction={handleSendMessage}
        onOpenQR={() => setQrOpen(true)}
      />

      {/* 4. Desktop Right Area (md: and above): Full-Height Real-time Chat Sidebar */}
      <div className="hidden md:flex h-full w-80 md:w-96 shrink-0 z-20">
        <ChatSidebar
          messages={messages}
          onSendMessage={handleSendMessage}
          onSendReaction={handleSendMessage}
          onlineCount={Object.keys(players).length}
          onOpenQR={() => setQrOpen(true)}
        />
      </div>

      {/* 5. Mobile Bottom Area (< md): 50% Chat Feed & Immediate Text Input Panel */}
      <div className="flex md:hidden flex-1 min-h-0 w-full z-20">
        <BottomChatInput
          messages={messages}
          onSendMessage={handleSendMessage}
          onSendReaction={handleSendMessage}
          onlineCount={Object.keys(players).length}
          myProfile={myProfile}
        />
      </div>
    </div>
  );
}
