import React, { useState, useRef } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Send, ThumbsUp, Heart, Frown } from 'lucide-react';

export default function MobileControls({
  onDirectionChange,
  onSendMessage,
  onSendReaction
}) {
  const [inputText, setInputText] = useState('');
  const activeDirRef = useRef(null);

  const handleDirStart = (dir, e) => {
    if (e && e.cancelable) e.preventDefault();
    activeDirRef.current = dir;
    onDirectionChange(dir, true);
  };

  const handleDirEnd = (dir, e) => {
    if (e && e.cancelable) e.preventDefault();
    if (activeDirRef.current === dir) {
      activeDirRef.current = null;
      onDirectionChange(dir, false);
    }
  };

  const handleTextSubmit = (e) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed) return;
    onSendMessage(trimmed);
    setInputText('');
  };

  return (
    <div className="w-full bg-[#161726]/95 backdrop-blur-md border-t-2 border-[#2b2d42] p-2 sm:p-3 select-none flex flex-col gap-2 z-10">
      {/* Top row: Emoticon quick reactions + Text Input */}
      <div className="flex items-center gap-2 max-w-2xl mx-auto w-full">
        {/* Quick Reactions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => onSendReaction('👍')}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-[#252844] hover:bg-[#343861] active:scale-95 border-2 border-emerald-500/60 flex items-center justify-center text-lg shadow-md cursor-pointer transition-transform"
            title="따봉 (👍)"
          >
            👍
          </button>
          <button
            onClick={() => onSendReaction('❤️')}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-[#252844] hover:bg-[#343861] active:scale-95 border-2 border-rose-500/60 flex items-center justify-center text-lg shadow-md cursor-pointer transition-transform"
            title="하트 (❤️)"
          >
            ❤️
          </button>
          <button
            onClick={() => onSendReaction('😭')}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-[#252844] hover:bg-[#343861] active:scale-95 border-2 border-amber-500/60 flex items-center justify-center text-lg shadow-md cursor-pointer transition-transform"
            title="눈물 (😭)"
          >
            😭
          </button>
        </div>

        {/* Text Input with Send Button */}
        <form onSubmit={handleTextSubmit} className="flex-1 flex items-center gap-1.5">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="말풍선 의견 입력... (3초 노출)"
            maxLength={60}
            className="flex-1 bg-[#0f1019] border-2 border-slate-700 focus:border-indigo-400 focus:outline-hidden px-3 py-2 text-xs sm:text-sm text-yellow-100 rounded-lg placeholder:text-slate-500 font-sans"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white px-3.5 py-2 rounded-lg font-bold flex items-center justify-center cursor-pointer transition-all shadow-md shrink-0 text-xs sm:text-sm"
          >
            <Send size={15} />
          </button>
        </form>
      </div>

      {/* Bottom row: Mobile Virtual D-Pad (only displayed on touch screens or compact screens) */}
      <div className="flex md:hidden items-center justify-center py-1">
        <div className="relative w-36 h-36 bg-[#1a1b2e] rounded-full border-2 border-slate-700 p-2 shadow-inner flex items-center justify-center">
          {/* UP Button */}
          <button
            type="button"
            onPointerDown={(e) => handleDirStart('up', e)}
            onPointerUp={(e) => handleDirEnd('up', e)}
            onPointerLeave={(e) => handleDirEnd('up', e)}
            className="absolute top-1 left-1/2 -translate-x-1/2 w-11 h-11 bg-[#282a47] active:bg-[#434675] border-2 border-slate-600 rounded-t-lg flex items-center justify-center text-yellow-300 shadow-md touch-none"
          >
            <ChevronUp size={20} />
          </button>

          {/* DOWN Button */}
          <button
            type="button"
            onPointerDown={(e) => handleDirStart('down', e)}
            onPointerUp={(e) => handleDirEnd('down', e)}
            onPointerLeave={(e) => handleDirEnd('down', e)}
            className="absolute bottom-1 left-1/2 -translate-x-1/2 w-11 h-11 bg-[#282a47] active:bg-[#434675] border-2 border-slate-600 rounded-b-lg flex items-center justify-center text-yellow-300 shadow-md touch-none"
          >
            <ChevronDown size={20} />
          </button>

          {/* LEFT Button */}
          <button
            type="button"
            onPointerDown={(e) => handleDirStart('left', e)}
            onPointerUp={(e) => handleDirEnd('left', e)}
            onPointerLeave={(e) => handleDirEnd('left', e)}
            className="absolute left-1 top-1/2 -translate-y-1/2 w-11 h-11 bg-[#282a47] active:bg-[#434675] border-2 border-slate-600 rounded-l-lg flex items-center justify-center text-yellow-300 shadow-md touch-none"
          >
            <ChevronLeft size={20} />
          </button>

          {/* RIGHT Button */}
          <button
            type="button"
            onPointerDown={(e) => handleDirStart('right', e)}
            onPointerUp={(e) => handleDirEnd('right', e)}
            onPointerLeave={(e) => handleDirEnd('right', e)}
            className="absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 bg-[#282a47] active:bg-[#434675] border-2 border-slate-600 rounded-r-lg flex items-center justify-center text-yellow-300 shadow-md touch-none"
          >
            <ChevronRight size={20} />
          </button>

          {/* Center decorative hub */}
          <div className="w-8 h-8 rounded-full bg-[#181928] border border-slate-600 shadow-inner flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-slate-500/40" />
          </div>
        </div>
      </div>
    </div>
  );
}
