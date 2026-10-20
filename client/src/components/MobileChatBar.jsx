import React, { useState } from 'react';
import { Send } from 'lucide-react';

export default function MobileChatBar({
  onSendMessage,
  onSendReaction,
  onTriggerJump
}) {
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onSendMessage(trimmed);
    setText('');
  };

  return (
    <div className="select-none pointer-events-auto flex items-center gap-2 max-w-sm sm:max-w-md w-full">
      {/* Jump Button + 3 One-touch Emoji Reactions */}
      <div className="flex items-center gap-1.5 shrink-0 bg-[#161824]/85 backdrop-blur-md p-1.5 rounded-xl border border-slate-700/80 shadow-xl">
        {/* Mobile Jump Button */}
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            if (onTriggerJump) onTriggerJump();
          }}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-linear-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-90 border-2 border-amber-300 text-white flex flex-col items-center justify-center shadow-md cursor-pointer transition-transform"
          title="점프 (Space)"
        >
          <span className="text-xs leading-none">🦘</span>
          <span className="text-[8px] sm:text-[9px] font-bold font-sans leading-none mt-0.5">점프</span>
        </button>

        <button
          type="button"
          onClick={() => onSendReaction('👍')}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[#252844] hover:bg-[#35395f] active:scale-90 border border-emerald-500/50 flex items-center justify-center text-base sm:text-lg shadow-sm cursor-pointer transition-transform"
          title="따봉 (👍)"
        >
          👍
        </button>
        <button
          type="button"
          onClick={() => onSendReaction('❤️')}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[#252844] hover:bg-[#35395f] active:scale-90 border border-rose-500/50 flex items-center justify-center text-base sm:text-lg shadow-sm cursor-pointer transition-transform"
          title="하트 (❤️)"
        >
          ❤️
        </button>
        <button
          type="button"
          onClick={() => onSendReaction('😭')}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[#252844] hover:bg-[#35395f] active:scale-90 border border-amber-500/50 flex items-center justify-center text-base sm:text-lg shadow-sm cursor-pointer transition-transform"
          title="눈물 (😭)"
        >
          😭
        </button>
      </div>

      {/* Text Message Input */}
      <form
        onSubmit={handleSubmit}
        className="flex-1 flex items-center gap-1 bg-[#161824]/85 backdrop-blur-md p-1.5 rounded-xl border border-slate-700/80 shadow-xl"
      >
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="말풍선 입력 (3초)..."
          maxLength={60}
          className="flex-1 bg-[#0f1019] border border-slate-700/80 focus:border-indigo-400 focus:outline-hidden px-2.5 py-1.5 text-xs sm:text-sm text-yellow-100 rounded-lg placeholder:text-slate-500 font-sans min-w-0"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="bg-indigo-600 hover:bg-indigo-500 active:scale-95 disabled:opacity-40 text-white p-2 sm:px-3 sm:py-2 rounded-lg font-bold flex items-center justify-center cursor-pointer transition-all shrink-0"
          title="전송"
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}
