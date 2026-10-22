import React, { useState } from 'react';
import { Shield, Lock, X, Check, LogOut, KeyRound } from 'lucide-react';

export default function AdminAuthModal({
  isOpen,
  onClose,
  isAdmin,
  onLogin,
  onLogout
}) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('비밀번호를 입력해 주세요.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    onLogin(password.trim(), (response) => {
      setIsSubmitting(false);
      if (response && response.success) {
        setPassword('');
        setError('');
        onClose();
      } else {
        setError(response?.message || '비밀번호가 올바르지 않습니다.');
      }
    });
  };

  const handleLogout = () => {
    if (onLogout) onLogout();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs select-none"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm bg-[#181a29] border-2 border-indigo-500/80 shadow-2xl rounded-2xl p-5 sm:p-6 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-700/80 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Shield size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-yellow-300 font-pixel">
                마스터 관리자
              </h3>
              <p className="text-[11px] text-slate-400 font-sans">
                {isAdmin ? '관리자 권한 활성화됨' : '운영자 전용 제어 모드'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {isAdmin ? (
          /* Already Admin View */
          <div className="space-y-4">
            <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-3.5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Check size={18} />
              </div>
              <div className="text-xs">
                <p className="font-bold text-emerald-300">관리자 인증 완료</p>
                <p className="text-slate-300 text-[11px] mt-0.5 font-sans">
                  게시글 강제 삭제, 채팅 삭제 및 유저 강퇴 권한이 부여되어 있습니다.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full py-2.5 px-4 bg-rose-600/90 hover:bg-rose-700 active:scale-98 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer font-sans shadow-md"
            >
              <LogOut size={14} />
              <span>관리자 권한 해제 (로그아웃)</span>
            </button>
          </div>
        ) : (
          /* Login Form View */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <KeyRound size={13} className="text-amber-400" />
                마스터 비밀번호
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="관리자 암호 입력"
                  autoFocus
                  className="w-full bg-[#10121d] border-2 border-slate-700 focus:border-amber-400 focus:outline-hidden px-3.5 py-2.5 text-xs sm:text-sm text-yellow-100 rounded-xl placeholder:text-slate-500 transition-colors font-sans"
                />
              </div>
              {error && (
                <p className="text-xs font-bold text-rose-500 mt-1.5 animate-pulse flex items-center gap-1 font-sans">
                  <span>⚠️</span>
                  <span>{error}</span>
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium text-xs transition-colors cursor-pointer font-sans"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !password.trim()}
                className="flex-1 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 active:scale-98 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer font-sans shadow-md"
              >
                <Lock size={13} />
                <span>{isSubmitting ? '인증 중...' : '관리자 승격'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
