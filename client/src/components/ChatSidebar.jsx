import React, { useState, useEffect, useRef } from 'react';
import CharacterAvatar from './CharacterAvatar';
import { QrCode, Send, Users, MessageSquare, Trash2 } from 'lucide-react';

export default function ChatSidebar({
  messages,
  onSendMessage,
  onSendReaction,
  onlineCount,
  onOpenQR,
  onOpenUserList,
  isAdmin = false,
  onAdminDeleteChat
}) {
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed) return;
    onSendMessage(trimmed);
    setInputText('');
  };

  const formatTime = (ts) => {
    const d = new Date(ts);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  return (
    <aside className="w-80 md:w-96 h-full flex flex-col bg-slate-900/95 border-l border-slate-800 text-slate-100 select-text shrink-0 z-20">
      {/* 1. Header */}
      <div className="p-3.5 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md flex items-center justify-between select-none">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-8 h-8 bg-indigo-600/25 border border-indigo-400/50 rounded-lg flex items-center justify-center text-indigo-300 font-bold text-sm">
              💬
            </div>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border-2 border-slate-900 rounded-full animate-pulse" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
              실시간 회의 피드
            </h2>
            <button
              type="button"
              onClick={onOpenUserList}
              className="text-[10px] text-emerald-400 hover:text-emerald-300 font-mono flex items-center gap-1 mt-0.5 cursor-pointer hover:underline transition-colors"
              title="참여자 목록 보기"
            >
              <Users size={11} />
              <span>접속 {onlineCount}명 참여중</span>
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenQR}
          className="flex items-center gap-1 text-[11px] font-bold bg-[#252844] hover:bg-[#343861] active:scale-95 text-yellow-300 px-2.5 py-1.5 rounded-lg border border-yellow-500/40 cursor-pointer shadow-sm transition-all"
        >
          <QrCode size={13} />
          <span>QR 초대</span>
        </button>
      </div>

      {/* 2. Chat Message List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 text-xs select-text">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center p-4">
            <MessageSquare size={32} className="mb-2 opacity-30 text-slate-400" />
            <p className="text-xs font-sans">아직 등록된 의견이 없습니다.</p>
            <p className="text-[11px] text-slate-600 mt-1 font-sans">
              아래 입력창이나 이모지로 회의에 참여해보세요!
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isSystem = msg.senderId === 'system';
            const uniqueKey = msg.id ? `${msg.id}_${index}` : `msg_${index}`;
            if (isSystem) {
              return (
                <div
                  key={uniqueKey}
                  className="text-center my-1.5 py-1 px-2.5 bg-slate-800/50 border border-slate-700/60 rounded-md text-[10px] text-slate-400 font-sans"
                >
                  {msg.text}
                </div>
              );
            }

            const isReaction = ['👍', '❤️', '😭'].includes(msg.text);

            return (
              <div
                key={uniqueKey}
                className="flex items-start gap-2.5 p-2 bg-slate-800/40 hover:bg-slate-800/70 rounded-lg border border-slate-700/50 transition-colors"
              >
                <CharacterAvatar
                  charIndex={msg.charIndex ?? 0}
                  size="sm"
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-bold text-[11px] text-yellow-300 truncate">
                      {msg.senderNickname}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] text-slate-500 font-mono">
                        {formatTime(msg.timestamp)}
                      </span>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`[관리자] [${msg.senderNickname}] 님의 메시지를 삭제하시겠습니까?\n"${msg.text}"`)) {
                              if (onAdminDeleteChat) onAdminDeleteChat(msg.id);
                            }
                          }}
                          className="p-0.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/15 rounded transition-colors cursor-pointer"
                          title="관리자 권한 메시지 삭제"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div
                    className={`text-slate-200 font-sans break-words ${
                      isReaction ? 'text-xl leading-tight py-0.5' : 'text-xs leading-relaxed'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* 3. Footer: One-touch Reactions + Text Input Field */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/90 select-none flex flex-col gap-2">
        {/* Quick Reaction Buttons */}
        <div className="flex items-center justify-between gap-1.5 bg-slate-950/60 p-1.5 rounded-lg border border-slate-800/80">
          <span className="text-[10px] text-slate-400 font-bold px-1 font-sans">빠른 반응:</span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onSendReaction ? onSendReaction('👍') : onSendMessage('👍')}
              className="w-8 h-8 rounded-md bg-[#252844] hover:bg-[#35395f] active:scale-90 border border-emerald-500/50 flex items-center justify-center text-sm shadow-sm cursor-pointer transition-transform"
              title="따봉 (👍)"
            >
              👍
            </button>
            <button
              type="button"
              onClick={() => onSendReaction ? onSendReaction('❤️') : onSendMessage('❤️')}
              className="w-8 h-8 rounded-md bg-[#252844] hover:bg-[#35395f] active:scale-90 border border-rose-500/50 flex items-center justify-center text-sm shadow-sm cursor-pointer transition-transform"
              title="하트 (❤️)"
            >
              ❤️
            </button>
            <button
              type="button"
              onClick={() => onSendReaction ? onSendReaction('😭') : onSendMessage('😭')}
              className="w-8 h-8 rounded-md bg-[#252844] hover:bg-[#35395f] active:scale-90 border border-amber-500/50 flex items-center justify-center text-sm shadow-sm cursor-pointer transition-transform"
              title="눈물 (😭)"
            >
              😭
            </button>
          </div>
        </div>

        {/* Text Input Form */}
        <form onSubmit={handleSubmit} className="flex items-center gap-1.5">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="회의 의견 입력... (Enter)"
            maxLength={70}
            className="flex-1 bg-slate-950 border border-slate-700 focus:border-indigo-500 focus:outline-hidden px-3 py-2 text-xs text-white rounded-lg font-sans placeholder:text-slate-500 min-w-0"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 active:scale-95 disabled:opacity-40 text-white p-2 sm:px-3 sm:py-2 rounded-lg font-bold flex items-center justify-center cursor-pointer transition-all shrink-0"
            title="전송"
          >
            <Send size={14} />
          </button>
        </form>
      </div>
    </aside>
  );
}
