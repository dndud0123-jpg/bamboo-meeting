import React, { useState, useEffect } from 'react';
import spriteSheetSrc from '../assets/characters.png';
import { getSpriteBgStyle, CHARACTERS_16 } from '../utils/spriteCoords';
import { makeSpriteTransparent, getTransparentSpriteUrl, loadProcessedSprite } from '../utils/spriteUtils';

export default function CharacterAvatar({
  charIndex = 0,
  size = 'md',
  className = '',
  showLabel = false
}) {
  const safeIndex = typeof charIndex === 'number' ? charIndex : (parseInt(charIndex, 10) || 0);
  const charMeta = CHARACTERS_16[safeIndex] || CHARACTERS_16[0];

  const [spriteUrl, setSpriteUrl] = useState(() => getTransparentSpriteUrl() || spriteSheetSrc);

  useEffect(() => {
    const cached = getTransparentSpriteUrl();
    if (cached) {
      setSpriteUrl(cached);
    } else {
      loadProcessedSprite(spriteSheetSrc).then(() => {
        const url = getTransparentSpriteUrl();
        if (url) setSpriteUrl(url);
      });
    }
  }, []);

  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const chosenSize = sizeClasses[size] || sizeClasses.md;
  const bgStyle = getSpriteBgStyle(safeIndex, spriteUrl);

  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      <div
        className={`${chosenSize} rounded-lg bg-slate-900/60 border border-slate-700/60 shadow-md shrink-0 pixelated transition-transform overflow-hidden`}
        style={bgStyle}
        title={charMeta.name}
        aria-label={charMeta.name}
      />
      {showLabel && (
        <span className="text-[10px] text-slate-300 font-sans truncate max-w-[70px]">
          {charMeta.name}
        </span>
      )}
    </div>
  );
}
