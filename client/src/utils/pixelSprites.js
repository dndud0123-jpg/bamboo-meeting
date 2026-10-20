// Pixel Art sprite generation and tile rendering for DotRoom
// 100% self-contained Canvas / SVG rendering - no external image dependencies!

export const CHARACTERS = [
  {
    id: 'red',
    name: '레드 (트레이너)',
    role: 'Product Manager',
    color: '#ef4444',
    hatColor: '#dc2626',
    clothesColor: '#2563eb',
    skinColor: '#ffd7a8',
    hairColor: '#37271e',
    accentColor: '#ffffff'
  },
  {
    id: 'green',
    name: '그린 (연구원)',
    role: 'AI Researcher',
    color: '#10b981',
    hatColor: '#059669',
    clothesColor: '#047857',
    skinColor: '#ffe4c4',
    hairColor: '#451a03',
    accentColor: '#a7f3d0'
  },
  {
    id: 'blue',
    name: '블루 (엔지니어)',
    role: 'Frontend Dev',
    color: '#3b82f6',
    hatColor: '#1d4ed8',
    clothesColor: '#1e3a8a',
    skinColor: '#ffd7a8',
    hairColor: '#1e293b',
    accentColor: '#67e8f9'
  },
  {
    id: 'yellow',
    name: '옐로우 (디자이너)',
    role: 'UI/UX Designer',
    color: '#f59e0b',
    hatColor: '#d97706',
    clothesColor: '#b45309',
    skinColor: '#ffe4c4',
    hairColor: '#78350f',
    accentColor: '#fef08a'
  }
];

// Draw a single 16x20 character on a given 2D context
export function drawCharacter(ctx, x, y, characterId, direction = 'down', frame = 0, scale = 2.5) {
  const charConfig = CHARACTERS.find(c => c.id === characterId) || CHARACTERS[0];
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));

  const pixelSize = scale;

  // Helper to draw a pixel block
  function px(gx, gy, w, h, fill) {
    ctx.fillStyle = fill;
    ctx.fillRect(gx * pixelSize, gy * pixelSize, w * pixelSize, h * pixelSize);
  }

  // Draw shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.beginPath();
  ctx.ellipse(8 * pixelSize, 18 * pixelSize, 7 * pixelSize, 3 * pixelSize, 0, 0, Math.PI * 2);
  ctx.fill();

  const isWalk = frame % 2 === 1;
  const legOffset = isWalk ? 1 : 0;

  // Head / Cap
  px(4, 2, 8, 2, charConfig.hatColor); // cap top
  px(3, 4, 10, 3, charConfig.hatColor); // cap main

  // Cap Visor based on direction
  if (direction === 'down') {
    px(4, 7, 8, 1, '#ffffff'); // cap logo
    px(3, 7, 10, 1, '#b91c1c'); // visor edge
  } else if (direction === 'left') {
    px(2, 6, 3, 2, '#b91c1c'); // left visor
  } else if (direction === 'right') {
    px(11, 6, 3, 2, '#b91c1c'); // right visor
  }

  // Face / Skin
  if (direction !== 'up') {
    px(4, 7, 8, 4, charConfig.skinColor);
    // Eyes
    if (direction === 'down') {
      px(5, 8, 2, 2, '#111827');
      px(9, 8, 2, 2, '#111827');
      // Eye shine
      px(5, 8, 1, 1, '#ffffff');
      px(9, 8, 1, 1, '#ffffff');
      // Cheeks blush
      px(4, 10, 1, 1, '#fca5a5');
      px(11, 10, 1, 1, '#fca5a5');
    } else if (direction === 'left') {
      px(4, 8, 2, 2, '#111827');
      px(4, 8, 1, 1, '#ffffff');
    } else if (direction === 'right') {
      px(10, 8, 2, 2, '#111827');
      px(11, 8, 1, 1, '#ffffff');
    }
  } else {
    // Back of head (hair)
    px(4, 7, 8, 4, charConfig.hairColor);
  }

  // Hair sides/back
  if (direction === 'down') {
    px(3, 6, 1, 4, charConfig.hairColor);
    px(12, 6, 1, 4, charConfig.hairColor);
  } else if (direction === 'left') {
    px(10, 5, 2, 5, charConfig.hairColor);
  } else if (direction === 'right') {
    px(4, 5, 2, 5, charConfig.hairColor);
  }

  // Torso / Jacket
  px(4, 11, 8, 4, charConfig.clothesColor);
  // Collar or inner shirt
  if (direction === 'down') {
    px(6, 11, 4, 2, charConfig.accentColor);
    px(7, 12, 2, 3, '#1e293b'); // zipper or tie
  } else if (direction === 'left') {
    px(4, 11, 2, 2, charConfig.accentColor);
  } else if (direction === 'right') {
    px(10, 11, 2, 2, charConfig.accentColor);
  }

  // Arms
  if (direction === 'down') {
    px(3, 11, 1, 3, charConfig.clothesColor);
    px(12, 11, 1, 3, charConfig.clothesColor);
    px(3, 14, 1, 1, charConfig.skinColor);
    px(12, 14, 1, 1, charConfig.skinColor);
  } else if (direction === 'left') {
    px(6 - legOffset, 11, 2, 4, charConfig.clothesColor);
    px(6 - legOffset, 14, 2, 1, charConfig.skinColor);
  } else if (direction === 'right') {
    px(8 + legOffset, 11, 2, 4, charConfig.clothesColor);
    px(8 + legOffset, 14, 2, 1, charConfig.skinColor);
  } else {
    // Up
    px(3, 11, 1, 3, charConfig.clothesColor);
    px(12, 11, 1, 3, charConfig.clothesColor);
    // backpack
    px(5, 10, 6, 4, '#ca8a04');
    px(6, 11, 4, 2, '#eab308');
  }

  // Pants
  px(5, 15, 6, 2, '#334155');

  // Shoes
  if (direction === 'down' || direction === 'up') {
    if (isWalk) {
      px(4, 16, 3, 2, '#dc2626');
      px(9, 17, 3, 2, '#dc2626');
    } else {
      px(4, 17, 3, 2, '#dc2626');
      px(9, 17, 3, 2, '#dc2626');
    }
  } else if (direction === 'left') {
    px(4 - legOffset, 17, 4, 2, '#dc2626');
    px(7 + legOffset, 16, 3, 2, '#991b1b');
  } else if (direction === 'right') {
    px(8 + legOffset, 17, 4, 2, '#dc2626');
    px(5 - legOffset, 16, 3, 2, '#991b1b');
  }

  ctx.restore();
}

