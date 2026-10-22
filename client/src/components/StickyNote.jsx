import React, { useState } from 'react';
import CharacterAvatar from './CharacterAvatar';
import { Heart, Flame, Sparkles, Trash2 } from 'lucide-react';

const COLOR_MAP = {
  yellow: {
    bg: 'bg-[#fef9c3]',
    border: 'border-amber-300/80',
    shadow: 'shadow-amber-950/20',
    text: 'text-amber-950',
    tape: 'bg-white/50 border-white/70',
    accent: 'bg-amber-400/20 text-amber-900 border-amber-400/40'
  },
  pink: {
    bg: 'bg-[#fce7f3]',
    border: 'border-pink-300/80',
    shadow: 'shadow-pink-950/20',
    text: 'text-pink-950',
    tape: 'bg-white/50 border-white/70',
    accent: 'bg-rose-400/20 text-rose-900 border-rose-400/40'
  },
  mint: {
    bg: 'bg-[#dcfce7]',
    border: 'border-emerald-300/80',
    shadow: 'shadow-emerald-950/20',
    text: 'text-emerald-950',
    tape: 'bg-white/50 border-white/70',
    accent: 'bg-emerald-400/20 text-emerald-900 border-emerald-400/40'
  },
  purple: {
    bg: 'bg-[#f3e8ff]',
    border: 'border-purple-300/80',
    shadow: 'shadow-purple-950/20',
    text: 'text-purple-950',
    tape: 'bg-white/50 border-white/70',
    accent: 'bg-purple-400/20 text-purple-900 border-purple-400/40'
  },
  cyan: {
    bg: 'bg-[#e0f2fe]',
    border: 'border-sky-300/80',
    shadow: 'shadow-sky-950/20',
    text: 'text-sky-950',
    tape: 'bg-white/50 border-white/70',
    accent: 'bg-sky-400/20 text-sky-900 border-sky-400/40'
  }
};

const ROTATIONS = [
  'rotate-[-1.5deg]',
  'rotate-[1.2deg]',
  'rotate-[-0.8deg]',
  'rotate-[1.6deg]',
  'rotate-[-1.2deg]',
  'rotate-[0.7deg]'
];

export default function StickyNote({
  post,
  onLike,
  onDelete,
  onAdminDelete,
  currentUserId,
  isAdmin = false,
  rank = 0,
  index = 0
}) {
  const [bouncing, setBouncing] = useState(false);
  const theme = COLOR_MAP[post.color] || COLOR_MAP.yellow;
  const rotation = ROTATIONS[index % ROTATIONS.length];
  const isLiked = post.likedUsers?.includes(currentUserId);
  const isMyPost = Boolean(post.authorId && currentUserId && post.authorId === currentUserId);

  const handleLikeClick = (e) => {
    e.stopPropagation();
    setBouncing(true);
    setTimeout(() => setBouncing(false), 300);
    onLike(post.id);
  };

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

  return (
    <div
      className={`relative flex flex-col justify-between p-3.5 sm:p-4 rounded-xl border-2 ${theme.bg} ${theme.border} ${theme.shadow} shadow-lg transition-transform hover:-translate-y-1 min-h-[180px] text-stone-800 ${rotation}`}
      style={{ touchAction: 'pan-y' }}
    >
      {/* 1. Masking Tape Decor on Top */}
      <div
        className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-14 sm:w-16 h-4 bg-white/40 border border-white/60 backdrop-blur-xs shadow-xs rounded-xs pointer-events-none z-10"
      />

      {/* 2. Top Header: Author + Time + Rank Badge */}
      <div className="flex items-center justify-between gap-1.5 mb-2 pt-1 border-b border-black/10 pb-1.5 shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <CharacterAvatar charIndex={post.avatarIndex ?? 0} size="xs" />
          <span className="font-bold text-xs text-slate-800 truncate max-w-[85px] sm:max-w-[110px]">
            {post.author}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {rank === 1 && post.likes > 0 && (
            <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-xs flex items-center gap-0.5 animate-pulse font-sans">
              <Flame size={11} className="fill-yellow-200 text-yellow-200" />
              <span>BEST 1위</span>
            </span>
          )}
          {rank === 2 && post.likes > 0 && (
            <span className="bg-slate-700 text-slate-100 text-[10px] font-bold px-1.5 py-0.5 rounded-full font-sans">
              🥈 2위
            </span>
          )}
          {rank === 3 && post.likes > 0 && (
            <span className="bg-amber-800 text-amber-100 text-[10px] font-bold px-1.5 py-0.5 rounded-full font-sans">
              🥉 3위
            </span>
          )}
          <span className="text-[10px] text-slate-500 font-mono">
            {formatRelativeTime(post.createdAt)}
          </span>
          {isAdmin ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`[관리자] '${post.title}' 메모를 강제 삭제하시겠습니까?`)) {
                  if (onAdminDelete) onAdminDelete(post.id);
                  else if (onDelete) onDelete(post.id);
                }
              }}
              className="flex items-center gap-0.5 px-1.5 py-0.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-[10px] font-bold rounded shadow-xs transition-all cursor-pointer font-sans"
              title="관리자 권한으로 삭제"
            >
              <span>✕</span>
              <span>관리자 삭제</span>
            </button>
          ) : (
            isMyPost && onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm('이 메모를 삭제하시겠습니까?')) {
                    onDelete(post.id);
                  }
                }}
                className="p-1 text-stone-400 hover:text-rose-600 hover:bg-rose-500/10 rounded-md transition-colors cursor-pointer"
                title="메모 삭제"
                aria-label="메모 삭제"
              >
                <Trash2 size={13} />
              </button>
            )
          )}
        </div>
      </div>

      {/* 3. Title & Body Content */}
      <div className="flex-1 min-h-0 my-1">
        <h4 className="font-bold text-sm sm:text-base line-clamp-1 mb-1 text-slate-900 break-words leading-snug">
          {post.title}
        </h4>
        <p className="text-xs sm:text-sm text-stone-700 line-clamp-4 leading-relaxed break-words whitespace-pre-wrap">
          {post.content}
        </p>
      </div>

      {/* 4. Bottom Footer: Like Button */}
      <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-black/10 shrink-0">
        <div className="text-[10px] text-stone-500 font-sans flex items-center gap-1">
          <Sparkles size={11} className="text-amber-600" />
          <span>익명 메모</span>
        </div>

        <button
          type="button"
          onClick={handleLikeClick}
          className={`group flex items-center gap-1.5 px-3 py-1 rounded-full text-xs cursor-pointer active:scale-90 transition-all ${
            isLiked
              ? 'text-rose-600 bg-rose-100 border border-rose-300 font-bold scale-105 shadow-xs'
              : 'text-stone-500 bg-stone-100/90 hover:bg-rose-50 border border-stone-200 shadow-xs'
          } ${bouncing ? 'scale-115 transition-transform duration-200' : ''}`}
          title={isLiked ? '추천 취소하기' : '공감 하트 누르기'}
          aria-label={isLiked ? '추천 취소' : '추천하기'}
        >
          <Heart
            size={13}
            className={`transition-all duration-200 ${
              isLiked
                ? 'fill-rose-500 text-rose-500 scale-110'
                : 'text-stone-400 group-hover:text-rose-400 group-hover:scale-110'
            }`}
          />
          <span className={`font-mono ${isLiked ? 'text-rose-600 font-bold' : 'text-stone-600 font-medium'}`}>
            {post.likes || 0}
          </span>
        </button>
      </div>
    </div>
  );
}
