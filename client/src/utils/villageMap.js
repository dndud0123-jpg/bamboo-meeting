// Village Map constants, collision zones, and renderer for Littleroot Town

export const MAP_BASE_WIDTH = 610;
export const MAP_BASE_HEIGHT = 559;
export const MAP_SCALE = 2.0;

export const MAP_WIDTH = MAP_BASE_WIDTH * MAP_SCALE; // 1220px
export const MAP_HEIGHT = MAP_BASE_HEIGHT * MAP_SCALE; // 1118px

// Scaled obstacle boxes based on 610x559 original image
export const COLLISION_BOXES = [
  // 1. Top-left red roof house
  { x: 105 * MAP_SCALE, y: 90 * MAP_SCALE, w: 140 * MAP_SCALE, h: 125 * MAP_SCALE },

  // 2. Top-right red roof house
  { x: 370 * MAP_SCALE, y: 90 * MAP_SCALE, w: 140 * MAP_SCALE, h: 125 * MAP_SCALE },

  // 3. Bottom-right Research Lab building
  { x: 355 * MAP_SCALE, y: 280 * MAP_SCALE, w: 170 * MAP_SCALE, h: 135 * MAP_SCALE },

  // 4. Bottom-left pond
  { x: 165 * MAP_SCALE, y: 460 * MAP_SCALE, w: 100 * MAP_SCALE, h: 100 * MAP_SCALE },

  // 5. Middle-left fence & signboard
  { x: 110 * MAP_SCALE, y: 310 * MAP_SCALE, w: 125 * MAP_SCALE, h: 35 * MAP_SCALE },

  // 6. Bottom fence & grave/sign
  { x: 350 * MAP_SCALE, y: 495 * MAP_SCALE, w: 170 * MAP_SCALE, h: 30 * MAP_SCALE },

  // 7. Bottom-left dense tree forest
  { x: 0, y: 450 * MAP_SCALE, w: 165 * MAP_SCALE, h: 110 * MAP_SCALE },

  // 8. Bottom-right corner trees
  { x: 440 * MAP_SCALE, y: 520 * MAP_SCALE, w: 170 * MAP_SCALE, h: 40 * MAP_SCALE }
];

// Helper: Check rectangle overlap
function rectsOverlap(r1, r2) {
  return !(
    r2.x > r1.x + r1.w ||
    r2.x + r2.w < r1.x ||
    r2.y > r1.y + r1.h ||
    r2.y + r2.h < r1.y
  );
}

// Check player collision against map edges and obstacles
export function checkVillageCollision(x, y) {
  // Player feet collision box
  const pBox = {
    x: x + 6,
    y: y + 26,
    w: 24,
    h: 14
  };

  // Outer Map Boundaries
  const minX = 35 * MAP_SCALE; // Left outer trees
  const maxX = (MAP_BASE_WIDTH - 35) * MAP_SCALE - pBox.w; // Right outer trees
  const minY = 50 * MAP_SCALE; // Top outer trees
  const maxY = (MAP_BASE_HEIGHT - 30) * MAP_SCALE - pBox.h; // Bottom outer trees

  // Allow passing through the top center path (between houses)
  const isTopCenterPath = x >= 265 * MAP_SCALE && x <= 345 * MAP_SCALE && y < minY;

  if (pBox.x < minX || pBox.x > maxX || pBox.y > maxY) {
    return true;
  }

  if (pBox.y < minY && !isTopCenterPath) {
    return true;
  }

  // Check obstacle collision boxes
  for (const box of COLLISION_BOXES) {
    if (rectsOverlap(pBox, box)) {
      return true;
    }
  }

  return false;
}

// Fallback background rendering if image is loading or unavailable
export function drawFallbackVillage(ctx) {
  // Grass background
  ctx.fillStyle = '#68c070';
  ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

  // Houses placeholders
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(105 * MAP_SCALE, 90 * MAP_SCALE, 140 * MAP_SCALE, 125 * MAP_SCALE);
  ctx.fillRect(370 * MAP_SCALE, 90 * MAP_SCALE, 140 * MAP_SCALE, 125 * MAP_SCALE);

  // Lab placeholder
  ctx.fillStyle = '#475569';
  ctx.fillRect(355 * MAP_SCALE, 280 * MAP_SCALE, 170 * MAP_SCALE, 135 * MAP_SCALE);

  // Pond placeholder
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(165 * MAP_SCALE, 460 * MAP_SCALE, 100 * MAP_SCALE, 100 * MAP_SCALE);
}
