// 16-Character Sprite Sheet definition & coordinate calculators
// 4 columns x 4 rows = 16 characters

export const CHARACTERS_16 = [
  // Row 0
  { index: 0, name: '주황 원숭이', col: 0, row: 0, category: '원숭이' },
  { index: 1, name: '하얀 닭', col: 1, row: 0, category: '닭' },
  { index: 2, name: '황구 시바', col: 2, row: 0, category: '강아지' },
  { index: 3, name: '갈색 멧돼지', col: 3, row: 0, category: '멧돼지' },

  // Row 1
  { index: 4, name: '회색 요원', col: 0, row: 1, category: '사람' },
  { index: 5, name: '주황 닭', col: 1, row: 1, category: '닭' },
  { index: 6, name: '백구 멍이', col: 2, row: 1, category: '강아지' },
  { index: 7, name: '붉은 멧돼지', col: 3, row: 1, category: '멧돼지' },

  // Row 2
  { index: 8, name: '베이지 소년', col: 0, row: 2, category: '사람' },
  { index: 9, name: '흑계 오골계', col: 1, row: 2, category: '닭' },
  { index: 10, name: '진갈색 시바', col: 2, row: 2, category: '강아지' },
  { index: 11, name: '회색 멧돼지', col: 3, row: 2, category: '멧돼지' },

  // Row 3
  { index: 12, name: '빨간 모자', col: 0, row: 3, category: '사람' },
  { index: 13, name: '노랑 병아리', col: 1, row: 3, category: '병아리' },
  { index: 14, name: '흑구 멍이', col: 2, row: 3, category: '강아지' },
  { index: 15, name: '분홍 돼지', col: 3, row: 3, category: '돼지' }
];

// Calculate crop coordinates on the source sprite sheet image
export function getSpriteCoords(index, imgWidth = 372, imgHeight = 385) {
  const safeIndex = Math.max(0, Math.min(15, typeof index === 'number' ? index : 0));
  const col = safeIndex % 4;
  const row = Math.floor(safeIndex / 4);

  const sWidth = imgWidth / 4;
  const sHeight = imgHeight / 4;

  return {
    sx: col * sWidth,
    sy: row * sHeight,
    sWidth,
    sHeight,
    col,
    row
  };
}

// Calculate CSS background style for HTML UI avatars (400% 400% sprite sheet)
export function getSpriteBgStyle(index, spriteUrl) {
  const safeIndex = Math.max(0, Math.min(15, typeof index === 'number' ? index : 0));
  const col = safeIndex % 4;
  const row = Math.floor(safeIndex / 4);

  const posX = (col / 3) * 100;
  const posY = (row / 3) * 100;

  return {
    backgroundImage: `url(${spriteUrl})`,
    backgroundSize: '400% 400%',
    backgroundPosition: `${posX}% ${posY}%`,
    imageRendering: 'pixelated'
  };
}
