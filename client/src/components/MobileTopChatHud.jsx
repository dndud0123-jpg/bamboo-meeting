import React, { useEffect, useRef } from 'react';
import CharacterAvatar from './CharacterAvatar';
import { Users, QrCode } from 'lucide-react';

export default function MobileTopChatHud({
  messages = [],
  onlineCount = 1,
  myProfile,
  onOpenBoard,
  onOpenQR
}) {
  const feedEndRef = useRef(null);

  // Auto-scroll to latest message in the HUD
  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Display recent 15 messages so user can scroll back slightly or see newest 3~4
  const recentMessages = messages.slice(-15);

  return (
    <div
      className="md:hidden absolute top-0 left-0 right-0 h-[22%] min-h-[120px] max-h-[170px] z-20 pointer-events-auto bg-slate-950/45 backdrop-blur-sm border-b border-white/10 px-3 py-1.5 flex flex-col justify-between select-none"
      style={{ touchAction: 'pan-y' }}
    >
      {/* 1. Compact Header Row: Title + Status + Action Buttons */}
      <div className="flex items-center justify-between gap-1.5 shrink-0 pb-1 border-b border-white/10">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-pixel text-yellow-300 font-bold text-xs tracking-wider whitespace-nowrap drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            🎋 대나무숲
          </span>
          {myProfile && (
            <div className="flex items-center gap-1 bg-slate-900/60 px-1.5 py-0.5 rounded-md border border-amber-500/30">
              <CharacterAvatar charIndex={myProfile.charIndex ?? 0} size="xs" />
              <span className="text-amber-200 font-bold text-[10px] truncate max-w-[65px]">
                {myProfile.nickname}
              </span>
            </div>
          )}
          <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-0.5 bg-slate-900/50 px-1 py-0.5 rounded border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{onlineCount}명</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onOpenBoard && (
            <button
              type="button"
              onClick={onOpenBoard}
              className="flex items-center gap-1 text-[11px] font-pixel font-bold bg-[#422510]/85 hover:bg-[#53341b] active:scale-95 text-amber-200 px-2 py-0.5 rounded-lg border border-amber-600/60 shadow-md cursor-pointer transition-transform"
              aria-label="비밀 게시판"
            >
              <span>📜</span>
              <span>게시판</span>
            </button>
          )}

          {onOpenQR && (
            <button
              type="button"
              onClick={onOpenQR}
              className="flex items-center gap-1 text-[10px] font-bold bg-slate-900/80 hover:bg-slate-800 active:scale-95 text-yellow-300 px-1.5 py-0.5 rounded-lg border border-yellow-500/40 shadow-md cursor-pointer"
              aria-label="QR 초대"
            >
              <QrCode size={11} />
              <span>QR</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Chat Feed Overlay (Transparent, newest 3~4 visible at bottom) */}
      <div className="flex-1 overflow-y-auto space-y-1 pt-1 pr-0.5 scrollbar-none flex flex-col justify-start">
        {recentMessages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[11px] text-slate-300/80 font-sans italic drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            대나무숲에 오신 것을 환영합니다! 아래에서 대화를 시작해보세요.
          </div>
        ) : (
          recentMessages.map((msg, idx) => {
            const isSystem = msg.senderId === 'system';
            const uniqueKey = msg.id || `hud_msg_${idx}`;

            if (isSystem) {
              return (
                <div
                  key={uniqueKey}
                  className="text-center text-[10px] text-amber-300/90 font-sans drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] py-0.5"
                >
                  📢 {msg.text}
                </div>
              );
            }

            const isReaction = ['👍', '❤️', '😭'].includes(msg.text);

            return (
              <div
                key={uniqueKey}
                className="flex items-baseline gap-1.5 text-xs leading-snug drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
              >
                <div className="flex items-center gap-1 shrink-0">
                  <CharacterAvatar charIndex={msg.charIndex ?? 0} size="xs" />
                  <span className="font-bold text-[11px] text-amber-300">
                    {msg.senderNickname}:
                  </span>
                </div>
                {isReaction ? (
                  <span className="text-sm animate-bounce inline-block">{msg.text}</span>
                ) : (
                  <span className="text-slate-100 font-sans break-words text-xs">
                    {msg.text}
                  </span>
                )}
              </div>
            );
          })
        )}
        <div ref={feedEndRef} />
      </div>
    </div>
  );
}
