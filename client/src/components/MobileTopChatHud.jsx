import React, { useEffect, useRef } from 'react';
import CharacterAvatar from './CharacterAvatar';
import { Users, QrCode, Trash2, Shield, Lock } from 'lucide-react';

export default function MobileTopChatHud({
  messages = [],
  onlineCount = 1,
  myProfile,
  onOpenBoard,
  onOpenQR,
  onOpenUserList,
  onOpenAdminAuth,
  isAdmin = false,
  onAdminDeleteChat
}) {
  const feedEndRef = useRef(null);

  // Auto-scroll to latest message in the HUD
  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Display recent 25 messages so user can scroll back slightly or see newest 5~7
  const recentMessages = messages.slice(-25);

  return (
    <div
      className="w-full h-full pointer-events-auto bg-gradient-to-b from-slate-950/90 via-slate-950/65 to-transparent backdrop-blur-xs border-b border-white/10 px-3 py-2 flex flex-col justify-between select-none"
      style={{ touchAction: 'pan-y' }}
    >
      {/* 1. Compact Header Row: Title + Status + Action Buttons */}
      <div className="flex items-center justify-between gap-1.5 shrink-0 pb-1.5 border-b border-white/10">
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
          <button
            type="button"
            onClick={onOpenUserList}
            className="text-[10px] text-emerald-400 font-mono flex items-center gap-0.5 bg-slate-900/60 hover:bg-slate-800 px-1.5 py-0.5 rounded border border-emerald-500/30 cursor-pointer active:scale-95"
            title="참여자 목록"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{onlineCount}명</span>
          </button>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {onOpenAdminAuth && (
            <button
              type="button"
              onClick={onOpenAdminAuth}
              className={`flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-lg border shadow-md cursor-pointer transition-all active:scale-95 ${
                isAdmin
                  ? 'bg-rose-950/80 text-rose-300 border-rose-500/50'
                  : 'bg-slate-900/80 text-slate-400 border-slate-700/60'
              }`}
              title={isAdmin ? '관리자 모드 활성' : '관리자 로그인'}
            >
              {isAdmin ? <Shield size={11} className="text-amber-400" /> : <Lock size={11} />}
            </button>
          )}
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

      {/* 2. Expanded Chat Feed Overlay (Height doubled to ~38%, shows 5~7 messages with great readability) */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pt-1.5 pr-0.5 scrollbar-none flex flex-col justify-start min-h-0">
        {recentMessages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[11px] sm:text-xs text-slate-300/80 font-sans italic drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
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
                  className="text-center text-[10px] sm:text-[11px] text-amber-300/90 font-sans drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] py-0.5"
                >
                  📢 {msg.text}
                </div>
              );
            }

            const isReaction = ['👍', '❤️', '😭'].includes(msg.text);

            return (
              <div
                key={uniqueKey}
                className="flex items-baseline justify-between gap-1.5 text-xs sm:text-sm leading-snug drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
              >
                <div className="flex items-baseline gap-1.5 min-w-0">
                  <div className="flex items-center gap-1 shrink-0">
                    <CharacterAvatar charIndex={msg.charIndex ?? 0} size="xs" />
                    <span className="font-bold text-[11px] sm:text-xs text-amber-300">
                      {msg.senderNickname}:
                    </span>
                  </div>
                  {isReaction ? (
                    <span className="text-sm sm:text-base animate-bounce inline-block">{msg.text}</span>
                  ) : (
                    <span className="text-slate-100 font-sans break-words text-xs sm:text-sm">
                      {msg.text}
                    </span>
                  )}
                </div>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`[관리자] [${msg.senderNickname}] 님의 메시지를 삭제하시겠습니까?\n"${msg.text}"`)) {
                        if (onAdminDeleteChat) onAdminDeleteChat(msg.id);
                      }
                    }}
                    className="p-0.5 text-rose-400/80 hover:text-rose-300 active:scale-90 shrink-0 cursor-pointer"
                    title="관리자 삭제"
                  >
                    <Trash2 size={11} />
                  </button>
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
