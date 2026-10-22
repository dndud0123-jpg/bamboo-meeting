import React, { useState } from 'react';
import CharacterAvatar from './CharacterAvatar';
import { X, Send, Palette, PenLine } from 'lucide-react';

const COLOR_OPTIONS = [
  { id: 'yellow', label: '레몬 옐로우', bg: 'bg-[#fef9c3]', border: 'border-amber-400', ring: 'ring-amber-400' },
  { id: 'pink', label: '체리 핑크', bg: 'bg-[#fce7f3]', border: 'border-pink-400', ring: 'ring-pink-400' },
  { id: 'mint', label: '애플 민트', bg: 'bg-[#dcfce7]', border: 'border-emerald-400', ring: 'ring-emerald-400' },
  { id: 'purple', label: '라벤더 퍼플', bg: 'bg-[#f3e8ff]', border: 'border-purple-400', ring: 'ring-purple-400' },
  { id: 'cyan', label: '스카이 블루', bg: 'bg-[#e0f2fe]', border: 'border-sky-400', ring: 'ring-sky-400' }
];

export default function PostCreateModal({
  isOpen,
  onClose,
  onSubmit,
  myProfile
}) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedColor, setSelectedColor] = useState('yellow');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const t = title.trim();
    const c = content.trim();
    if (!t || !c) return;

    onSubmit({
      title: t,
      content: c,
      color: selectedColor
    });

    setTitle('');
    setContent('');
    setSelectedColor('yellow');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs select-none animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#181a29] border-4 border-amber-500 rounded-2xl p-4 sm:p-6 shadow-2xl text-white pixel-box">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-700/80 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <PenLine size={18} />
            </span>
            <div>
              <h2 className="font-pixel text-sm sm:text-base font-bold text-amber-300 tracking-wide">
                대나무숲 새 메모 남기기
              </h2>
              <p className="text-[11px] text-slate-400 font-sans">
                익명으로 자유롭게 생각을 공유해보세요!
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-400 hover:text-white transition-all cursor-pointer"
            aria-label="닫기"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Author Badge Preview */}
          <div className="flex items-center gap-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-400 text-[11px] font-sans">작성자:</span>
            <div className="flex items-center gap-1.5 bg-[#252844] px-2 py-0.5 rounded border border-amber-500/30">
              <CharacterAvatar charIndex={myProfile?.charIndex ?? 0} size="xs" />
              <span className="text-amber-300 font-bold text-[11px]">
                {myProfile?.nickname || '익명'}
              </span>
            </div>
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5 font-sans">
              <Palette size={13} className="text-amber-400" />
              포스트잇 색상 선택
            </label>
            <div className="flex items-center gap-2.5">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedColor(c.id)}
                  className={`w-8 h-8 rounded-lg ${c.bg} ${c.border} border-2 transition-transform cursor-pointer flex items-center justify-center ${
                    selectedColor === c.id
                      ? 'scale-110 ring-2 ring-offset-2 ring-offset-slate-900 ring-amber-400 shadow-md'
                      : 'opacity-70 hover:opacity-100 hover:scale-105'
                  }`}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          {/* Title Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-300 font-sans">
                제목 (핵심 한마디)
              </label>
              <span className="text-[10px] text-slate-500 font-mono">
                {title.length}/30자
              </span>
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 오늘 다들 점심 뭐 드셨나요?"
              maxLength={30}
              className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 rounded-xl px-3 py-2 text-xs sm:text-sm text-white outline-none placeholder:text-slate-600 font-sans transition-colors"
            />
          </div>

          {/* Content Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-300 font-sans">
                내용 (자유로운 이야기)
              </label>
              <span className="text-[10px] text-slate-500 font-mono">
                {content.length}/200자
              </span>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="자유롭게 속마음이나 의견을 적어보세요..."
              maxLength={200}
              rows={4}
              className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 rounded-xl px-3 py-2 text-xs sm:text-sm text-white outline-none placeholder:text-slate-600 font-sans transition-colors resize-none leading-relaxed"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-xs text-slate-300 font-bold transition-all cursor-pointer font-sans"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!title.trim() || !content.trim()}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-600 active:scale-95 text-slate-950 font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed shadow-md font-sans"
            >
              <Send size={14} />
              <span>포스트잇 붙이기</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
