import React, { useState, useEffect, useRef } from 'react';
import { getAvatarDataUrl } from '../utils/pixelSprites';
import { MessageSquare, ChevronDown, ChevronUp, Users, QrCode } from 'lucide-react';

export default function ChatDrawer({
  messages,
  onlineCount,
  onOpenQR
}) {
  const [isOpen, setIsOpen] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const formatTime = (ts) => {
    const d = new Date(ts);
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  };

  return (
    <div className="select-none pointer-events-auto flex flex-col items-end">
      {/* Header / Toggle Button Pill */}
      <div className="flex items-center gap-1.5 bg-[#161824]/90 backdrop-blur-md border border-slate-700/80 px-2.5 py-1.5 rounded-xl shadow-xl text-xs text-white">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 cursor-pointer font-bold hover:text-yellow-300 transition-colors"
        >
          <div className="relative">
            <MessageSquare size={15} className="text-indigo-400" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          </div>
          <span className="text-[11px] font-sans">회의 피드</span>
          <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/40">
            {onlineCount}명
          </span>
          {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        <span className="text-slate-600">|</span>

        {/* QR Button */}
        <button
          type="button"
          onClick={onOpenQR}
          className="flex items-center gap-1 text-[11px] text-yellow-300 hover:text-yellow-200 cursor-pointer font-bold px-1"
          title="모바일 QR 코드"
        >
          <QrCode size={14} />
          <span className="hidden sm:inline">QR</span>
        </button>
      </div>

      {/* Expandable Chat Drawer Body */}
      {isOpen && (
        <div className="mt-2 w-72 sm:w-80 h-52 sm:h-64 bg-[#121320]/90 backdrop-blur-lg border border-slate-700/90 rounded-xl shadow-2xl p-2.5 flex flex-col text-xs text-white overflow-hidden transition-all animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="text-[10px] text-slate-400 border-b border-slate-800 pb-1 mb-1.5 flex items-center justify-between font-sans">
            <span>실시간 의견 기록 (영구 보관)</span>
            <span>최신순</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 select-text">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-[11px] text-center font-sans">
                아직 등록된 의견이 없습니다.
              </div>
            ) : (
              messages.map((msg) => {
                const isSystem = msg.senderId === 'system';
                if (isSystem) {
                  return (
                    <div
                      key={msg.id}
                      className="text-center py-0.5 px-2 bg-slate-800/40 rounded text-[10px] text-slate-400 font-sans"
                    >
                      {msg.text}
                    </div>
                  );
                }

                return (
                  <div
                    key={msg.id}
                    className="flex items-start gap-1.5 p-1.5 bg-[#1a1b2d]/80 rounded border border-slate-800/70"
                  >
                    <img
                      src={getAvatarDataUrl(msg.characterId)}
                      alt="avatar"
                      className="w-5 h-5 rounded shrink-0 border border-slate-700 pixelated bg-slate-900 mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[10px] text-yellow-300 truncate">
                          {msg.senderNickname}
                        </span>
                        <span className="text-[9px] text-slate-500 font-mono">
                          {formatTime(msg.timestamp)}
                        </span>
                      </div>
                      <div className="text-slate-200 font-sans text-[11px] break-words">
                        {msg.text}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={scrollRef} />
          </div>
        </div>
      )}
    </div>
  );
}
