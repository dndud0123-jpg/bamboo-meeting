import {
  TILE_SIZE,
  MAP_COLS,
  MAP_ROWS,
  CONFERENCE_ZONE,
  TABLE_ZONE,
  SCREEN_ZONE
} from './pixelSprites';

// Procedural rendering of Pokemon GBA style conference map
export function drawMap(ctx, time = 0) {
  // 1. Draw Outdoor Grass & Base Floor
  for (let c = 0; c < MAP_COLS; c++) {
    for (let r = 0; r < MAP_ROWS; r++) {
      const x = c * TILE_SIZE;
      const y = r * TILE_SIZE;

      // Check if inside conference building
      const inBuilding = (
        x >= CONFERENCE_ZONE.x &&
        x < CONFERENCE_ZONE.x + CONFERENCE_ZONE.w &&
        y >= CONFERENCE_ZONE.y &&
        y < CONFERENCE_ZONE.y + CONFERENCE_ZONE.h
      );

      if (inBuilding) {
        // Indoor Office Wooden Parquet Tile
        const isAlternate = (c + r) % 2 === 0;
        ctx.fillStyle = isAlternate ? '#d4a373' : '#cca06f';
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

        // Wood grain subtle lines
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(x, y + 8, TILE_SIZE, 2);
        ctx.fillRect(x, y + 24, TILE_SIZE, 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
        ctx.fillRect(x + 16, y, 2, TILE_SIZE);
      } else {
        // Outdoor Emerald Grass
        const grassSeed = (c * 17 + r * 31) % 10;
        let grassColor = '#58a838'; // base emerald
        if (grassSeed < 2) grassColor = '#4e9830';
        else if (grassSeed === 3) grassColor = '#62b842';

        ctx.fillStyle = grassColor;
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

        // Grass blade dots
        if (grassSeed % 3 === 0) {
          ctx.fillStyle = '#3c7a24';
          ctx.fillRect(x + 6, y + 8, 4, 2);
          ctx.fillRect(x + 8, y + 6, 2, 4);
        }

        // Random colorful flowers
        if (grassSeed === 7 && c % 3 === 0) {
          // Flower stem
          ctx.fillStyle = '#225414';
          ctx.fillRect(x + 15, y + 15, 2, 5);
          // Petals
          ctx.fillStyle = (r % 2 === 0) ? '#f43f5e' : '#fbbf24';
          ctx.fillRect(x + 13, y + 11, 6, 4);
          ctx.fillRect(x + 14, y + 10, 4, 6);
          // Flower center
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x + 15, y + 12, 2, 2);
        }
      }
    }
  }

  // 2. Pathway leading to conference room entrance
  const doorCenterX = CONFERENCE_ZONE.x + CONFERENCE_ZONE.w / 2;
  const doorCenterY = CONFERENCE_ZONE.y + CONFERENCE_ZONE.h;
  for (let r = Math.floor(doorCenterY / TILE_SIZE); r < MAP_ROWS; r++) {
    for (let c = Math.floor(doorCenterX / TILE_SIZE) - 1; c <= Math.floor(doorCenterX / TILE_SIZE) + 1; c++) {
      const px = c * TILE_SIZE;
      const py = r * TILE_SIZE;
      // Cobblestone path
      ctx.fillStyle = '#9ca3af';
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = '#6b7280';
      ctx.strokeRect(px + 1, py + 1, TILE_SIZE - 2, TILE_SIZE - 2);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(px + 4, py + 4, 6, 4);
      ctx.fillRect(px + 18, py + 16, 8, 4);
    }
  }

  // 3. Conference Building Walls & Roof Border
  ctx.save();
  const bx = CONFERENCE_ZONE.x;
  const by = CONFERENCE_ZONE.y;
  const bw = CONFERENCE_ZONE.w;
  const bh = CONFERENCE_ZONE.h;

  // Exterior brick wall perimeter (top and sides)
  ctx.fillStyle = '#475569';
  ctx.fillRect(bx - 12, by - 24, bw + 24, 28); // Top roof shadow/border
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(bx - 8, by - 20, bw + 16, 20); // Roof eave

  // Roof tiles pattern
  ctx.fillStyle = '#334155';
  for (let rx = bx - 6; rx < bx + bw + 6; rx += 16) {
    ctx.fillRect(rx, by - 18, 14, 16);
  }

  // Left & Right walls
  ctx.fillStyle = '#64748b';
  ctx.fillRect(bx - 8, by, 10, bh);
  ctx.fillRect(bx + bw - 2, by, 10, bh);

  // Bottom wall with entrance opening
  const doorWidth = 3 * TILE_SIZE;
  const leftWallW = (bw - doorWidth) / 2;
  ctx.fillStyle = '#64748b';
  ctx.fillRect(bx - 8, by + bh - 8, leftWallW + 8, 12);
  ctx.fillRect(bx + bw - leftWallW, by + bh - 8, leftWallW + 8, 12);

  // Welcome Mat at door
  ctx.fillStyle = '#b91c1c';
  ctx.fillRect(bx + leftWallW + 4, by + bh - 8, doorWidth - 8, 18);
  ctx.fillStyle = '#fef08a';
  ctx.font = '10px DungGeunMo, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('WELCOME', bx + bw / 2, by + bh + 4);

  // 4. Whiteboard / Presentation Screen (Top of conference room)
  const sx = SCREEN_ZONE.x;
  const sy = SCREEN_ZONE.y;
  const sw = SCREEN_ZONE.w;
  const sh = SCREEN_ZONE.h;

  // Screen Frame
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(sx - 4, sy - 4, sw + 8, sh + 8);
  // Screen Display
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(sx, sy, sw, sh);

  // Screen Content (GBA Presentation Slide)
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(sx + 8, sy + 6, sw - 16, 12);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 9px DungGeunMo, monospace';
  ctx.textAlign = 'left';
  ctx.fillText('⚡ DOTROOM GLOBAL SYNC ⚡', sx + 14, sy + 15);

  // Animated pulse light
  const pulse = Math.sin(time / 400) > 0;
  ctx.fillStyle = pulse ? '#22c55e' : '#15803d';
  ctx.beginPath();
  ctx.arc(sx + sw - 14, sy + 12, 4, 0, Math.PI * 2);
  ctx.fill();

  // Slide mini charts / stats
  ctx.fillStyle = '#94a3b8';
  ctx.font = '8px DungGeunMo, monospace';
  ctx.fillText('• 모바일 QR 코드로 참여중', sx + 12, sy + 32);
  ctx.fillText('• WASD/화살표로 이동 & 채팅', sx + 12, sy + 46);
  ctx.fillText('• 발언 시 3초 말풍선 표시', sx + 12, sy + 60);

  // Mini bar chart on the right of screen
  const barHeights = [18, 28, 22, 34, 42];
  for (let i = 0; i < barHeights.length; i++) {
    ctx.fillStyle = '#a855f7';
    ctx.fillRect(sx + sw - 70 + i * 11, sy + sh - 8 - barHeights[i], 8, barHeights[i]);
  }

  // 5. Large Conference Table (Mahogany wood)
  const tx = TABLE_ZONE.x;
  const ty = TABLE_ZONE.y;
  const tw = TABLE_ZONE.w;
  const th = TABLE_ZONE.h;

  // Table Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(tx + 8, ty + th, tw - 16, 12);

  // Table Body
  ctx.fillStyle = '#78350f'; // Dark wood rim
  ctx.fillRect(tx, ty, tw, th);
  ctx.fillStyle = '#92400e'; // Table surface
  ctx.fillRect(tx + 4, ty + 4, tw - 8, th - 8);
  ctx.fillStyle = '#b45309'; // Highlight inner bevel
  ctx.fillRect(tx + 8, ty + 8, tw - 16, 4);

  // Laptops and accessories on table
  const laptopPositions = [
    { x: tx + 24, y: ty + 12, screenColor: '#38bdf8' },
    { x: tx + 84, y: ty + 12, screenColor: '#34d399' },
    { x: tx + 144, y: ty + 12, screenColor: '#f43f5e' },
    { x: tx + 204, y: ty + 12, screenColor: '#fbbf24' },
    { x: tx + 54, y: ty + th - 26, screenColor: '#818cf8' },
    { x: tx + 114, y: ty + th - 26, screenColor: '#a78bfa' },
    { x: tx + 174, y: ty + th - 26, screenColor: '#2dd4bf' },
    { x: tx + 234, y: ty + th - 26, screenColor: '#fb923c' }
  ];

  laptopPositions.forEach(lap => {
    // Laptop base
    ctx.fillStyle = '#64748b';
    ctx.fillRect(lap.x, lap.y + 7, 16, 6);
    // Laptop screen
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(lap.x + 1, lap.y, 14, 8);
    ctx.fillStyle = lap.screenColor;
    ctx.fillRect(lap.x + 2, lap.y + 1, 12, 6);
  });

  // Table center microphones and documents
  ctx.fillStyle = '#1f2937';
  ctx.beginPath();
  ctx.arc(tx + tw / 2, ty + th / 2, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(tx + tw / 2 - 2, ty + th / 2 - 2, 4, 4); // Mic light

  // Documents
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(tx + tw / 2 - 40, ty + th / 2 - 5, 12, 10);
  ctx.fillRect(tx + tw / 2 + 25, ty + th / 2 - 5, 12, 10);

  // 6. Conference Chairs around table
  // Top chairs
  for (let cx = tx + 20; cx < tx + tw - 20; cx += 45) {
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(cx, ty - 18, 22, 14); // Backrest
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(cx + 2, ty - 16, 18, 10);
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(cx + 3, ty - 4, 16, 6); // Seat cushion
  }
  // Bottom chairs
  for (let cx = tx + 20; cx < tx + tw - 20; cx += 45) {
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(cx, ty + th + 4, 22, 14);
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(cx + 2, ty + th + 6, 18, 10);
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(cx + 3, ty + th - 2, 16, 6);
  }

  // 7. Corner Details: Potted plants
  drawPottedPlant(ctx, bx + 16, by + 16);
  drawPottedPlant(ctx, bx + bw - 36, by + 16);
  drawPottedPlant(ctx, bx + 16, by + bh - 40);
  drawPottedPlant(ctx, bx + bw - 36, by + bh - 40);

  // 8. Water dispenser & Coffee Machine in top-left
  drawCoffeeStation(ctx, bx + 60, by + 12);

  // 9. Retro Server Rack in top-right
  drawServerRack(ctx, bx + bw - 90, by + 12, time);

  // 10. Outdoor Fences / Hedge bushes around perimeter
  drawGardenDecorations(ctx);

  ctx.restore();
}

function drawPottedPlant(ctx, x, y) {
  // Pot
  ctx.fillStyle = '#c2410c';
  ctx.fillRect(x + 4, y + 14, 14, 12);
  ctx.fillStyle = '#ea580c';
  ctx.fillRect(x + 2, y + 12, 18, 4);

  // Foliage
  ctx.fillStyle = '#15803d';
  ctx.beginPath();
  ctx.arc(x + 11, y + 8, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#22c55e';
  ctx.beginPath();
  ctx.arc(x + 9, y + 6, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#86efac';
  ctx.fillRect(x + 7, y + 3, 4, 3);
}

function drawCoffeeStation(ctx, x, y) {
  // Cabinet
  ctx.fillStyle = '#475569';
  ctx.fillRect(x, y + 10, 32, 22);
  // Coffee Maker
  ctx.fillStyle = '#111827';
  ctx.fillRect(x + 4, y, 12, 12);
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(x + 7, y + 2, 6, 4); // glass pot
  // Water cooler
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(x + 18, y + 2, 10, 10);
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(x + 19, y - 6, 8, 9); // water bottle
}

function drawServerRack(ctx, x, y, time) {
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(x, y, 26, 32);
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(x + 2, y + 2, 22, 28);

  // Flashing server LEDs
  const t = Math.floor(time / 200);
  const colors = ['#22c55e', '#eab308', '#38bdf8', '#ef4444'];
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = colors[(t + i) % colors.length];
    ctx.fillRect(x + 4, y + 6 + i * 6, 4, 3);
    ctx.fillStyle = '#475569';
    ctx.fillRect(x + 10, y + 6 + i * 6, 12, 3);
  }
}

function drawGardenDecorations(ctx) {
  // Outdoor wooden fence along the top boundary
  for (let col = 2; col < MAP_COLS - 2; col += 2) {
    if (col >= 8 && col <= 27) continue; // skip behind conference room
    const fx = col * TILE_SIZE;
    const fy = 2 * TILE_SIZE;

    // Fence post
    ctx.fillStyle = '#854d0e';
    ctx.fillRect(fx + 6, fy, 4, 20);
    ctx.fillRect(fx + 22, fy, 4, 20);
    // Fence rail
    ctx.fillStyle = '#a16207';
    ctx.fillRect(fx, fy + 4, 32, 4);
    ctx.fillRect(fx, fy + 12, 32, 4);
  }

  // Outdoor water pond on bottom-left
  const px = 2 * TILE_SIZE;
  const py = 16 * TILE_SIZE;
  ctx.fillStyle = '#0284c7';
  ctx.beginPath();
  ctx.ellipse(px + 40, py + 35, 45, 30, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.ellipse(px + 36, py + 30, 36, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  // Water lily
  ctx.fillStyle = '#15803d';
  ctx.beginPath();
  ctx.arc(px + 35, py + 32, 6, 0, Math.PI * 1.7);
  ctx.fill();
  ctx.fillStyle = '#f472b6';
  ctx.fillRect(px + 33, py + 29, 3, 3);
}

// Collision detection for player movement
export function checkCollision(x, y) {
  // Bounds check (keep player inside map with 20px padding)
  const pad = 16;
  if (x < pad || x > MAP_WIDTH - pad - 24 || y < pad || y > MAP_HEIGHT - pad - 32) {
    return true;
  }

  // Player bounding box (approx 24x20 at feet level)
  const pBox = {
    x: x,
    y: y + 20,
    w: 24,
    h: 16
  };

  // Helper for rectangle intersection
  function rectIntersect(r1, r2) {
    return !(
      r2.x > r1.x + r1.w ||
      r2.x + r2.w < r1.x ||
      r2.y > r1.y + r1.h ||
      r2.y + r2.h < r1.y
    );
  }

  // 1. Table collision (cannot walk through conference table)
  if (rectIntersect(pBox, TABLE_ZONE)) {
    return true;
  }

  // 2. Screen collision (top presentation whiteboard)
  if (rectIntersect(pBox, SCREEN_ZONE)) {
    return true;
  }

  // 3. Conference building walls (only enter through the door!)
  const bx = CONFERENCE_ZONE.x;
  const by = CONFERENCE_ZONE.y;
  const bw = CONFERENCE_ZONE.w;
  const bh = CONFERENCE_ZONE.h;
  const doorWidth = 3 * TILE_SIZE;
  const leftWallW = (bw - doorWidth) / 2;

  // North wall
  if (rectIntersect(pBox, { x: bx - 8, y: by - 10, w: bw + 16, h: 20 })) {
    return true;
  }
  // West wall
  if (rectIntersect(pBox, { x: bx - 8, y: by, w: 12, h: bh })) {
    return true;
  }
  // East wall
  if (rectIntersect(pBox, { x: bx + bw - 4, y: by, w: 12, h: bh })) {
    return true;
  }
  // South wall left segment
  if (rectIntersect(pBox, { x: bx - 8, y: by + bh - 6, w: leftWallW + 8, h: 14 })) {
    return true;
  }
  // South wall right segment
  if (rectIntersect(pBox, { x: bx + bw - leftWallW, y: by + bh - 6, w: leftWallW + 8, h: 14 })) {
    return true;
  }

  // Pond collision
  const pondX = 2 * TILE_SIZE;
  const pondY = 16 * TILE_SIZE;
  if (rectIntersect(pBox, { x: pondX, y: pondY + 10, w: 80, h: 50 })) {
    return true;
  }

  return false;
}
