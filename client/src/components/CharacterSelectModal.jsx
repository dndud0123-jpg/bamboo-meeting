import React, { useState, useEffect } from 'react';
import { CHARACTERS_16, getSpriteBgStyle } from '../utils/spriteCoords';
import { makeSpriteTransparent, getTransparentSpriteUrl } from '../utils/spriteUtils';
import spriteSheetSrc from '../assets/characters.png';
import { User, Sparkles, ArrowRight, Check } from 'lucide-react';

const ADJECTIVES = [
  '칼퇴하는', '열일하는', '커피마시는', '달리는', '산책하는',
  '생각많은', '발표하는', '집중하는', '당충전중인', '회의마스터',
  '조용한', '활기찬', '미소짓는', '꿈꾸는', '노래하는',
  '점심고민중인', '퇴근희망', '호기심많은', '친절한', '든든한'
];

const NOUNS = [
  '판다', '토끼', '펭귄', '다람쥐', '고양이',
  '강아지', '수달', '너구리', '사슴', '알파카',
  '코알라', '북극곰', '뱁새', '쿼카', '바다표범',
  '여우', '햄스터', '비버', '돌고래', '올빼미'
];

export const generateRandomNickname = () => {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${adj} ${noun}`;
};

export default function CharacterSelectModal({ onJoin }) {
  const [nickname, setNickname] = useState('');
  const [selectedCharIndex, setSelectedCharIndex] = useState(2); // default: 2 (황구 시바)
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [spriteUrl, setSpriteUrl] = useState(() => getTransparentSpriteUrl() || spriteSheetSrc);

  useEffect(() => {
    const cached = getTransparentSpriteUrl();
    if (cached) {
      setSpriteUrl(cached);
    } else {
      const img = new Image();
      img.src = spriteSheetSrc;
      img.onload = () => {
        makeSpriteTransparent(img);
        const url = getTransparentSpriteUrl();
        if (url) setSpriteUrl(url);
      };
    }
  }, []);

  const handleRandomNickname = () => {
    const randomName = generateRandomNickname();
    setNickname(randomName);
    if (error) setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = nickname.trim();
    if (!trimmed) {
      setError('닉네임을 입력해 주세요.');
      return;
    }
    if (trimmed.length > 12) {
      setError('닉네임은 최대 12자까지 가능합니다.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    onJoin(
      {
        nickname: trimmed,
        charIndex: selectedCharIndex
      },
      (response) => {
        setIsSubmitting(false);
        if (response && !response.success) {
          setError(response.message || '이미 사용 중인 닉네임입니다. 다른 닉네임을 입력해 주세요.');
        } else {
          setError('');
        }
      }
    );
  };

  const selectedChar = CHARACTERS_16[selectedCharIndex] || CHARACTERS_16[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4 select-none">
      <div className="relative w-full max-w-lg bg-[#181a29] border-4 border-indigo-600 shadow-2xl p-5 sm:p-6 text-white rounded-xl pixel-box">
        {/* Retro Header */}
        <div className="text-center mb-4">
          <div className="inline-block bg-indigo-600 px-3 py-1 text-[10px] tracking-widest font-bold uppercase rounded mb-1.5 border border-indigo-400">
            16-CHARACTER RETRO MEETING
          </div>
          <h1 className="font-pixel text-xl sm:text-2xl font-black tracking-wider text-yellow-300 drop-shadow-md">
            🎋 놀러와요, 대나무숲 입장
          </h1>
          <p className="text-xs text-slate-300 mt-1 font-sans">
            16종 도트 캐릭터 중 마음에 드는 아바타를 선택하세요!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nickname Input with Random Dice Button */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <User size={14} className="text-sky-400" />
                참석자 닉네임
              </span>
              <span className="text-[11px] text-amber-300/80 font-normal">
                🎲 주사위를 누르면 자동 추천
              </span>
            </label>
            <div className="relative w-full">
              <input
                type="text"
                value={nickname}
                onChange={(e) => {
                  setNickname(e.target.value);
                  if (error) setError('');
                }}
                placeholder="닉네임 입력 (최대 12자)"
                maxLength={12}
                autoFocus
                className={`w-full bg-[#10121d] border-2 ${
                  error ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-700 focus:border-yellow-400'
                } focus:outline-hidden px-3.5 py-2.5 pr-12 text-xs sm:text-sm text-yellow-100 rounded-xl tracking-wider placeholder:text-slate-500 font-sans transition-colors shadow-inner`}
              />
              <button
                type="button"
                onClick={handleRandomNickname}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-amber-300 hover:text-amber-200 hover:bg-slate-700/60 rounded-lg transition-transform active:rotate-180 duration-200 cursor-pointer"
                title="랜덤 닉네임 추천"
              >
                <span className="text-lg select-none leading-none">🎲</span>
              </button>
            </div>
            {error && (
              <p className="text-xs sm:text-sm font-bold text-rose-500 mt-1.5 animate-pulse flex items-center gap-1 font-sans">
                <span>⚠️</span>
                <span>{error}</span>
              </p>
            )}
          </div>

          {/* 16-Character Selection (4x4 Grid) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Sparkles size={14} className="text-yellow-400" />
                아바타 선택 (16종)
              </label>
              <span className="text-[11px] text-amber-300 font-bold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/40 font-sans">
                선택: {selectedChar.name}
              </span>
            </div>

            {/* 4x4 Grid Container */}
            <div className="grid grid-cols-4 gap-2 bg-[#10121d] p-2.5 rounded-xl border border-slate-700/80 max-h-56 overflow-y-auto">
              {CHARACTERS_16.map((char) => {
                const isSelected = selectedCharIndex === char.index;
                const bgStyle = getSpriteBgStyle(char.index, spriteUrl);

                return (
                  <button
                    key={char.index}
                    type="button"
                    onClick={() => setSelectedCharIndex(char.index)}
                    className={`relative flex flex-col items-center justify-center p-1.5 rounded-lg border-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-yellow-400 bg-yellow-400/20 scale-105 shadow-md shadow-yellow-500/20'
                        : 'border-slate-700/60 bg-[#1e2035] hover:border-slate-500 hover:bg-[#282b47] opacity-80 hover:opacity-100'
                    }`}
                  >
                    {/* Character Sprite Box */}
                    <div
                      className="w-10 h-10 sm:w-11 sm:h-11 rounded pixelated"
                      style={bgStyle}
                    />
                    <span className="text-[9px] text-slate-300 mt-1 font-sans truncate w-full text-center">
                      {char.name.split(' ')[0]}
                    </span>

                    {isSelected && (
                      <div className="absolute top-1 right-1 w-3.5 h-3.5 bg-yellow-400 text-slate-900 rounded-full flex items-center justify-center">
                        <Check size={10} className="stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] disabled:opacity-50 text-white font-bold py-2.5 sm:py-3 px-4 rounded-lg border-2 border-emerald-400 flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all text-xs sm:text-sm tracking-wider"
          >
            {isSubmitting ? (
              <span>입장 확인 중...</span>
            ) : (
              <>
                <span>회의실 입장하기</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export { CharacterSelectModal };
