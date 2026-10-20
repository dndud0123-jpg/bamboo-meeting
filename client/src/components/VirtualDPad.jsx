import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

export default function VirtualDPad({ onDirectionChange }) {
  const [activeDir, setActiveDir] = useState(null);
  const [thumbPos, setThumbPos] = useState({ x: 0, y: 0 });
  const activeDirRef = useRef(null);
  const touchIdRef = useRef(null);
  const containerRef = useRef(null);
  const isMouseDownRef = useRef(false);

  const setDir = useCallback((dir) => {
    if (activeDirRef.current !== dir) {
      activeDirRef.current = dir;
      setActiveDir(dir);
      if (onDirectionChange) {
        onDirectionChange(dir);
      }
    }
  }, [onDirectionChange]);

  const clearDir = useCallback(() => {
    if (activeDirRef.current !== null) {
      activeDirRef.current = null;
      setActiveDir(null);
      setThumbPos({ x: 0, y: 0 });
      if (onDirectionChange) {
        onDirectionChange(null);
      }
    } else {
      setThumbPos({ x: 0, y: 0 });
    }
  }, [onDirectionChange]);

  // Determine direction from touch or mouse coordinates
  const processCoords = useCallback((clientX, clientY) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    const dist = Math.hypot(dx, dy);

    // Dead zone at center: 7px
    if (dist < 7) {
      clearDir();
      return;
    }

    // Limit thumb visual offset
    const maxRadius = rect.width / 2 - 14;
    const clampedDist = Math.min(dist, maxRadius);
    setThumbPos({
      x: (dx / dist) * clampedDist,
      y: (dy / dist) * clampedDist
    });

    // 8-direction sector calculation (45 deg per sector)
    const angle = Math.atan2(dy, dx);
    const deg = (angle * (180 / Math.PI) + 360) % 360;

    let dir = null;
    if (deg >= 337.5 || deg < 22.5) {
      dir = 'right';
    } else if (deg >= 22.5 && deg < 67.5) {
      dir = 'down-right';
    } else if (deg >= 67.5 && deg < 112.5) {
      dir = 'down';
    } else if (deg >= 112.5 && deg < 157.5) {
      dir = 'down-left';
    } else if (deg >= 157.5 && deg < 202.5) {
      dir = 'left';
    } else if (deg >= 202.5 && deg < 247.5) {
      dir = 'up-left';
    } else if (deg >= 247.5 && deg < 292.5) {
      dir = 'up';
    } else if (deg >= 292.5 && deg < 337.5) {
      dir = 'up-right';
    }

    setDir(dir);
  }, [clearDir, setDir]);

  // Native non-passive touch listeners to completely prevent browser long-press gesture cancellation
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onTouchStart = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (touchIdRef.current === null && e.changedTouches.length > 0) {
        const touch = e.changedTouches[0];
        touchIdRef.current = touch.identifier;
        processCoords(touch.clientX, touch.clientY);
      }
    };

    const onTouchMove = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (touchIdRef.current !== null) {
        for (let i = 0; i < e.touches.length; i++) {
          if (e.touches[i].identifier === touchIdRef.current) {
            processCoords(e.touches[i].clientX, e.touches[i].clientY);
            break;
          }
        }
      }
    };

    const onTouchEnd = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (touchIdRef.current !== null) {
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === touchIdRef.current) {
            touchIdRef.current = null;
            clearDir();
            break;
          }
        }
      }
    };

    const onTouchCancel = (e) => {
      e.preventDefault();
      e.stopPropagation();
      // Guard against spurious OS touchcancel during long press
      if (touchIdRef.current !== null) {
        let stillActive = false;
        for (let i = 0; i < e.touches.length; i++) {
          if (e.touches[i].identifier === touchIdRef.current) {
            stillActive = true;
            break;
          }
        }
        // Only release if the touch is genuinely gone from active touches
        if (!stillActive) {
          let cancelledOurs = false;
          for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === touchIdRef.current) {
              cancelledOurs = true;
              break;
            }
          }
          if (cancelledOurs) {
            touchIdRef.current = null;
            clearDir();
          }
        }
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: false });
    el.addEventListener('touchcancel', onTouchCancel, { passive: false });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchCancel);
    };
  }, [processCoords, clearDir]);

  // Mouse handlers for desktop dev testing
  const handleMouseDown = (e) => {
    isMouseDownRef.current = true;
    processCoords(e.clientX, e.clientY);
  };

  const handleMouseMove = (e) => {
    if (isMouseDownRef.current) {
      processCoords(e.clientX, e.clientY);
    }
  };

  const handleMouseUp = () => {
    if (isMouseDownRef.current) {
      isMouseDownRef.current = false;
      clearDir();
    }
  };

  // Safe window blur / mouseup handling
  useEffect(() => {
    const handleGlobalVisibility = () => {
      if (document.hidden) {
        touchIdRef.current = null;
        isMouseDownRef.current = false;
        clearDir();
      }
    };
    const handleGlobalMouseUp = () => {
      if (isMouseDownRef.current) {
        isMouseDownRef.current = false;
        clearDir();
      }
    };
    window.addEventListener('visibilitychange', handleGlobalVisibility);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('visibilitychange', handleGlobalVisibility);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [clearDir]);

  // Highlight status for each cardinal arm
  const isUp = activeDir === 'up' || activeDir === 'up-left' || activeDir === 'up-right';
  const isDown = activeDir === 'down' || activeDir === 'down-left' || activeDir === 'down-right';
  const isLeft = activeDir === 'left' || activeDir === 'up-left' || activeDir === 'down-left';
  const isRight = activeDir === 'right' || activeDir === 'up-right' || activeDir === 'down-right';

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }}
      className="no-callout relative w-30 h-30 sm:w-34 sm:h-34 rounded-full bg-slate-950/60 backdrop-blur-md border border-white/20 shadow-2xl flex items-center justify-center select-none touch-none cursor-pointer"
      style={{
        touchAction: 'none',
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent'
      }}
      aria-label="가상 8방향 D-Pad"
    >
      {/* Visual Directional Arms */}
      {/* UP ARM */}
      <div
        className={`absolute top-1.5 left-1/2 -translate-x-1/2 w-8 h-9 rounded-t-lg border flex items-center justify-center transition-all pointer-events-none ${
          isUp
            ? 'bg-amber-400 border-amber-300 text-slate-950 scale-95 shadow-inner'
            : 'bg-white/10 border-white/20 text-white/80'
        }`}
      >
        <ChevronUp size={20} className="stroke-[3]" />
      </div>

      {/* DOWN ARM */}
      <div
        className={`absolute bottom-1.5 left-1/2 -translate-x-1/2 w-8 h-9 rounded-b-lg border flex items-center justify-center transition-all pointer-events-none ${
          isDown
            ? 'bg-amber-400 border-amber-300 text-slate-950 scale-95 shadow-inner'
            : 'bg-white/10 border-white/20 text-white/80'
        }`}
      >
        <ChevronDown size={20} className="stroke-[3]" />
      </div>

      {/* LEFT ARM */}
      <div
        className={`absolute left-1.5 top-1/2 -translate-y-1/2 w-9 h-8 rounded-l-lg border flex items-center justify-center transition-all pointer-events-none ${
          isLeft
            ? 'bg-amber-400 border-amber-300 text-slate-950 scale-95 shadow-inner'
            : 'bg-white/10 border-white/20 text-white/80'
        }`}
      >
        <ChevronLeft size={20} className="stroke-[3]" />
      </div>

      {/* RIGHT ARM */}
      <div
        className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-8 rounded-r-lg border flex items-center justify-center transition-all pointer-events-none ${
          isRight
            ? 'bg-amber-400 border-amber-300 text-slate-950 scale-95 shadow-inner'
            : 'bg-white/10 border-white/20 text-white/80'
        }`}
      >
        <ChevronRight size={20} className="stroke-[3]" />
      </div>

      {/* Diagonal Corner Guides */}
      <div className="absolute inset-0 pointer-events-none">
        <span className={`absolute top-3.5 right-3.5 w-1.5 h-1.5 rounded-full transition-colors ${activeDir === 'up-right' ? 'bg-amber-300 scale-125' : 'bg-white/15'}`} />
        <span className={`absolute bottom-3.5 right-3.5 w-1.5 h-1.5 rounded-full transition-colors ${activeDir === 'down-right' ? 'bg-amber-300 scale-125' : 'bg-white/15'}`} />
        <span className={`absolute bottom-3.5 left-3.5 w-1.5 h-1.5 rounded-full transition-colors ${activeDir === 'down-left' ? 'bg-amber-300 scale-125' : 'bg-white/15'}`} />
        <span className={`absolute top-3.5 left-3.5 w-1.5 h-1.5 rounded-full transition-colors ${activeDir === 'up-left' ? 'bg-amber-300 scale-125' : 'bg-white/15'}`} />
      </div>

      {/* Center Analog Thumb Indicator (Tracks thumb slide position) */}
      <div
        className="w-7 h-7 rounded-full bg-slate-900/90 border-2 border-white/40 shadow-lg flex items-center justify-center pointer-events-none transition-transform duration-75"
        style={{
          transform: `translate(${thumbPos.x}px, ${thumbPos.y}px)`
        }}
      >
        <div className={`w-2.5 h-2.5 rounded-full transition-colors ${activeDir ? 'bg-amber-400 shadow-xs shadow-amber-400' : 'bg-white/40'}`} />
      </div>
    </div>
  );
}
