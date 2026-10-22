import React from 'react';
import GameCanvas from './GameCanvas';
import OverlayControls from './OverlayControls';
import CharacterAvatar from './CharacterAvatar';
import MobileTopChatHud from './MobileTopChatHud';
import MobileInputBar from './MobileInputBar';

export default function TopGameView({
  selfId,
  players,
  myProfile,
  messages = [],
  onlineCount = 1,
  onSendMessage,
  onPlayerMove,
  onPlayerJump,
  virtualDirection,
  jumpSignal,
  remoteJumpTrigger,
  onDirectionChange,
  onTriggerJump,
  onSendReaction,
  onOpenQR,
  onOpenBoard,
  isModalOpen
}) {
  return (
    <div
      className="no-callout relative flex-1 w-full h-full min-h-0 overflow-hidden bg-slate-950 select-none"
      style={{ touchAction: 'none', WebkitTouchCallout: 'none' }}
    >
      {/* 1. Fullscreen 2D Canvas Engine (100% Fullscreen on Mobile & Full-height on PC) */}
      <GameCanvas
        selfId={selfId}
        players={players}
        myProfile={myProfile}
        onPlayerMove={onPlayerMove}
        onPlayerJump={onPlayerJump}
        virtualDirection={virtualDirection}
        jumpSignal={jumpSignal}
        remoteJumpTrigger={remoteJumpTrigger}
        onOpenBoard={onOpenBoard}
        isModalOpen={isModalOpen}
      />

      {/* 2. Mobile View: Top 20~22% Semi-Transparent Chat Feed Overlay (md:hidden) */}
      <MobileTopChatHud
        messages={messages}
        onlineCount={onlineCount}
        myProfile={myProfile}
        onOpenBoard={onOpenBoard}
        onOpenQR={onOpenQR}
      />

      {/* 3. Mobile View: On-Screen Multi-Touch Controls (md:hidden, D-Pad left, Jump/Emojis right at bottom-16) */}
      <OverlayControls
        onDirectionChange={onDirectionChange}
        onTriggerJump={onTriggerJump}
        onSendReaction={onSendReaction}
      />

      {/* 4. Mobile View: Bottom Capsule Chat Input Bar (md:hidden, Lifts up dynamically on keyboard) */}
      <MobileInputBar
        onSendMessage={onSendMessage}
        onSendReaction={onSendReaction}
      />

      {/* 5. Desktop View: Top-left Status Badge (md: and above only) */}
      <div className="hidden md:flex absolute top-3 left-3 z-20 pointer-events-auto items-center gap-2">
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-2 text-xs text-white">
          <span className="font-pixel text-yellow-400 font-bold tracking-wider text-sm whitespace-nowrap">
            🎋 놀러와요, 대나무숲
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-300 font-sans">익명 소통 회의실</span>
          {myProfile && (
            <div className="flex items-center gap-1.5 bg-[#242744] px-2 py-0.5 rounded border border-amber-500/30">
              <CharacterAvatar charIndex={myProfile.charIndex} size="xs" />
              <span className="text-amber-300 font-bold text-[11px] truncate max-w-[120px]">
                {myProfile.nickname}
              </span>
            </div>
          )}
        </div>

        {/* Desktop Keyboard Controls Help */}
        <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-xs border border-slate-800 px-2.5 py-1 rounded-xl text-[11px] text-slate-400 font-mono">
          <span>🎮 [방향키/WASD] 이동</span>
          <span className="text-slate-600">•</span>
          <span>[Space] 점프 / 게시판</span>
        </div>
      </div>

      {/* 6. Desktop View: Top-right Notice Board Button (md: and above only) */}
      <div className="hidden md:flex absolute top-3 right-3 z-20 pointer-events-auto items-center gap-2">
        {onOpenBoard && (
          <button
            type="button"
            onClick={onOpenBoard}
            className="flex items-center gap-1.5 text-xs font-pixel font-bold bg-[#3d220f]/90 hover:bg-[#53341b] active:scale-95 text-[#fef08a] px-3.5 py-1.5 rounded-xl border border-[#b45309]/80 cursor-pointer shadow-lg transition-all"
            aria-label="비밀 게시판 열기"
          >
            <span className="text-sm">📜</span>
            <span className="tracking-wide">비밀 게시판</span>
          </button>
        )}
      </div>
    </div>
  );
}
