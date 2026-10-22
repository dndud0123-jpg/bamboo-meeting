import React, { useMemo } from 'react';
import StickyNote from './StickyNote';
import { PenSquare, MessageSquare, Sparkles, ArrowLeft, X } from 'lucide-react';

export default function BoardSidebar({
  posts = [],
  onLike,
  onDelete,
  onAdminDelete,
  onOpenCreate,
  currentUserId,
  isAdmin = false,
  onBackToChat
}) {
  // Sort posts strictly in descending order of likes, then newest
  const sortedPosts = useMemo(() => {
    const list = Array.isArray(posts) ? posts : [];
    return [...list].sort((a, b) => {
      const diff = (b.likes || 0) - (a.likes || 0);
      if (diff !== 0) return diff;
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
  }, [posts]);

  return (
    <aside className="w-80 md:w-96 h-full flex flex-col bg-[#c89d68] border-l-4 border-[#53341b] shadow-2xl select-none shrink-0 z-20">
      {/* 1. Cork Plank Header */}
      <div className="shrink-0 flex items-center justify-between p-3 bg-[#422813] border-b-2 border-[#331c0a] text-amber-100 shadow-md">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xl select-none">📌</span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="font-pixel text-xs sm:text-sm font-bold text-amber-200 tracking-wider truncate">
                대나무숲 게시판
              </h2>
              <span className="bg-amber-500/20 text-amber-300 text-[10px] px-1.5 py-0.2 rounded-full border border-amber-400/30 font-sans shrink-0">
                총 {sortedPosts.length}개
              </span>
            </div>
            <p className="text-[10px] text-amber-300/70 font-sans truncate">
              하트(❤️) 1위 상단 고정
            </p>
          </div>
        </div>

        {/* Action Buttons: New Post + Return to Chat */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onOpenCreate}
            className="bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-bold px-2.5 py-1.5 rounded-lg border border-amber-200 shadow-sm flex items-center gap-1 text-xs cursor-pointer transition-all font-sans"
            title="새 메모 작성"
          >
            <PenSquare size={13} />
            <span>새 글</span>
          </button>

          <button
            type="button"
            onClick={onBackToChat}
            className="bg-slate-900/80 hover:bg-slate-800 active:scale-95 text-slate-200 font-bold px-2.5 py-1.5 rounded-lg border border-slate-700 shadow-sm flex items-center gap-1 text-xs cursor-pointer transition-all font-sans"
            title="실시간 채팅으로 복귀"
          >
            <MessageSquare size={13} className="text-indigo-400" />
            <span>채팅</span>
          </button>
        </div>
      </div>

      {/* 2. Cork Surface Scrollable Feed (Vertical Stack Cards) */}
      <div
        className="flex-1 p-3 overflow-y-auto space-y-3 min-h-[200px]"
        style={{
          backgroundImage: `radial-gradient(#b08754 1.5px, transparent 1.5px), radial-gradient(#d4ac7a 1px, transparent 1px)`,
          backgroundSize: '24px 24px, 12px 12px',
          backgroundPosition: '0 0, 6px 6px',
          boxShadow: 'inset 0 0 25px rgba(78, 46, 22, 0.35)'
        }}
      >
        {sortedPosts.length === 0 ? (
          <div className="h-full min-h-[220px] flex flex-col items-center justify-center p-6 text-center select-none">
            <div className="text-4xl mb-2 animate-bounce">📌</div>
            <p className="font-pixel font-bold text-sm text-amber-950">
              아직 등록된 메모가 없습니다.
            </p>
            <p className="text-xs text-amber-900/80 mt-1 font-sans">
              상단의 [새 글] 버튼을 눌러 첫 번째 이야기를 남겨보세요!
            </p>
            <button
              type="button"
              onClick={onOpenCreate}
              className="mt-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3.5 py-1.5 rounded-xl border border-amber-200 shadow-md active:scale-95 text-xs transition-transform cursor-pointer font-sans"
            >
              ✏️ 첫 번째 메모 남기기
            </button>
          </div>
        ) : (
          <div className="space-y-3 pb-4">
            {sortedPosts.map((post, idx) => (
              <StickyNote
                key={post.id || `sidebar_post_${idx}`}
                post={post}
                onLike={onLike}
                onDelete={onDelete}
                onAdminDelete={onAdminDelete}
                currentUserId={currentUserId}
                isAdmin={isAdmin}
                rank={idx + 1}
                index={idx}
              />
            ))}
          </div>
        )}
      </div>

      {/* 3. Footer Plank */}
      <div className="shrink-0 bg-[#422813] border-t-2 border-[#331c0a] px-3 py-1.5 flex items-center justify-between text-[10px] text-amber-300/70 font-sans">
        <div className="flex items-center gap-1">
          <Sparkles size={11} className="text-amber-400" />
          <span>하트(❤️) 추천 순 실시간 정렬</span>
        </div>
        <span className="font-mono text-[9px] text-amber-400/60">PC 사이드바 뷰</span>
      </div>
    </aside>
  );
}
