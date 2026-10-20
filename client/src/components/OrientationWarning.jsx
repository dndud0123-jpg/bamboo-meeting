import React, { useState, useEffect } from 'react';
import { RotateCw, Smartphone } from 'lucide-react';

export default function OrientationWarning() {
  const [isPortraitMobile, setIsPortraitMobile] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      // Check if viewport is taller than wide AND screen width is mobile/tablet size (< 768px)
      const isPortrait = window.innerHeight > window.innerWidth;
      const isMobileSize = window.innerWidth <= 850;
      setIsPortraitMobile(isPortrait && isMobileSize);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  if (!isPortraitMobile) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#0f1019]/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-white select-none">
      <div className="relative mb-6">
        <div className="w-20 h-20 bg-indigo-600/30 border-2 border-indigo-400 rounded-2xl flex items-center justify-center animate-pulse">
          <Smartphone size={44} className="text-yellow-300 rotate-90 transition-transform duration-500" />
        </div>
        <RotateCw size={24} className="text-sky-400 absolute -top-2 -right-2 animate-spin" />
      </div>

      <div className="inline-block bg-yellow-400/20 text-yellow-300 text-xs px-3 py-1 rounded-full border border-yellow-400/40 font-bold mb-3">
        LANDSCAPE MODE ONLY
      </div>

      <h2 className="text-xl font-bold text-yellow-300 mb-2">
        가로 모드로 회전해주세요
      </h2>

      <p className="text-sm text-slate-300 max-w-xs leading-relaxed mb-6 font-sans">
        원활한 회의 및 양손 조작(가상 패드 + 채팅)을 위해 스마트폰을 가로로 돌려주세요! 🔄
      </p>

      <div className="text-[11px] text-slate-500 bg-slate-800/60 px-4 py-2 rounded-lg border border-slate-700/60">
        💡 자동 회전 기능이 켜져 있는지 확인해 주세요.
      </div>
    </div>
  );
}
