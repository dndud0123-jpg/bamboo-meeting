import React, { useState, useEffect } from 'react';
import GameCanvas from './GameCanvas';
import OverlayControls from './OverlayControls';
import CharacterAvatar from './CharacterAvatar';
import { QrCode } from 'lucide-react';

export default function TopGameView({
  selfId,
  players,
  myProfile,
  onPlayerMove,
  onPlayerJump,
  virtualDirection,
  jumpSignal,
  remoteJumpTrigger,
  onDirectionChange,
  onTriggerJump,
  onSendReaction,
  onOpenQR
}) {
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return false;
  });

  // Capture initial window height for mobile portrait mode (50%)
  // This prevents the canvas from shrinking/squashing when the mobile virtual keyboard opens
  const [mobileHeight, setMobileHeight] = useState(() => {
    if (typeof window !== 'undefined') {
      return Math.round(window.innerHeight * 0.5);
    }
    return 360;
  });

  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 768;
      setIsDesktop(desktop);

      if (!desktop) {
        if (window.visualViewport) {
          const isKeyboardOpen = window.visualViewport.height < window.innerHeight * 0.75;
          if (!isKeyboardOpen) {
            setMobileHeight(Math.round(window.innerHeight * 0.5));
          }
        } else {
          setMobileHeight(Math.round(window.innerHeight * 0.5));
        }
      }
    };

    window.addEventListener('orientationchange', handleResize);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('orientationchange', handleResize);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div
      className={`no-callout relative w-full overflow-hidden bg-slate-950 select-none ${
        isDesktop
          ? 'flex-1 h-full min-h-0 max-h-none'
          : 'flex-none'
      }`}
      style={
        isDesktop
          ? { touchAction: 'none', WebkitTouchCallout: 'none' }
          : {
              height: `${mobileHeight}px`,
              minHeight: `${mobileHeight}px`,
              maxHeight: `${mobileHeight}px`,
              touchAction: 'none',
              WebkitTouchCallout: 'none'
            }
      }
    >
      {/* 1. Fullscreen 2D Canvas Engine */}
      <GameCanvas
        selfId={selfId}
        players={players}
        myProfile={myProfile}
        onPlayerMove={onPlayerMove}
        onPlayerJump={onPlayerJump}
        virtualDirection={virtualDirection}
        jumpSignal={jumpSignal}
        remoteJumpTrigger={remoteJumpTrigger}
      />

      {/* 2. Top-left Status Badge */}
      <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 z-20 pointer-events-auto flex items-center gap-2">
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl shadow-lg flex items-center gap-1.5 sm:gap-2 text-xs text-white">
          <span className="font-pixel text-yellow-400 font-bold tracking-wider text-xs sm:text-sm whitespace-nowrap">
            🎋 놀러와요, 대나무숲
          </span>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <span className="text-slate-300 hidden sm:inline font-sans">익명 소통 회의실</span>
          {myProfile && (
            <div className="flex items-center gap-1 sm:gap-1.5 bg-[#242744] px-1.5 sm:px-2 py-0.5 rounded border border-amber-500/30">
              <CharacterAvatar charIndex={myProfile.charIndex} size="xs" />
              <span className="text-amber-300 font-bold text-[11px] truncate max-w-[80px] sm:max-w-[120px]">
                {myProfile.nickname}
              </span>
            </div>
          )}
        </div>

        {/* Desktop Keyboard Controls Help */}
        <div className="hidden md:flex items-center gap-2 bg-slate-900/80 backdrop-blur-xs border border-slate-800 px-2.5 py-1 rounded-xl text-[11px] text-slate-400 font-mono">
          <span>🎮 [방향키/WASD] 이동</span>
          <span className="text-slate-600">•</span>
          <span>[Space] 점프</span>
        </div>
      </div>

      {/* 3. Top-right QR Code Button (Mobile Only; Desktop uses ChatSidebar QR) */}
      {onOpenQR && (
        <div className="absolute top-2.5 right-2.5 z-20 pointer-events-auto md:hidden">
          <button
            type="button"
            onClick={onOpenQR}
            className="flex items-center gap-1 text-[11px] font-bold bg-slate-900/90 hover:bg-slate-800 active:scale-95 text-yellow-300 px-2.5 py-1 rounded-lg border border-yellow-500/40 cursor-pointer shadow-md"
            aria-label="QR 코드 초대"
          >
            <QrCode size={13} />
            <span className="font-sans">QR 초대</span>
          </button>
        </div>
      )}

      {/* 4. Semi-transparent Overlay Controls (Mobile Only; md:hidden inside component) */}
      <OverlayControls
        onDirectionChange={onDirectionChange}
        onTriggerJump={onTriggerJump}
        onSendReaction={onSendReaction}
      />
    </div>
  );
}