// Generate SVG data URI for avatar badge display in chat and modals
export function getAvatarDataUrl(characterId) {
  const char = CHARACTERS.find(c => c.id === characterId) || CHARACTERS[0];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 16 16" style="image-rendering:pixelated">
    <rect width="16" height="16" rx="4" fill="#1e1e2f"/>
    <!-- Shadow -->
    <ellipse cx="8" cy="14" rx="5" ry="1.5" fill="rgba(0,0,0,0.3)"/>
    <!-- Cap -->
    <rect x="4" y="2" width="8" height="2" fill="${char.hatColor}"/>
    <rect x="3" y="4" width="10" height="3" fill="${char.hatColor}"/>
    <rect x="4" y="6" width="8" height="1" fill="#ffffff"/>
    <!-- Face -->
    <rect x="4" y="7" width="8" height="4" fill="${char.skinColor}"/>
    <!-- Eyes -->
    <rect x="5" y="8" width="2" height="2" fill="#111827"/>
    <rect x="9" y="8" width="2" height="2" fill="#111827"/>
    <rect x="5" y="8" width="1" height="1" fill="#ffffff"/>
    <rect x="9" y="8" width="1" height="1" fill="#ffffff"/>
    <!-- Body -->
    <rect x="4" y="11" width="8" height="3" fill="${char.clothesColor}"/>
    <rect x="6" y="11" width="4" height="2" fill="${char.accentColor}"/>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Map dimensions and tile constants
export const TILE_SIZE = 32;
export const MAP_COLS = 36;
export const MAP_ROWS = 24;
export const MAP_WIDTH = MAP_COLS * TILE_SIZE; // 1152px
export const MAP_HEIGHT = MAP_ROWS * TILE_SIZE; // 768px

// Conference Room bounding box on map
export const CONFERENCE_ZONE = {
  x: 10 * TILE_SIZE,
  y: 5 * TILE_SIZE,
  w: 16 * TILE_SIZE,
  h: 14 * TILE_SIZE
};

// Conference Table bounding box (obstacle)
export const TABLE_ZONE = {
  x: 13 * TILE_SIZE,
  y: 9 * TILE_SIZE,
  w: 10 * TILE_SIZE,
  h: 5 * TILE_SIZE
};

// Presentation Screen (Top of conference room)
export const SCREEN_ZONE = {
  x: 14 * TILE_SIZE,
  y: 5.5 * TILE_SIZE,
  w: 8 * TILE_SIZE,
  h: 2.2 * TILE_SIZE
};
