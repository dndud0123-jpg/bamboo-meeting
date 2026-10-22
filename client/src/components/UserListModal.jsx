import React from 'react';
import CharacterAvatar from './CharacterAvatar';
import { Users, X, UserX, Shield } from 'lucide-react';

export default function UserListModal({
  isOpen,
  onClose,
  players = {},
  selfId,
  isAdmin,
  onKickUser
}) {
  if (!isOpen) return null;

  const playerList = Object.values(players || {});

  const handleKick = (player) => {
    if (!isAdmin) return;
    const confirmMessage = `[${player.nickname}] 님을 회의실에서 강제 퇴장(Kick)시키겠습니까?\n퇴장된 유저는 즉시 연결이 종료됩니다.`;
    if (window.confirm(confirmMessage)) {
      if (onKickUser) {
        onKickUser(player);
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs select-none"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-[#181a29] border-2 border-slate-700 shadow-2xl rounded-2xl p-5 text-white flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-700/80 mb-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Users size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-yellow-300 font-pixel">
                  회의 참여자 목록
                </h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-mono">
                  총 {playerList.length}명
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                현재 대나무숲 회의실에 접속 중인 플레이어입니다.
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

        {/* Admin Badge Banner if admin */}
        {isAdmin && (
          <div className="mb-3 p-2 bg-amber-500/15 border border-amber-500/30 rounded-xl flex items-center gap-2 text-xs text-amber-300 shrink-0 font-sans">
            <Shield size={14} className="text-amber-400 shrink-0" />
            <span>관리자 모드 활성: 다른 참여자를 강제 퇴장(Kick)할 수 있습니다.</span>
          </div>
        )}

        {/* Players List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[150px]">
          {playerList.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-500 py-8 font-sans">
              접속 중인 참여자가 없습니다.
            </div>
          ) : (
            playerList.map((player) => {
              const isSelf = player.id === selfId;

              return (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors ${
                    isSelf
                      ? 'bg-indigo-950/40 border-indigo-500/40'
                      : 'bg-[#10121d] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <CharacterAvatar charIndex={player.charIndex ?? 0} size="sm" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs sm:text-sm text-yellow-100 truncate max-w-[140px]">
                          {player.nickname}
                        </span>
                        {isSelf && (
                          <span className="bg-indigo-500/30 text-indigo-300 text-[10px] px-1.5 py-0.2 rounded font-sans font-bold border border-indigo-400/40">
                            나
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        ID: {player.id.substring(0, 8)}...
                      </span>
                    </div>
                  </div>

                  {/* Kick Action Button for Admin */}
                  {isAdmin && !isSelf && (
                    <button
                      type="button"
                      onClick={() => handleKick(player)}
                      className="px-2.5 py-1 bg-rose-600/80 hover:bg-rose-600 active:scale-95 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer font-sans shadow-xs shrink-0"
                      title={`${player.nickname} 강제 퇴장`}
                    >
                      <UserX size={13} />
                      <span>강퇴</span>
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-700/80 mt-3 shrink-0 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer font-sans"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
