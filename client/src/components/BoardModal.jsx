import React, { useState, useMemo } from 'react';
import StickyNote from './StickyNote';
import PostDetailModal from './PostDetailModal';
import { X, PenSquare, Sparkles, MessageSquare } from 'lucide-react';

export default function BoardModal({
  isOpen,
  onClose,
  posts = [],
  onLike,
  onDelete,
  onAdminDelete,
  onOpenCreate,
  currentUserId,
  isAdmin = false
}) {
  if (!isOpen) return null;

  const [selectedPost, setSelectedPost] = useState(null);

  // Sync selectedPost with latest state from posts
  const activePost = selectedPost
    ? ((Array.isArray(posts) && posts.find((p) => p.id === selectedPost.id)) || selectedPost)
    : null;

  // Ensure safe array handling and sort posts strictly in descending order of likes, then by newest
  const sortedPosts = useMemo(() => {
    const list = Array.isArray(posts) ? posts : [];
    return [...list].sort((a, b) => {
      const diff = (b.likes || 0) - (a.likes || 0);
      if (diff !== 0) return diff;
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
  }, [posts]);

  return (
    <>
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/75 backdrop-blur-sm select-none"
      onClick={onClose}
    >
      {/* Wooden Frame Cork Board (Optimized for both PC Wide & Mobile Viewports) */}
      <div
        className="relative w-full max-w-5xl h-[85vh] max-h-[85vh] flex flex-col rounded-2xl sm:rounded-3xl border-8 sm:border-[12px] md:border-[14px] border-[#53341b] shadow-2xl overflow-hidden bg-[#c89d68]"
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), inset 0 0 40px rgba(78, 46, 22, 0.45)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cork Pinboard Header Bar */}
        <div className="shrink-0 flex items-center justify-between p-3.5 sm:p-4 md:p-5 bg-[#422813]/95 border-b-2 sm:border-b-4 border-[#331c0a] text-amber-100 shadow-md">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-xl sm:text-2xl">📌</span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-pixel text-sm sm:text-lg font-bold text-amber-200 tracking-wider">
                  대나무숲 비밀 게시판
                </h2>
                <span className="bg-amber-500/20 text-amber-300 text-[10px] px-2 py-0.5 rounded-full border border-amber-400/30 font-sans">
                  총 {sortedPosts.length}개
                </span>
              </div>
              <p className="text-[11px] text-amber-300/80 font-sans hidden sm:block">
                익명으로 속마음을 나누고 하트(❤️)로 공감해주세요! 추천 1위는 상단에 고정됩니다.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenCreate}
              className="bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-bold px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl border-2 border-amber-200 shadow-lg flex items-center gap-1.5 text-xs sm:text-sm cursor-pointer transition-all font-sans"
            >
              <PenSquare size={15} />
              <span>새 글 쓰기</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl bg-black/40 hover:bg-black/60 text-amber-200 hover:text-white border border-amber-800/80 active:scale-95 transition-all cursor-pointer"
              aria-label="게시판 닫기"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Cork Surface Grid Area (Scrollable with Sticky Notes, Guaranteed min-height) */}
        <div
          className="flex-1 p-4 sm:p-6 overflow-y-auto min-h-[300px]"
          style={{
            backgroundImage: `radial-gradient(#b08754 1.5px, transparent 1.5px), radial-gradient(#d4ac7a 1px, transparent 1px)`,
            backgroundSize: '24px 24px, 12px 12px',
            backgroundPosition: '0 0, 6px 6px'
          }}
        >
          {sortedPosts.length === 0 ? (
            <div className="h-full min-h-[260px] flex flex-col items-center justify-center py-16 sm:py-20 text-center select-none">
              <div className="text-4xl sm:text-5xl mb-3 animate-bounce">📌</div>
              <p className="font-pixel font-bold text-base sm:text-lg text-amber-950">
                아직 등록된 이야기가 없습니다.
              </p>
              <p className="text-xs sm:text-sm text-amber-900/80 mt-1 font-sans">
                상단의 [새 글 쓰기] 버튼을 눌러 첫 번째 의견을 남겨보세요!
              </p>
              <button
                type="button"
                onClick={onOpenCreate}
                className="mt-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl border-2 border-amber-200 shadow-md active:scale-95 text-xs transition-transform cursor-pointer font-sans"
              >
                ✏️ 첫 번째 메모 남기기
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-max pb-6">
              {sortedPosts.map((post, idx) => (
                <StickyNote
                  key={post.id || `post_${idx}`}
                  post={post}
                  onLike={onLike}
                  onDelete={onDelete}
                  onAdminDelete={onAdminDelete}
                  onSelectPost={setSelectedPost}
                  currentUserId={currentUserId}
                  isAdmin={isAdmin}
                  rank={idx + 1}
                  index={idx}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer Notice Plank */}
        <div className="shrink-0 bg-[#422813] border-t-2 border-[#331c0a] px-4 py-2 flex items-center justify-between text-[11px] text-amber-300/70 font-sans">
          <div className="flex items-center gap-1.5">
            <Sparkles size={12} className="text-amber-400" />
            <span>하트(❤️) 추천이 많을수록 상단에 우선 노출됩니다.</span>
          </div>
          <span className="hidden sm:inline font-mono">실시간 동기화 완료</span>
        </div>
      </div>
    </div>
      {/* Post Detail Modal */}
      <PostDetailModal
        isOpen={Boolean(activePost)}
        post={activePost}
        onClose={() => setSelectedPost(null)}
        onLike={onLike}
        onDelete={onDelete}
        onAdminDelete={onAdminDelete}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
      />
    </>
  );
}
