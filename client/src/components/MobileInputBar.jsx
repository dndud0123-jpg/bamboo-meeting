import React, { useState, useEffect, useRef } from 'react';
import { Send, Smile } from 'lucide-react';

export default function MobileInputBar({
  onSendMessage,
  onSendReaction
}) {
  const [inputText, setInputText] = useState('');
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const inputRef = useRef(null);

  // Dynamic visualViewport tracker:
  // Detects the exact height and offset of the mobile virtual keyboard
  // so the input bar lifts up cleanly right above the keyboard without squashing the canvas.
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const handleViewportChange = () => {
      const vv = window.visualViewport;
      // If visualViewport height is smaller than innerHeight, keyboard is open!
      const offset = Math.max(0, window.innerHeight - (vv.height + vv.offsetTop));
      setKeyboardOffset(offset);
    };

    window.visualViewport.addEventListener('resize', handleViewportChange);
    window.visualViewport.addEventListener('scroll', handleViewportChange);
    return () => {
      window.visualViewport?.removeEventListener('resize', handleViewportChange);
      window.visualViewport?.removeEventListener('scroll', handleViewportChange);
    };
  }, []);

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
    <div
      className="md:hidden absolute left-3 right-3 z-30 transition-[bottom] duration-150 ease-out select-none pointer-events-auto"
      style={{
        bottom: keyboardOffset > 0 ? `${keyboardOffset + 6}px` : '8px'
      }}
    >
      {/* Optional Quick Reaction Popup */}
      {showEmojiPicker && (
        <div className="mb-2 bg-slate-900/90 backdrop-blur-md border border-white/20 rounded-2xl p-2 flex items-center justify-around shadow-2xl animate-fadeIn">
          {['👍', '❤️', '😭', '🔥', '🎉', '👋'].map((em) => (
            <button
              key={em}
              type="button"
              onClick={() => handleQuickEmoji(em)}
              className="text-lg hover:scale-125 active:scale-95 transition-transform p-1 cursor-pointer"
            >
              {em}
            </button>
          ))}
        </div>
      )}

      {/* Main Capsule Input Bar */}
      <form
        onSubmit={handleSubmit}
        className="bg-slate-900/80 backdrop-blur-md rounded-full border border-white/20 px-3 py-1.5 flex items-center gap-2 shadow-2xl"
      >
        <button
          type="button"
          onClick={() => setShowEmojiPicker((prev) => !prev)}
          className="text-slate-400 hover:text-yellow-300 active:scale-90 transition-transform p-1 cursor-pointer"
          title="이모지 선택"
          aria-label="이모지 선택"
        >
          <Smile size={18} />
        </button>

        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="메시지를 입력하세요..."
          maxLength={70}
          className="flex-1 bg-transparent text-white text-xs placeholder:text-slate-400 focus:outline-hidden font-sans"
        />

        <button
          type="submit"
          disabled={!inputText.trim()}
          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
            inputText.trim()
              ? 'bg-yellow-400 text-slate-950 shadow-md active:scale-90 cursor-pointer'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
          aria-label="전송"
        >
          <Send size={13} className="ml-0.5" />
        </button>
      </form>
    </div>
  );
}
