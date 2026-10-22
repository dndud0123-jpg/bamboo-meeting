import React, { useRef, useEffect, useState, useCallback } from 'react';
import mapBgSrc from '../assets/map_background.png';
import charactersSrc from '../assets/characters.png';
import { getSpriteCoords } from '../utils/spriteCoords';
import { makeSpriteTransparent, loadProcessedSprite } from '../utils/spriteUtils';
import {
  MAP_WIDTH,
  MAP_HEIGHT,
  checkVillageCollision,
  drawFallbackVillage
} from '../utils/villageMap';
import { drawCharacter } from '../utils/pixelSprites';

export default function GameCanvas({
  selfId,
  players,
  myProfile,
  onPlayerMove,
  onPlayerJump,
  virtualDirection,
  jumpSignal,
  remoteJumpTrigger,
  onOpenBoard,
  isModalOpen
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Jump physics constants
  const JUMP_INITIAL_VELOCITY = -5.8;
  const GRAVITY = 0.45;
  const SQUASH_FRAMES = 4;

  // Background and sprite sheet state
  const bgImageRef = useRef(null);
  const charSheetRef = useRef(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [charSheetLoaded, setCharSheetLoaded] = useState(false);

  // Local player state in refs for latency-free 60FPS updates
  const localPlayerRef = useRef({
    x: 610, // spawn at village center crossroads
    y: 520,
    direction: 'down',
    isMoving: false,
    frame: 0,
    lastStepTime: 0,
    // Jump physics state
    isJumping: false,
    jumpOffset: 0,
    jumpVelocity: 0,
    squashTimer: 0
  });

  const keysRef = useRef({
    up: false,
    down: false,
    left: false,
    right: false
  });

  const lastMoveEmitRef = useRef(0);
  const animFrameRef = useRef(null);

  // Sync props to refs to completely prevent gameLoop unmounts and frame stutter
  const playersRef = useRef(players);
  useEffect(() => {
    playersRef.current = players;
  }, [players]);

  const virtualDirectionRef = useRef(virtualDirection);
  useEffect(() => {
    virtualDirectionRef.current = virtualDirection;
  }, [virtualDirection]);

  const onPlayerMoveRef = useRef(onPlayerMove);
  useEffect(() => {
    onPlayerMoveRef.current = onPlayerMove;
  }, [onPlayerMove]);

  const onPlayerJumpRef = useRef(onPlayerJump);
  useEffect(() => {
    onPlayerJumpRef.current = onPlayerJump;
  }, [onPlayerJump]);

  const selfIdRef = useRef(selfId);
  useEffect(() => {
    selfIdRef.current = selfId;
  }, [selfId]);

  const myProfileRef = useRef(myProfile);
  useEffect(() => {
    myProfileRef.current = myProfile;
  }, [myProfile]);

  const onOpenBoardRef = useRef(onOpenBoard);
  useEffect(() => {
    onOpenBoardRef.current = onOpenBoard;
  }, [onOpenBoard]);

  const isModalOpenRef = useRef(isModalOpen);
  useEffect(() => {
    isModalOpenRef.current = isModalOpen;
  }, [isModalOpen]);

  const isNearBoardRef = useRef(false);
  const latestCamRef = useRef({ camX: 0, camY: 0 });

  // Remote players jump physics state map
  const remoteJumpsRef = useRef(new Map());
  // Remote players smooth position interpolation cache for 60FPS LERP with 20Hz server ticks
  const remotePosCacheRef = useRef(new Map());

  // Listen for remote jump trigger
  useEffect(() => {
    if (remoteJumpTrigger && remoteJumpTrigger.id) {
      let r = remoteJumpsRef.current.get(remoteJumpTrigger.id);
      if (!r) {
        r = { isJumping: false, jumpOffset: 0, jumpVelocity: 0, squashTimer: 0 };
        remoteJumpsRef.current.set(remoteJumpTrigger.id, r);
      }
      if (!r.isJumping) {
        r.isJumping = true;
        r.jumpVelocity = JUMP_INITIAL_VELOCITY;
        r.jumpOffset = 0;
        r.squashTimer = 0;
      }
    }
  }, [remoteJumpTrigger]);

  // Local trigger jump function
  const triggerLocalJump = useCallback(() => {
    const local = localPlayerRef.current;
    if (!local.isJumping) {
      local.isJumping = true;
      local.jumpVelocity = JUMP_INITIAL_VELOCITY;
      local.jumpOffset = 0;
      local.squashTimer = 0;
      if (onPlayerJumpRef.current) {
        onPlayerJumpRef.current();
      }
    }
  }, []);

  // Jump triggered from MobileChatBar
  useEffect(() => {
    if (jumpSignal > 0) {
      triggerLocalJump();
    }
  }, [jumpSignal, triggerLocalJump]);

  // Preload map background image and 16-character sprite sheet with mobile decoding support
  useEffect(() => {
    // 1. Map Background
    const img = new Image();
    img.src = mapBgSrc;
    const onBgReady = async () => {
      if (img.decode) {
        try { await img.decode(); } catch (_) {}
      }
      bgImageRef.current = img;
      setImageLoaded(true);
    };
    if (img.complete && (img.naturalWidth > 0 || img.width > 0)) {
      onBgReady();
    } else {
      img.onload = onBgReady;
      img.onerror = () => {
        console.warn('Map image load failed, using fallback procedural map');
      };
    }

    // 2. Character Sprite Sheet:
    // First, set raw image immediately as early fallback once decoded so characters are visible without waiting
    const rawCharImg = new Image();
    rawCharImg.crossOrigin = 'anonymous';
    rawCharImg.src = charactersSrc;
    const onRawReady = async () => {
      if (rawCharImg.decode) {
        try { await rawCharImg.decode(); } catch (_) {}
      }
      if (!charSheetRef.current) {
        charSheetRef.current = rawCharImg;
        setCharSheetLoaded(true);
      }
    };
    if (rawCharImg.complete && (rawCharImg.naturalWidth > 0 || rawCharImg.width > 0)) {
      onRawReady();
    } else {
      rawCharImg.onload = onRawReady;
      rawCharImg.onerror = () => {
        console.warn('Raw character sprite load failed');
      };
    }

    // Then, run full processed sprite loading (with chroma-key transparency)
    loadProcessedSprite(charactersSrc).then((processedSource) => {
      if (processedSource) {
        charSheetRef.current = processedSource;
        setCharSheetLoaded(true);
      }
    });
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
      if (isModalOpenRef.current) return;

      // Spacebar: if near board, open board! Otherwise, jump!
      if (e.code === 'Space') {
        e.preventDefault();
        if (isNearBoardRef.current && onOpenBoardRef.current) {
          onOpenBoardRef.current();
          return;
        }
        triggerLocalJump();
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'arrowup':
        case 'w':
          keysRef.current.up = true;
          break;
        case 'arrowdown':
        case 's':
          keysRef.current.down = true;
          break;
        case 'arrowleft':
        case 'a':
          keysRef.current.left = true;
          break;
        case 'arrowright':
        case 'd':
          keysRef.current.right = true;
          break;
        default:
          break;
      }
    };

    const handleKeyUp = (e) => {
      switch (e.key.toLowerCase()) {
        case 'arrowup':
        case 'w':
          keysRef.current.up = false;
          break;
        case 'arrowdown':
        case 's':
          keysRef.current.down = false;
          break;
        case 'arrowleft':
        case 'a':
          keysRef.current.left = false;
          break;
        case 'arrowright':
        case 'd':
          keysRef.current.right = false;
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Main 60 FPS Render & Physics Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let isRunning = true;

    const gameLoop = (timestamp) => {
      if (!isRunning) return;

      const container = containerRef.current;
      if (container) {
        if (canvas.width !== container.clientWidth || canvas.height !== container.clientHeight) {
          canvas.width = container.clientWidth;
          canvas.height = container.clientHeight;
        }
      }

      // 1. Process Movement Vectors
      const moveSpeed = 3.5;
      let dx = 0;
      let dy = 0;

      const vDir = virtualDirectionRef.current;
      const isVDirObj = typeof vDir === 'object' && vDir !== null;

      const vUp = isVDirObj ? !!vDir.up : (vDir === 'up' || vDir === 'up-left' || vDir === 'up-right');
      const vDown = isVDirObj ? !!vDir.down : (vDir === 'down' || vDir === 'down-left' || vDir === 'down-right');
      const vLeft = isVDirObj ? !!vDir.left : (vDir === 'left' || vDir === 'up-left' || vDir === 'down-left');
      const vRight = isVDirObj ? !!vDir.right : (vDir === 'right' || vDir === 'up-right' || vDir === 'down-right');

      const isUp = !isModalOpenRef.current && (keysRef.current.up || vUp);
      const isDown = !isModalOpenRef.current && (keysRef.current.down || vDown);
      const isLeft = !isModalOpenRef.current && (keysRef.current.left || vLeft);
      const isRight = !isModalOpenRef.current && (keysRef.current.right || vRight);

      if (isUp) dy -= moveSpeed;
      if (isDown) dy += moveSpeed;
      if (isLeft) dx -= moveSpeed;
      if (isRight) dx += moveSpeed;

      const local = localPlayerRef.current;
      const wasMoving = local.isMoving;
      local.isMoving = dx !== 0 || dy !== 0;

      // Jump Physics: Local Player
      if (local.isJumping) {
        local.jumpOffset += local.jumpVelocity;
        local.jumpVelocity += GRAVITY;

        // Ground landing check
        if (local.jumpOffset >= 0) {
          local.jumpOffset = 0;
          local.jumpVelocity = 0;
          local.isJumping = false;
          local.squashTimer = SQUASH_FRAMES;
        }
      }
      if (local.squashTimer > 0) {
        local.squashTimer -= 1;
      }

      // Jump Physics: Remote Players
      remoteJumpsRef.current.forEach((r) => {
        if (r.isJumping) {
          r.jumpOffset += r.jumpVelocity;
          r.jumpVelocity += GRAVITY;

          if (r.jumpOffset >= 0) {
            r.jumpOffset = 0;
            r.jumpVelocity = 0;
            r.isJumping = false;
            r.squashTimer = SQUASH_FRAMES;
          }
        }
        if (r.squashTimer > 0) {
          r.squashTimer -= 1;
        }
      });

      if (local.isMoving) {
        if (dx !== 0 && dy !== 0) {
          dx *= 0.7071;
          dy *= 0.7071;
        }

        if (Math.abs(dy) > Math.abs(dx)) {
          local.direction = dy > 0 ? 'down' : 'up';
        } else {
          local.direction = dx > 0 ? 'right' : 'left';
        }

        // Horizontal collision test
        const nextX = local.x + dx;
        if (!checkVillageCollision(nextX, local.y)) {
          local.x = nextX;
        }

        // Vertical collision test
        const nextY = local.y + dy;
        if (!checkVillageCollision(local.x, nextY)) {
          local.y = nextY;
        }

        // Walk animation cycle
        if (timestamp - local.lastStepTime > 160) {
          local.frame = (local.frame + 1) % 4;
          local.lastStepTime = timestamp;
        }

        // Throttled sync
        if (timestamp - lastMoveEmitRef.current > 33) {
          if (onPlayerMoveRef.current) {
            onPlayerMoveRef.current({
              x: Math.round(local.x),
              y: Math.round(local.y),
              direction: local.direction,
              isMoving: true
            });
          }
          lastMoveEmitRef.current = timestamp;
        }
      } else if (wasMoving) {
        local.frame = 0;
        if (onPlayerMoveRef.current) {
          onPlayerMoveRef.current({
            x: Math.round(local.x),
            y: Math.round(local.y),
            direction: local.direction,
            isMoving: false
          });
        }
      }

      // 2. Setup Crisp 2D Canvas & Camera Viewport
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#0a0d14';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();

      // Camera centered on local player, clamped to map bounds
      let camX = canvas.width / 2 - local.x;
      let camY = canvas.height / 2 - local.y;

      if (canvas.width < MAP_WIDTH) {
        camX = Math.min(0, Math.max(canvas.width - MAP_WIDTH, camX));
      } else {
        camX = (canvas.width - MAP_WIDTH) / 2;
      }

      if (canvas.height < MAP_HEIGHT) {
        camY = Math.min(0, Math.max(canvas.height - MAP_HEIGHT, camY));
      } else {
        camY = (canvas.height - MAP_HEIGHT) / 2;
      }

      ctx.translate(Math.round(camX), Math.round(camY));
      latestCamRef.current = { camX: Math.round(camX), camY: Math.round(camY) };

      // 3. Draw Littleroot Town Background
      if (bgImageRef.current && bgImageRef.current.complete) {
        ctx.drawImage(bgImageRef.current, 0, 0, MAP_WIDTH, MAP_HEIGHT);
      } else {
        drawFallbackVillage(ctx);
      }

      // 3.1 Draw Interactive Cork Notice Board (Village Center)
      const BOARD_X = 588;
      const BOARD_Y = 416;
      const BOARD_W = 54;
      const BOARD_H = 48;

      // Base shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
      ctx.beginPath();
      ctx.ellipse(BOARD_X + BOARD_W / 2, BOARD_Y + BOARD_H - 1, 30, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Wooden Posts
      ctx.fillStyle = '#422510';
      ctx.fillRect(BOARD_X + 9, BOARD_Y + 28, 7, 18);
      ctx.fillRect(BOARD_X + BOARD_W - 16, BOARD_Y + 28, 7, 18);
      ctx.strokeStyle = '#271406';
      ctx.lineWidth = 1;
      ctx.strokeRect(BOARD_X + 9, BOARD_Y + 28, 7, 18);
      ctx.strokeRect(BOARD_X + BOARD_W - 16, BOARD_Y + 28, 7, 18);

      // Wooden Board Outer Frame
      ctx.fillStyle = '#593418';
      ctx.fillRect(BOARD_X, BOARD_Y, BOARD_W, 32);
      ctx.strokeStyle = '#311907';
      ctx.lineWidth = 2;
      ctx.strokeRect(BOARD_X, BOARD_Y, BOARD_W, 32);

      // Board Top Overhang Ridge
      ctx.fillStyle = '#3c200c';
      ctx.fillRect(BOARD_X - 2, BOARD_Y - 2, BOARD_W + 4, 4);

      // Inner Cork Texture
      ctx.fillStyle = '#c79c66';
      ctx.fillRect(BOARD_X + 3, BOARD_Y + 3, BOARD_W - 6, 26);
      ctx.fillStyle = '#b78b54';
      ctx.fillRect(BOARD_X + 8, BOARD_Y + 7, 2, 2);
      ctx.fillRect(BOARD_X + 22, BOARD_Y + 18, 2, 2);
      ctx.fillRect(BOARD_X + 41, BOARD_Y + 10, 2, 2);
      ctx.fillRect(BOARD_X + 35, BOARD_Y + 23, 2, 2);

      // Pinned Colorful Mini Sticky Notes (matching reference image)
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(BOARD_X + 6, BOARD_Y + 6, 11, 10);
      ctx.fillStyle = '#ef4444'; // Red pin
      ctx.fillRect(BOARD_X + 10, BOARD_Y + 5, 3, 2);

      ctx.fillStyle = '#fbcfe8';
      ctx.fillRect(BOARD_X + 21, BOARD_Y + 8, 12, 10);
      ctx.fillStyle = '#38bdf8'; // Blue tape
      ctx.fillRect(BOARD_X + 25, BOARD_Y + 7, 4, 2);

      ctx.fillStyle = '#bbf7d0';
      ctx.fillRect(BOARD_X + 37, BOARD_Y + 6, 11, 11);
      ctx.fillStyle = '#f59e0b'; // Amber tape
      ctx.fillRect(BOARD_X + 40, BOARD_Y + 5, 5, 2);

      ctx.fillStyle = '#e9d5ff';
      ctx.fillRect(BOARD_X + 13, BOARD_Y + 18, 12, 9);

      ctx.fillStyle = '#bae6fd';
      ctx.fillRect(BOARD_X + 30, BOARD_Y + 17, 12, 10);

      // Proximity check to local player
      const distToBoard = Math.hypot(
        (local.x + 19) - (BOARD_X + BOARD_W / 2),
        (local.y + 19) - (BOARD_Y + BOARD_H / 2)
      );
      const isNearBoard = distToBoard < 85;
      isNearBoardRef.current = isNearBoard;

      // Notice Board Title & Interactive Floating Prompt
      const floatY = Math.sin(timestamp / 140) * 3;
      if (isNearBoard) {
        ctx.save();
        ctx.font = 'bold 11px DungGeunMo, monospace';
        const promptText = '📜 비밀 게시판 열기 (클릭)';
        const textM = ctx.measureText(promptText);
        const pW = textM.width + 16;
        const pH = 22;
        const pX = BOARD_X + BOARD_W / 2 - pW / 2;
        const pY = BOARD_Y - 30 + floatY;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 1.5;
        if (ctx.roundRect) {
          ctx.beginPath();
          ctx.roundRect(pX, pY, pW, pH, 6);
          ctx.fill();
          ctx.stroke();
        } else {
          ctx.fillRect(pX, pY, pW, pH);
          ctx.strokeRect(pX, pY, pW, pH);
        }

        ctx.fillStyle = '#fef08a';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(promptText, BOARD_X + BOARD_W / 2, pY + pH / 2 + 1);
        ctx.restore();
      } else {
        ctx.save();
        ctx.font = 'bold 10px DungGeunMo, monospace';
        const labelText = '📌 비밀 게시판';
        const textM = ctx.measureText(labelText);
        const pW = textM.width + 10;
        const pH = 16;
        const pX = BOARD_X + BOARD_W / 2 - pW / 2;
        const pY = BOARD_Y - 18;

        ctx.fillStyle = 'rgba(20, 24, 38, 0.85)';
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 1;
        if (ctx.roundRect) {
          ctx.beginPath();
          ctx.roundRect(pX, pY, pW, pH, 4);
          ctx.fill();
          ctx.stroke();
        } else {
          ctx.fillRect(pX, pY, pW, pH);
          ctx.strokeRect(pX, pY, pW, pH);
        }
        ctx.fillStyle = '#fde68a';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(labelText, BOARD_X + BOARD_W / 2, pY + pH / 2 + 1);
        ctx.restore();
      }

      // 4. Render All Players (Local + Remote) Depth Sorted
      // Strictly guarantee exactly 1 local avatar, deduplicating any legacy or duplicate entries
      const curPlayers = playersRef.current;
      const playerList = Array.isArray(curPlayers) ? curPlayers : Object.values(curPlayers || {});
      const curSelfId = selfIdRef.current;
      const curProfile = myProfileRef.current;

      const remotePlayers = playerList.filter(
        p => p.id !== curSelfId && (!curProfile?.nickname || p.nickname !== curProfile.nickname)
      );

      const selfData = playerList.find(p => p.id === curSelfId) || {};
      const localPlayer = {
        id: curSelfId,
        nickname: curProfile?.nickname || selfData.nickname || '나',
        charIndex: curProfile?.charIndex ?? selfData.charIndex ?? 0,
        x: local.x,
        y: local.y,
        direction: local.direction,
        isMoving: local.isMoving,
        frame: local.frame,
        bubble: selfData.bubble || null
      };

      const allPlayers = [localPlayer, ...remotePlayers];

      // Sort by feet position (Y)
      allPlayers.sort((a, b) => a.y - b.y);

      const now = Date.now();

      // Frustum Culling Viewport Bounds (skip rendering players far outside visible canvas)
      const cullPad = 90;
      const viewLeft = -camX - cullPad;
      const viewRight = -camX + canvas.width + cullPad;
      const viewTop = -camY - cullPad;
      const viewBottom = -camY + canvas.height + cullPad;

      allPlayers.forEach(p => {
        const isSelf = p.id === curSelfId;

        // Smooth 60FPS LERP interpolation for remote players with 20Hz server ticks
        let renderX = p.x;
        let renderY = p.y;
        if (!isSelf) {
          let cache = remotePosCacheRef.current.get(p.id);
          if (!cache) {
            cache = { x: p.x, y: p.y };
            remotePosCacheRef.current.set(p.id, cache);
          } else {
            cache.x += (p.x - cache.x) * 0.35;
            cache.y += (p.y - cache.y) * 0.35;
            if (Math.abs(p.x - cache.x) < 0.2) cache.x = p.x;
            if (Math.abs(p.y - cache.y) < 0.2) cache.y = p.y;
          }
          renderX = cache.x;
          renderY = cache.y;

          // Frustum Culling: Skip offscreen players to maintain steady 60FPS with 70+ players
          if (renderX < viewLeft || renderX > viewRight || renderY < viewTop || renderY > viewBottom) {
            return;
          }
        }

        const frame = isSelf ? local.frame : (p.isMoving ? Math.floor(timestamp / 160) % 4 : 0);

        const drawW = 38;
        const drawH = 38;
        const isWalking = p.isMoving;
        const bounceY = isWalking ? Math.sin(timestamp / 85) * 2.2 : 0;
        const centerX = renderX + drawW / 2;
        const centerY = renderY + drawH / 2;
        const dir = p.direction || 'down';

        // Retrieve current jump height and landing squash status
        const jOffset = isSelf ? local.jumpOffset : (remoteJumpsRef.current.get(p.id)?.jumpOffset || 0);
        const sTimer = isSelf ? local.squashTimer : (remoteJumpsRef.current.get(p.id)?.squashTimer || 0);

        // 1. Soft shadow on ground: scales with jump height
        const shadowScale = Math.max(0.55, 1.0 + jOffset / 75);
        const shadowAlpha = Math.max(0.10, 0.28 + jOffset / 120);
        ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
        ctx.beginPath();
        ctx.ellipse(centerX, renderY + drawH - 1, (drawW / 2.8) * shadowScale, 5 * shadowScale, 0, 0, Math.PI * 2);
        ctx.fill();

        // 2. Character Sprite with Directional + Jump + Squash/Stretch Transform
        ctx.save();
        ctx.translate(centerX, centerY + bounceY + jOffset);

        if (dir === 'right') {
          // Original sprite naturally faces left, so flip horizontally when moving right
          ctx.scale(-1, 1);
        } else if (dir === 'left') {
          // Keep natural left-facing orientation
          ctx.scale(1, 1);
        } else if (dir === 'up') {
          // Subtle upward stride tilt / vertical stretch
          const walkTilt = isWalking ? Math.sin(timestamp / 70) * 0.06 : 0;
          ctx.rotate(walkTilt);
          ctx.scale(0.96, 1.04);
        } else {
          // Down (front-facing)
          ctx.scale(1, 1);
        }

        // Elastic Squash & Stretch:
        if (sTimer > 0) {
          // Landing impact squash: wider horizontally, compressed vertically
          ctx.scale(1.15, 0.85);
        } else if (jOffset < -3) {
          // Ascending stretch in air
          ctx.scale(0.93, 1.07);
        }

        // Draw transparent character sprite
        const spriteSource = charSheetRef.current;
        const hasValidSprite =
          spriteSource &&
          ((spriteSource.naturalWidth && spriteSource.naturalWidth > 0) ||
           (spriteSource.width && spriteSource.width > 0));

        if (hasValidSprite) {
          const sWidthTotal = spriteSource.naturalWidth || spriteSource.width;
          const sHeightTotal = spriteSource.naturalHeight || spriteSource.height;
          const charIdx = typeof p.charIndex === 'number' ? p.charIndex : 0;
          const { sx, sy, sWidth, sHeight } = getSpriteCoords(
            charIdx,
            sWidthTotal,
            sHeightTotal
          );

          ctx.drawImage(
            spriteSource,
            sx, sy, sWidth, sHeight,
            -drawW / 2, -drawH / 2, drawW, drawH
          );
        } else {
          // Fallback while sprite is loading on mobile devices
          ctx.fillStyle = '#f59e0b';
          if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(-drawW / 4, -drawH / 4, drawW / 2, drawH / 2, 4);
            ctx.fill();
          } else {
            ctx.fillRect(-drawW / 4, -drawH / 4, drawW / 2, drawH / 2);
          }
        }
        ctx.restore();

        // Nickname Tag (hops with character)
        ctx.save();
        ctx.font = 'bold 11px DungGeunMo, monospace';
        const nameText = isSelf ? `⭐ ${p.nickname}` : p.nickname;
        const textMetrics = ctx.measureText(nameText);
        const nameW = textMetrics.width + 12;
        const nameH = 18;
        const nameX = centerX - nameW / 2;
        const nameY = renderY - 12 + jOffset;

        ctx.fillStyle = isSelf ? 'rgba(30, 58, 138, 0.92)' : 'rgba(15, 23, 42, 0.88)';
        ctx.fillRect(nameX, nameY, nameW, nameH);
        ctx.strokeStyle = isSelf ? '#fbbf24' : '#64748b';
        ctx.lineWidth = 1;
        ctx.strokeRect(nameX, nameY, nameW, nameH);

        ctx.fillStyle = isSelf ? '#fef08a' : '#f8fafc';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(nameText, centerX, nameY + nameH / 2 + 1);

        // 5. Speech Bubble (hops with character)
        if (p.bubble && p.bubble.expiresAt > now) {
          const remaining = p.bubble.expiresAt - now;
          const totalDuration = 3000;
          const progress = Math.max(0, Math.min(1, remaining / totalDuration));

          const alpha = remaining < 500 ? remaining / 500 : 1.0;
          ctx.globalAlpha = Math.max(0.05, alpha);

          const isReaction = ['👍', '❤️', '😭'].includes(p.bubble.text);
          ctx.font = isReaction ? '24px sans-serif' : 'bold 12px DungGeunMo, monospace';
          const bubbleMetrics = ctx.measureText(p.bubble.text);
          const bPadding = isReaction ? 12 : 9;
          const bubbleW = Math.max(50, bubbleMetrics.width + bPadding * 2);
          const bubbleH = isReaction ? 40 : 28;
          const bubbleX = centerX - bubbleW / 2;
          const bubbleY = nameY - bubbleH - 10;

          // Bubble Box
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(bubbleX, bubbleY, bubbleW, bubbleH, 7);
          ctx.fill();
          ctx.stroke();

          // Tail pointing to character
          ctx.beginPath();
          ctx.moveTo(centerX - 5, bubbleY + bubbleH);
          ctx.lineTo(centerX, bubbleY + bubbleH + 7);
          ctx.lineTo(centerX + 5, bubbleY + bubbleH);
          ctx.closePath();
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          ctx.stroke();

          // 3-sec countdown timer progress bar
          ctx.fillStyle = '#e2e8f0';
          ctx.fillRect(bubbleX + 3, bubbleY + bubbleH - 3, bubbleW - 6, 2);
          ctx.fillStyle = '#3b82f6';
          ctx.fillRect(bubbleX + 3, bubbleY + bubbleH - 3, (bubbleW - 6) * progress, 2);

          // Bubble Content
          ctx.fillStyle = '#0f172a';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(p.bubble.text, bubbleX + bubbleW / 2, bubbleY + (bubbleH - 3) / 2 + 1);

          ctx.globalAlpha = 1.0;
        }

        ctx.restore();
      });

      ctx.restore();

      animFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      isRunning = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [imageLoaded, charSheetLoaded]);

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const { camX, camY } = latestCamRef.current;
    const worldX = clickX - camX;
    const worldY = clickY - camY;

    // Check click bounds for the Cork Notice Board (588, 416, 54x48) with generous tap padding
    if (
      worldX >= 588 - 30 &&
      worldX <= 588 + 54 + 30 &&
      worldY >= 416 - 45 &&
      worldY <= 416 + 48 + 35
    ) {
      if (onOpenBoardRef.current) {
        onOpenBoardRef.current();
      }
    }
  };

  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full overflow-hidden bg-[#0a0d14]">
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="w-full h-full block pixelated cursor-pointer"
      />
    </div>
  );
}
