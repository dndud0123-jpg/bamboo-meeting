import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Check, Smartphone, Wifi } from 'lucide-react';

export default function QRCodeModal({ isOpen, onClose, joinUrl }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-sm bg-[#1e1e2f] border-4 border-yellow-400 p-6 rounded-lg text-white pixel-box">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-400 hover:text-white p-1 rounded bg-[#2b2d42] border border-slate-600 cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-1.5 bg-yellow-500/20 text-yellow-300 text-xs px-2.5 py-1 rounded border border-yellow-500/40 font-bold mb-2">
            <Smartphone size={14} />
            모바일 즉시 접속 QR
          </div>
          <h2 className="text-lg font-bold text-slate-100">
            회의실 모바일 참여
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            스마트폰 기본 카메라로 비추면 바로 열립니다.
          </p>
        </div>

        {/* QR Code Container */}
        <div className="bg-white p-4 rounded-lg flex flex-col items-center justify-center mx-auto w-fit shadow-inner border-2 border-slate-700">
          <QRCodeSVG
            value={joinUrl}
            size={180}
            level="M"
            includeMargin={false}
          />
        </div>

        {/* URL Display & Copy */}
        <div className="mt-4 bg-[#12131d] border border-slate-700 rounded p-2.5 flex items-center justify-between gap-2">
          <div className="text-xs font-mono text-emerald-400 truncate select-all">
            {joinUrl}
          </div>
          <button
            onClick={handleCopy}
            className="shrink-0 flex items-center gap-1 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[11px] font-bold px-2 py-1.5 rounded cursor-pointer transition-colors"
          >
            {copied ? (
              <>
                <Check size={12} className="text-emerald-300" />
                복사됨
              </>
            ) : (
              <>
                <Copy size={12} />
                복사
              </>
            )}
          </button>
        </div>

        <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-400 bg-slate-800/40 p-2 rounded border border-slate-700/50">
          <Wifi size={14} className="text-sky-400 shrink-0" />
          <span>모바일 기기와 PC가 동일한 Wi-Fi 네트워크에 연결되어 있어야 합니다.</span>
        </div>
      </div>
    </div>
  );
}
