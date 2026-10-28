import React, { useState } from 'react';
import CharacterAvatar from './CharacterAvatar';
import { Heart, Trash2, X, Sparkles } from 'lucide-react';

const COLOR_MAP = {
  yellow: {
    bg: 'bg-[#fef9c3]',
    border: 'border-amber-300',
    title: 'text-amber-950',
    badge: 'bg-amber-400/20 text-amber-900 border-amber-400/40'
  },
  pink: {
    bg: 'bg-[#fce7f3]',
    border: 'border-pink-300',
    title: 'text-pink-950',
    badge: 'bg-rose-400/20 text-rose-900 border-rose-400/40'
  },
  mint: {
    bg: 'bg-[#dcfce7]',
    border: 'border-emerald-300',
    title: 'text-emerald-950',
    badge: 'bg-emerald-400/20 text-emerald-900 border-emerald-400/40'
  },
  purple: {
    bg: 'bg-[#f3e8ff]',
    border: 'border-purple-300',
    title: 'text-purple-950',
    badge: 'bg-purple-400/20 text-purple-900 border-purple-400/40'
  },
  cyan: {
    bg: 'bg-[#e0f2fe]',
    border: 'border-sky-300',
    title: 'text-sky-950',
    badge: 'bg-sky-400/20 text-sky-900 border-sky-400/40'
  }
};

function PostDetailModal({
  post,
  isOpen,
  onClose,
  onLike,
  onDelete,
  onAdminDelete,
  currentUserId,
  isAdmin = false
}) {
  const [bouncing, setBouncing] = useState(false);

  if (!isOpen || !post) return null;

  const theme = COLOR_MAP[post.color] || COLOR_MAP.yellow;
  const isLiked = post.likedUsers?.includes(currentUserId);
  const isMyPost = Boolean(post.authorId && currentUserId && post.authorId === currentUserId);

  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return '방금 전';
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return '방금 전';
    if (mins < 60) return `${mins}분 전`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}시간 전`;
    const days = Math.floor(hours / 24);
    return `${days}일 전`;
  };

  const handleLikeClick = (e) => {
    e.stopPropagation();
    setBouncing(true);
    setTimeout(() => setBouncing(false), 300);
    if (onLike) onLike(post.id);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (window.confirm('이 메모를 삭제하시겠습니까?')) {
      if (onDelete) onDelete(post.id);
      onClose();
    }
  };

  const handleAdminDeleteClick = (e) => {
    e.stopPropagation();
    if (window.confirm(`[관리자] '${post.title}' 메모를 강제 삭제하시겠습니까?`)) {
      if (onAdminDelete) onAdminDelete(post.id);
      else if (onDelete) onDelete(post.id);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fadeIn select-none"
      onClick={onClose}
    >
      {/* Modal Card */}
      <div
        className={`bg-amber-50 border-2 border-amber-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-stone-800 ${theme.bg} ${theme.border}`}
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), inset 0 0 30px rgba(0, 0, 0, 0.03)'
        }}
      >
        {/* Masking Tape Decor on Top */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-20 h-5 bg-white/60 border border-white/80 backdrop-blur-xs shadow-xs rounded-xs pointer-events-none" />

        {/* Top Header: Author + Time + Close Button */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-black/10">
          <div className="flex items-center gap-2 min-w-0">
            <CharacterAvatar charIndex={post.avatarIndex ?? 0} size="sm" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm sm:text-base text-slate-900 truncate">
                  {post.author}
                </span>
                {isMyPost && (
                  <span className="bg-amber-500/20 text-amber-900 border border-amber-400/40 text-[10px] font-bold px-1.5 py-0.5 rounded-full font-sans">
                    작성자
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 font-mono">
                {formatRelativeTime(post.createdAt)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-black/5 rounded-xl transition-colors cursor-pointer"
            aria-label="닫기"
          >
            <X size={20} />
          </button>
        </div>

        {/* Title */}
        <div className="mb-3">
          <h3 className="font-bold text-base sm:text-lg text-slate-900 break-words leading-snug">
            {post.title}
          </h3>
        </div>

        {/* Body Content (Full text with scroll and whitespace preserved) */}
        <div className="whitespace-pre-wrap break-words text-stone-800 text-sm leading-relaxed max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar select-text">
          {post.content}
        </div>

        {/* Bottom Footer: Likes & Moderation / Delete Buttons */}
        <div className="mt-5 pt-3 border-t border-black/10 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-stone-500 font-sans">
            <Sparkles size={13} className="text-amber-600" />
            <span>대나무숲 비밀 메모</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Admin Delete Button */}
            {isAdmin && (
              <button
                type="button"
                onClick={handleAdminDeleteClick}
                className="flex items-center gap-1 px-2.5 py-1 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold rounded-lg shadow-xs transition-all cursor-pointer font-sans"
                title="관리자 권한으로 삭제"
              >
                <span>✕</span>
                <span>관리자 삭제</span>
              </button>
            )}

            {/* Author Delete Button */}
            {!isAdmin && isMyPost && onDelete && (
              <button
                type="button"
                onClick={handleDeleteClick}
                className="flex items-center gap-1 px-2.5 py-1 text-stone-500 hover:text-rose-600 hover:bg-rose-500/10 border border-stone-300 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                title="메모 삭제"
              >
                <Trash2 size={13} />
                <span>삭제</span>
              </button>
            )}

            {/* Like Heart Button */}
            <button
              type="button"
              onClick={handleLikeClick}
              className={`group flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs cursor-pointer active:scale-90 transition-all ${
                isLiked
                  ? 'text-rose-600 bg-rose-100 border border-rose-300 font-bold scale-105 shadow-xs'
                  : 'text-stone-600 bg-stone-100 hover:bg-rose-50 border border-stone-200 shadow-xs'
              } ${bouncing ? 'scale-115 transition-transform duration-200' : ''}`}
              title={isLiked ? '추천 취소하기' : '공감 하트 누르기'}
            >
              <Heart
                size={14}
                className={`transition-all duration-200 ${
                  isLiked
                    ? 'fill-rose-500 text-rose-500 scale-110'
                    : 'text-stone-400 group-hover:text-rose-400 group-hover:scale-110'
                }`}
              />
              <span className={`font-mono font-bold ${isLiked ? 'text-rose-600' : 'text-stone-700'}`}>
                {post.likes || 0}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PostDetailModal;
