import React, { useState, useEffect, useRef } from 'react';
import { Send, Smile } from 'lucide-react';

export default function MobileInputBar({
  onSendMessage,
  onSendReaction
}) {
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const inputRef = useRef(null);

  // Keep scroll anchored to 0 on mobile viewport resize / scroll to prevent iOS push
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const handleViewportChange = () => {
      window.scrollTo(0, 0);
      document.body.scrollTop = 0;
    };

    window.visualViewport.addEventListener('resize', handleViewportChange);
    window.visualViewport.addEventListener('scroll', handleViewportChange);
    return () => {
      window.visualViewport?.removeEventListener('resize', handleViewportChange);
      window.visualViewport?.removeEventListener('scroll', handleViewportChange);
    };
  }, []);

  const handleFocus = () => {
    // iOS Safari auto-scroll reset to keep top-pinned input firmly in place
    window.scrollTo(0, 0);
    document.body.scrollTop = 0;
    setTimeout(() => {
      window.scrollTo(0, 0);
      document.body.scrollTop = 0;
    }, 50);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed) return;
    onSendMessage(trimmed);
    setInputText('');
    setShowEmojiPicker(false);
  };

  const handleQuickEmoji = (emoji) => {
    if (onSendReaction) {
      onSendReaction(emoji);
    } else {
      onSendMessage(emoji);
    }
    setShowEmojiPicker(false);
  };

  return (
    <div className="w-full relative select-none pointer-events-auto">
      {/* Optional Quick Reaction Popup */}
      {showEmojiPicker && (
        <div className="mb-1.5 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl p-1.5 flex items-center justify-around shadow-2xl animate-fadeIn">
          {['👍', '❤️', '😭', '🔥', '🎉', '👋'].map((em) => (
            <button
              key={em}
              type="button"
              onClick={() => handleQuickEmoji(em)}
              className="text-base sm:text-lg hover:scale-125 active:scale-95 transition-transform p-1 cursor-pointer"
            >
              {em}
            </button>
          ))}
        </div>
      )}

      {/* Main Top-Pinned Capsule Input Bar */}
      <form
        onSubmit={handleSubmit}
        className="bg-slate-900/85 backdrop-blur-md rounded-full border border-slate-700/60 px-3 py-1 sm:py-1.5 flex items-center gap-2 shadow-lg"
      >
        <button
          type="button"
          onClick={() => setShowEmojiPicker((prev) => !prev)}
          className="text-slate-400 hover:text-yellow-300 active:scale-90 transition-transform p-0.5 cursor-pointer"
          title="이모지 선택"
          aria-label="이모지 선택"
        >
          <Smile size={16} />
        </button>

        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onFocus={handleFocus}
          placeholder="메시지를 입력하세요..."
          maxLength={70}
          className="flex-1 bg-transparent text-white text-xs placeholder:text-slate-400 focus:outline-hidden font-sans"
        />

        <button
          type="submit"
          disabled={!inputText.trim()}
          className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-all ${
            inputText.trim()
              ? 'bg-yellow-400 text-slate-950 shadow-md active:scale-90 cursor-pointer'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
          aria-label="전송"
        >
          <Send size={12} className="ml-0.5" />
        </button>
      </form>
    </div>
  );
}
