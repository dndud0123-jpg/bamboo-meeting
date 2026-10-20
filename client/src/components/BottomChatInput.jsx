import React, { useState, useEffect, useRef } from 'react';
import CharacterAvatar from './CharacterAvatar';
import { Send, Users, MessageSquare } from 'lucide-react';

export default function BottomChatInput({
  messages,
  onSendMessage,
  onSendReaction,
  onlineCount,
  myProfile
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
    <div className="flex-1 min-h-0 w-full flex flex-col bg-slate-900 border-t border-slate-800 text-slate-100 select-text overflow-hidden">
      {/* 1. Sub-header: Feed title & online count */}
      <div className="px-3.5 py-2 border-b border-slate-800 bg-slate-900/95 flex items-center justify-between select-none shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <h2 className="text-xs font-bold text-slate-200">실시간 회의 피드</h2>
        </div>
        <div className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
          <Users size={12} />
          <span>접속 {onlineCount}명</span>
        </div>
      </div>

      {/* 2. Chat Feed (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 select-text">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center p-4">
            <MessageSquare size={24} className="mb-2 opacity-30 text-slate-400" />
            <p className="text-xs font-sans">아직 등록된 의견이 없습니다.</p>
            <p className="text-[11px] text-slate-600 mt-1 font-sans">
              아래 입력창에서 첫 번째 의견을 작성해보세요!
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
                  className="text-center my-1 py-1 px-2.5 bg-slate-800/50 border border-slate-700/60 rounded-md text-[10px] text-slate-400 font-sans"
                >
                  {msg.text}
                </div>
              );
            }

            const isReaction = ['👍', '❤️', '😭'].includes(msg.text);

            return (
              <div
                key={uniqueKey}
                className="flex items-start gap-2 p-1.5 sm:p-2 bg-slate-800/40 hover:bg-slate-800/60 rounded-lg border border-slate-700/40 transition-colors"
              >
                <CharacterAvatar
                  charIndex={msg.charIndex ?? 0}
                  size="sm"
                  className="shrink-0 mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="font-bold text-[11px] text-amber-300 truncate">
                      {msg.senderNickname}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono shrink-0">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>

                  {isReaction ? (
                    <div className="inline-block px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 rounded text-base animate-bounce">
                      {msg.text}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-200 break-words leading-relaxed font-sans">
                      {msg.text}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* 3. Bottom Text Input Bar + Quick Reactions */}
      <div className="p-2 sm:p-2.5 bg-slate-900 border-t border-slate-800 flex flex-col gap-1.5 shrink-0 select-none">
        <form onSubmit={handleSubmit} className="flex items-center gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => onSendReaction ? onSendReaction('👍') : onSendMessage('👍')}
              className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-90 border border-slate-700 flex items-center justify-center text-xs cursor-pointer shadow-xs transition-transform"
              title="따봉 (👍)"
            >
              👍
            </button>
            <button
              type="button"
              onClick={() => onSendReaction ? onSendReaction('❤️') : onSendMessage('❤️')}
              className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-90 border border-slate-700 flex items-center justify-center text-xs cursor-pointer shadow-xs transition-transform"
              title="하트 (❤️)"
            >
              ❤️
            </button>
            <button
              type="button"
              onClick={() => onSendReaction ? onSendReaction('😭') : onSendMessage('😭')}
              className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-90 border border-slate-700 flex items-center justify-center text-xs cursor-pointer shadow-xs transition-transform"
              title="눈물 (😭)"
            >
              😭
            </button>
          </div>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="회의 의견 입력 (최대 70자)..."
            maxLength={70}
            className="flex-1 min-w-0 bg-slate-950/80 border border-slate-700 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-white text-xs rounded-xl px-2.5 py-1.5 sm:py-2 outline-none placeholder:text-slate-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="shrink-0 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-600 active:scale-95 text-slate-950 font-bold px-3 py-1.5 sm:py-2 rounded-xl transition-all flex items-center justify-center cursor-pointer disabled:cursor-not-allowed shadow-md"
            aria-label="전송"
          >
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}
