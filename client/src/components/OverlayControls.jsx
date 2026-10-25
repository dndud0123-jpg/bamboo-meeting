import React from 'react';
import VirtualDPad from './VirtualDPad';

export default function OverlayControls({
  onDirectionChange,
  onTriggerJump,
  onSendReaction
}) {
  return (
    <div
      className="no-callout absolute inset-0 pointer-events-none z-20 select-none touch-none md:hidden"
      style={{
        touchAction: 'none',
        WebkitTouchCallout: 'none',
        WebkitTapHighlightColor: 'transparent',
        WebkitUserSelect: 'none',
        userSelect: 'none'
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        return false;
      }}
    >
      {/* Left Section: Multi-Touch 8-Way Virtual D-Pad (Comfortable bottom-6 spacing) */}
      <div className="absolute bottom-6 sm:bottom-8 left-3 sm:left-4 z-30 pointer-events-auto select-none touch-none">
        <VirtualDPad onDirectionChange={onDirectionChange} />
      </div>

      {/* Right Section: Multi-Touch Independent Action Buttons (Comfortable bottom-6 spacing) */}
      <div className="absolute bottom-6 sm:bottom-8 right-3 sm:right-4 z-30 pointer-events-auto flex items-end gap-2 select-none touch-none">
        {/* 3 Emoji Buttons */}
        <div className="flex flex-col gap-1.5 bg-slate-950/60 backdrop-blur-md p-1.5 rounded-2xl border border-white/20 shadow-2xl">
          <button
            type="button"
            onTouchStart={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSendReaction('👍');
            }}
            onPointerDown={(e) => {
              if (e.pointerType === 'mouse') {
                e.preventDefault();
                onSendReaction('👍');
              }
            }}
            onContextMenu={(e) => e.preventDefault()}
            className="no-callout w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 active:scale-90 border border-emerald-400/40 flex items-center justify-center text-sm shadow-sm cursor-pointer transition-transform"
            style={{ touchAction: 'none', WebkitTouchCallout: 'none', WebkitTapHighlightColor: 'transparent' }}
            title="따봉"
          >
            👍
          </button>
          <button
            type="button"
            onTouchStart={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSendReaction('❤️');
            }}
            onPointerDown={(e) => {
              if (e.pointerType === 'mouse') {
                e.preventDefault();
                onSendReaction('❤️');
              }
            }}
            onContextMenu={(e) => e.preventDefault()}
            className="no-callout w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 active:scale-90 border border-rose-400/40 flex items-center justify-center text-sm shadow-sm cursor-pointer transition-transform"
            style={{ touchAction: 'none', WebkitTouchCallout: 'none', WebkitTapHighlightColor: 'transparent' }}
            title="하트"
          >
            ❤️
          </button>
          <button
            type="button"
            onTouchStart={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSendReaction('😭');
            }}
            onPointerDown={(e) => {
              if (e.pointerType === 'mouse') {
                e.preventDefault();
                onSendReaction('😭');
              }
            }}
            onContextMenu={(e) => e.preventDefault()}
            className="no-callout w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 active:scale-90 border border-amber-400/40 flex items-center justify-center text-sm shadow-sm cursor-pointer transition-transform"
            style={{ touchAction: 'none', WebkitTouchCallout: 'none', WebkitTapHighlightColor: 'transparent' }}
            title="눈물"
          >
            😭
          </button>
        </div>

        {/* Big Jump Button (Independent touch session) */}
        <button
          type="button"
          onTouchStart={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onTriggerJump) onTriggerJump();
          }}
          onPointerDown={(e) => {
            if (e.pointerType === 'mouse') {
              e.preventDefault();
              if (onTriggerJump) onTriggerJump();
            }
          }}
          onContextMenu={(e) => e.preventDefault()}
          className="no-callout w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-emerald-600/50 hover:bg-emerald-600/70 active:scale-90 border-2 border-emerald-400/60 backdrop-blur-md text-white flex flex-col items-center justify-center shadow-2xl cursor-pointer transition-transform select-none"
          style={{ touchAction: 'none', WebkitTouchCallout: 'none', WebkitTapHighlightColor: 'transparent' }}
          title="점프 (Space)"
        >
          <span className="text-xl leading-none">🦘</span>
          <span className="text-[10px] font-bold font-sans mt-0.5 tracking-tight text-emerald-200">점프</span>
        </button>
      </div>
    </div>
  );
}
