/**
 * ECHO GRID - Capacitor Android & Google AdMob Ready Edition
 * Features:
 * 1. Hybrid Google AdMob Native Bridge + Web Simulator Fallback (`ADMOB_CONFIG`)
 *    - Supports Rewarded Video Ads (+3 Moves & Smart Hint) + Interstitial Ads every 3 levels
 * 2. Collision-Aware Floating Tutorial Positioning (Never covers the Player Bot)
 * 3. 5-Cards-Per-Row Mission Select Grid
 * 4. Out-of-Moves Pop-up Modal with Ad Rescue, Retry, Smart Hint & Rewind Safeguard
 * 5. 100% Procedural Level Generator (Levels 1 to Infinity) with BFS Solvability Solver
 */

const LEVELS = [];

/**
 * GOOGLE ADMOB CONFIGURATION
 * Uses Google's official Android demo ad unit IDs while `isTesting: true`.
 * When you publish to Play Store, replace the IDs below with your real AdMob Unit IDs
 * and set `isTesting: false`.
 */
const ADMOB_CONFIG = {
  isTesting: false,
  rewardedMovesAdUnitId: "ca-app-pub-8114131584556922/7242477331",
  rewardedHintAdUnitId: "ca-app-pub-811413584556922/7611189174",
  interstitialAdUnitId: "ca-app-pub-8114131584556922/6338083066",
  interstitialFrequency: 3,
};

/**
 * EXTENSIBLE TUTORIAL REGISTRY
 */
const TUTORIAL_REGISTRY = {
  basic_echo: {
    tag: "🎓 LEVEL 1 TUTORIAL",
    title: "Time-Loop & Echo Basics",
    getSteps: (level) => [
      {
        text: "Step 1: Move your gold Cyber-Bot onto cyan Switch S1.",
        getTarget: () => ({
          type: "tile",
          r: level.switches[0].r,
          c: level.switches[0].c,
        }),
        isDone: (st) =>
          st.echoHistories.length >= 1 ||
          (st.playerPos.r === level.switches[0].r &&
            st.playerPos.c === level.switches[0].c),
      },
      {
        text: "Step 2: Tap '⏪ Lock Loop & Rewind'! Time rewinds and spawns Echo Clone E1.",
        getTarget: () => ({ type: "dom", id: "btn-rewind" }),
        isDone: (st) => st.echoHistories.length >= 1,
      },
      {
        text: "Step 3: Watch E1 walk to S1 for you! Now guide your bot into the green EXIT Portal.",
        getTarget: () => ({ type: "tile", r: level.goal.r, c: level.goal.c }),
        isDone: (st) => st.isLevelWon,
      },
    ],
  },

  twin_echo: {
    tag: "🆕 NEW MECHANIC: TWIN CLONES",
    title: "Dual Echo Synchronization",
    getSteps: (level) => [
      {
        text: "New Update! You now have 2 Echo Clones (0/2). First, walk onto Switch S1.",
        getTarget: () => ({
          type: "tile",
          r: level.switches[0].r,
          c: level.switches[0].c,
        }),
        isDone: (st) =>
          st.echoHistories.length >= 1 ||
          (st.playerPos.r === level.switches[0].r &&
            st.playerPos.c === level.switches[0].c),
      },
      {
        text: "Tap '⏪ Lock Loop & Rewind' to lock in Echo E1 on S1!",
        getTarget: () => ({ type: "dom", id: "btn-rewind" }),
        isDone: (st) => st.echoHistories.length >= 1,
      },
      {
        text: "Now walk to Switch S2 and tap Rewind so Echo E2 holds the second switch!",
        getTarget: (st) =>
          st.playerPos.r === level.switches[1].r &&
          st.playerPos.c === level.switches[1].c
            ? { type: "dom", id: "btn-rewind" }
            : { type: "tile", r: level.switches[1].r, c: level.switches[1].c },
        isDone: (st) => st.echoHistories.length >= 2,
      },
      {
        text: "Both Echoes are active! Walk to the EXIT Portal without colliding with E1 or E2.",
        getTarget: () => ({ type: "tile", r: level.goal.r, c: level.goal.c }),
        isDone: (st) => st.isLevelWon,
      },
    ],
  },

  chrono_crate: {
    tag: "🆕 NEW MECHANIC: CORE CRATES",
    title: "Heavy Chrono-Crate Physics",
    getSteps: (level) => [
      {
        text: "New Update: Purple Core Crates! First, walk to Switch S2 and Rewind so E1 holds it.",
        getTarget: (st) =>
          st.playerPos.r === level.switches[1].r &&
          st.playerPos.c === level.switches[1].c
            ? { type: "dom", id: "btn-rewind" }
            : { type: "tile", r: level.switches[1].r, c: level.switches[1].c },
        isDone: (st) => st.echoHistories.length >= 1,
      },
      {
        text: "Now walk below the purple Core Crate and push it UP onto Switch S1!",
        getTarget: (st) => ({
          type: "tile",
          r: st.crates[0] ? st.crates[0].r : level.switches[0].r,
          c: st.crates[0] ? st.crates[0].c : level.switches[0].c,
        }),
        isDone: (st) =>
          st.crates.some(
            (cr) =>
              cr.r === level.switches[0].r && cr.c === level.switches[0].c,
          ),
      },
      {
        text: "Crate locked on S1! Walk around the Crate into the unlocked EXIT Portal.",
        getTarget: () => ({ type: "tile", r: level.goal.r, c: level.goal.c }),
        isDone: (st) => st.isLevelWon,
      },
    ],
  },

  laser_gate: {
    tag: "🆕 NEW MECHANIC: LASER GATES",
    title: "Laser Barriers & Wait Timing",
    getSteps: (level) => [
      {
        text: "New Update: Red Laser Gate G1 blocks the path! Step onto S1 and Rewind to disable G1.",
        getTarget: (st) =>
          st.playerPos.r === level.switches[0].r &&
          st.playerPos.c === level.switches[0].c
            ? { type: "dom", id: "btn-rewind" }
            : { type: "tile", r: level.switches[0].r, c: level.switches[0].c },
        isDone: (st) => st.echoHistories.length >= 1,
      },
      {
        text: "Next, walk onto Switch S2 and tap Rewind so Echo E2 unlocks the Portal!",
        getTarget: (st) =>
          st.playerPos.r === level.switches[1].r &&
          st.playerPos.c === level.switches[1].c
            ? { type: "dom", id: "btn-rewind" }
            : { type: "tile", r: level.switches[1].r, c: level.switches[1].c },
        isDone: (st) => st.echoHistories.length >= 2,
      },
      {
        text: "Use '⏳ Wait Turn' if E1 hasn't reached S1 yet, then pass through open Gate G1 to the EXIT!",
        getTarget: () => ({
          type: "tile",
          r: level.goal.r,
          c: level.goal.c,
        }),
        isDone: (st) => st.isLevelWon,
      },
    ],
  },
};

// Seeded Random Generator
function createSeededRandom(seed) {
  let t = seed + 0x6d2b79f5;
  return function () {
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// BFS Pathfinding returning the full coordinate array from `start` to `target`
function bfsFindPath(gridSize, start, target, obstacles) {
  const queue = [{ r: start.r, c: start.c, path: [] }];
  const visited = new Set([`${start.r},${start.c}`]);
  const blocked = new Set(obstacles.map((o) => `${o.r},${o.c}`));
  blocked.delete(`${target.r},${target.c}`);

  const dirs = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  while (queue.length > 0) {
    const curr = queue.shift();
    if (curr.r === target.r && curr.c === target.c) {
      return curr.path;
    }

    for (const [dr, dc] of dirs) {
      const nr = curr.r + dr;
      const nc = curr.c + dc;
      const key = `${nr},${nc}`;
      if (
        nr >= 0 &&
        nr < gridSize &&
        nc >= 0 &&
        nc < gridSize &&
        !blocked.has(key) &&
        !visited.has(key)
      ) {
        visited.add(key);
        queue.push({
          r: nr,
          c: nc,
          path: [...curr.path, { r: nr, c: nc }],
        });
      }
    }
  }
  return null;
}

function bfsShortestDistance(gridSize, start, target, obstacles) {
  const path = bfsFindPath(gridSize, start, target, obstacles);
  return path ? path.length : -1;
}

function countOpenNeighbors(gridSize, pos, walls) {
  const blocked = new Set(walls.map((w) => `${w.r},${w.c}`));
  const dirs = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];
  let count = 0;
  for (const [dr, dc] of dirs) {
    const nr = pos.r + dr;
    const nc = pos.c + dc;
    if (
      nr >= 0 &&
      nr < gridSize &&
      nc >= 0 &&
      nc < gridSize &&
      !blocked.has(`${nr},${nc}`)
    ) {
      count++;
    }
  }
  return count;
}

/**
 * 100% PROCEDURAL LEVEL GENERATOR (Level 1 to Infinity)
 */
function generateProceduralLevel(levelNumber) {
  const gridSize = 5;
  const archetype = (levelNumber - 1) % 4;

  for (let attempt = 0; attempt < 80; attempt++) {
    const rng = createSeededRandom(levelNumber * 1301 + attempt * 47);
    const randInt = (min, max) => Math.floor(rng() * (max - min + 1)) + min;

    const start = { r: 4, c: randInt(1, 3) };
    const goal = { r: 0, c: randInt(1, 3), requiredSwitches: [] };
    const occupied = new Set([`${start.r},${start.c}`, `${goal.r},${goal.c}`]);

    const pickFreeTile = (minR, maxR, minC, maxC) => {
      for (let tries = 0; tries < 35; tries++) {
        const r = randInt(minR, maxR);
        const c = randInt(minC, maxC);
        const key = `${r},${c}`;
        if (!occupied.has(key)) {
          occupied.add(key);
          return { r, c };
        }
      }
      return null;
    };

    // ARCHETYPE 0: Echo Recon (Mechanic: basic_echo)
    if (archetype === 0) {
      const swCol = randInt(0, 1) === 0 ? randInt(0, 1) : randInt(3, 4);
      const s1 = pickFreeTile(1, 4, swCol, swCol);
      if (!s1) continue;

      const walls = [];
      const wallCount = levelNumber === 1 ? 2 : randInt(3, 4);
      for (let i = 0; i < wallCount; i++) {
        const w = pickFreeTile(1, 3, 0, 4);
        if (w) walls.push(w);
      }

      if (countOpenNeighbors(gridSize, start, walls) < 2) continue;

      const dS1 = bfsShortestDistance(gridSize, start, s1, walls);
      const dGoal = bfsShortestDistance(gridSize, start, goal, [...walls, s1]);

      if (dS1 > 0 && dGoal > 0) {
        const parMoves = Math.max(dS1, dGoal) + 1;
        return {
          name: `${levelNumber}. Echo Recon`,
          mechanicId: "basic_echo",
          hint: "Step onto Switch S1, tap 'Lock Loop & Rewind', then guide your player to the Portal!",
          gridSize,
          maxEchoes: 1,
          parMoves,
          maxMoves: parMoves + 4,
          start,
          goal: { ...goal, requiredSwitches: [1] },
          switches: [{ ...s1, id: 1 }],
          gates: [],
          crates: [],
          walls,
        };
      }
    }

    // ARCHETYPE 1: Twin Sector (Mechanic: twin_echo)
    if (archetype === 1) {
      const s1 = pickFreeTile(1, 4, 0, 1);
      const s2 = pickFreeTile(1, 4, 3, 4);
      if (!s1 || !s2) continue;

      const walls = [];
      const wallCount = randInt(2, 4);
      for (let i = 0; i < wallCount; i++) {
        const w = pickFreeTile(1, 3, 0, 4);
        if (w) walls.push(w);
      }

      if (countOpenNeighbors(gridSize, start, walls) < 2) continue;

      const dS1 = bfsShortestDistance(gridSize, start, s1, walls);
      const dS2 = bfsShortestDistance(gridSize, start, s2, [...walls, s1]);
      const dGoal = bfsShortestDistance(gridSize, start, goal, [
        ...walls,
        s1,
        s2,
      ]);

      if (dS1 > 0 && dS2 > 0 && dGoal > 0) {
        const parMoves = Math.max(dS1, dS2, dGoal) + 2;
        return {
          name: `${levelNumber}. Twin Sector`,
          mechanicId: "twin_echo",
          hint: "Record E1 on S1 and E2 on S2, then walk to the Portal while both switches are held!",
          gridSize,
          maxEchoes: 2,
          parMoves,
          maxMoves: parMoves + 4,
          start,
          goal: { ...goal, requiredSwitches: [1, 2] },
          switches: [
            { ...s1, id: 1 },
            { ...s2, id: 2 },
          ],
          gates: [],
          crates: [],
          walls,
        };
      }
    }

    // ARCHETYPE 2: Crate Matrix (Mechanic: chrono_crate)
    if (archetype === 2) {
      const crateCol = randInt(0, 1) === 0 ? 0 : 4;
      const crateRow = randInt(2, 3);
      const s1 = { r: crateRow - 1, c: crateCol };
      const crate = { r: crateRow, c: crateCol };
      const pushFrom = { r: crateRow + 1, c: crateCol };

      if (
        occupied.has(`${s1.r},${s1.c}`) ||
        occupied.has(`${crate.r},${crate.c}`) ||
        occupied.has(`${pushFrom.r},${pushFrom.c}`)
      ) {
        continue;
      }
      occupied.add(`${s1.r},${s1.c}`);
      occupied.add(`${crate.r},${crate.c}`);
      occupied.add(`${pushFrom.r},${pushFrom.c}`);

      const oppCol = crateCol === 0 ? randInt(3, 4) : randInt(0, 1);
      const s2 = pickFreeTile(2, 4, oppCol, oppCol);
      if (!s2) continue;

      const walls = [];
      for (let i = 0; i < 2; i++) {
        const w = pickFreeTile(1, 3, 1, 3);
        if (w) walls.push(w);
      }

      if (countOpenNeighbors(gridSize, start, walls) < 2) continue;

      const dS2 = bfsShortestDistance(gridSize, start, s2, [...walls, crate]);
      const dToPush = bfsShortestDistance(gridSize, start, pushFrom, [
        ...walls,
        crate,
        s2,
      ]);
      const dAfterPush = bfsShortestDistance(gridSize, crate, goal, [
        ...walls,
        s1,
        s2,
      ]);

      if (dS2 > 0 && dToPush > 0 && dAfterPush > 0) {
        const playerCrateRoute = dToPush + 1 + dAfterPush;
        const parMoves = Math.max(dS2, playerCrateRoute) + 1;
        return {
          name: `${levelNumber}. Crate Matrix`,
          mechanicId: "chrono_crate",
          hint: "Hold S2 with an Echo, push the purple Core Crate onto S1, and head to the Portal!",
          gridSize,
          maxEchoes: 1,
          parMoves,
          maxMoves: parMoves + 4,
          start,
          goal: { ...goal, requiredSwitches: [1, 2] },
          switches: [
            { ...s1, id: 1 },
            { ...s2, id: 2 },
          ],
          gates: [],
          crates: [crate],
          walls,
        };
      }
    }

    // ARCHETYPE 3: Laser Breach (Mechanic: laser_gate)
    if (archetype === 3) {
      const gateRow = 2;
      const gateCol = goal.c;
      const gate = { r: gateRow, c: gateCol, switchId: 1 };
      occupied.add(`${gate.r},${gate.c}`);

      const walls = [];
      for (let c = 0; c < gridSize; c++) {
        if (c !== gateCol) {
          walls.push({ r: gateRow, c });
          occupied.add(`${gateRow},${c}`);
        }
      }

      const s1 = pickFreeTile(3, 4, 0, 1);
      const s2 = pickFreeTile(3, 4, 3, 4);
      if (!s1 || !s2) continue;

      const dS1 = bfsShortestDistance(gridSize, start, s1, walls);
      const dS2 = bfsShortestDistance(gridSize, start, s2, [...walls, s1]);
      const dGate = bfsShortestDistance(gridSize, start, gate, [
        ...walls,
        s1,
        s2,
      ]);
      const dGoal = bfsShortestDistance(gridSize, gate, goal, [
        ...walls,
        s1,
        s2,
      ]);

      if (dS1 > 0 && dS2 > 0 && dGate > 0 && dGoal > 0) {
        const turnsToPassGate = Math.max(dGate, dS1);
        const parMoves = Math.max(dS1, dS2, turnsToPassGate + dGoal) + 1;
        return {
          name: `${levelNumber}. Laser Breach`,
          mechanicId: "laser_gate",
          hint: "Hold S1 (opens Gate G1) and S2 with Echoes, then pass through G1 to the Portal!",
          gridSize,
          maxEchoes: 2,
          parMoves,
          maxMoves: parMoves + 4,
          start,
          goal: { ...goal, requiredSwitches: [1, 2] },
          switches: [
            { ...s1, id: 1 },
            { ...s2, id: 2 },
          ],
          gates: [gate],
          crates: [],
          walls,
        };
      }
    }
  }

  return {
    name: `${levelNumber}. Quantum Sector`,
    mechanicId: "basic_echo",
    hint: "Step onto Switch S1, tap 'Lock Loop & Rewind', then head to the Portal!",
    gridSize: 5,
    maxEchoes: 1,
    parMoves: 5,
    maxMoves: 9,
    start: { r: 4, c: 2 },
    goal: { r: 0, c: 2, requiredSwitches: [1] },
    switches: [{ r: 4, c: 0, id: 1 }],
    gates: [],
    crates: [],
    walls: [
      { r: 2, c: 1 },
      { r: 2, c: 3 },
    ],
  };
}

function ensureLevelExists(targetIndex) {
  while (LEVELS.length <= targetIndex) {
    LEVELS.push(generateProceduralLevel(LEVELS.length + 1));
  }
}

// Game State
const state = {
  levelIndex: 0,
  turn: 0,
  movesLeft: 0,
  playerPos: { r: 0, c: 0 },
  crates: [],
  currentRunHistory: [],
  echoHistories: [],
  isLevelWon: false,
  soundEnabled: true,
  hintHighlight: null,
  newlyUnlockedLevelIndex: null,
  tutorialActive: false,
  freeHints: parseInt(localStorage.getItem("echoGrid_freeHints") ?? "2", 10),
  pendingAdReward: null,
  adIntervalId: null,
  adMobInitialized: false,
  levelsCompletedSession: 0,
  completedTutorials: JSON.parse(
    localStorage.getItem("echoGrid_tutorials") || "{}",
  ),
  starsByLevel: JSON.parse(localStorage.getItem("echoGrid_stars") || "{}"),
};

// Detect Native Capacitor AdMob Plugin if running inside Android / iOS App
function getNativeAdMobPlugin() {
  if (
    window.Capacitor &&
    typeof window.Capacitor.isNativePlatform === "function" &&
    window.Capacitor.isNativePlatform() &&
    window.Capacitor.Plugins &&
    window.Capacitor.Plugins.AdMob
  ) {
    return window.Capacitor.Plugins.AdMob;
  }
  return null;
}

async function initNativeAdMob() {
  const AdMob = getNativeAdMobPlugin();
  if (!AdMob || state.adMobInitialized) return;
  try {
    await AdMob.initialize({
      initializeForTesting: ADMOB_CONFIG.isTesting,
    });
    state.adMobInitialized = true;
  } catch (err) {
    console.warn("AdMob initialization skipped or offline:", err);
  }
}

async function maybeShowInterstitialAd() {
  state.levelsCompletedSession += 1;
  // Never interrupt tutorial levels (Levels 1-4); show every 3rd completed level afterwards
  if (
    state.levelIndex < 4 ||
    state.levelsCompletedSession % ADMOB_CONFIG.interstitialFrequency !== 0
  ) {
    return;
  }

  const AdMob = getNativeAdMobPlugin();
  if (!AdMob) return;

  try {
    await initNativeAdMob();
    await AdMob.prepareInterstitial({
      adId: ADMOB_CONFIG.interstitialAdUnitId,
      isTesting: ADMOB_CONFIG.isTesting,
    });
    await AdMob.showInterstitial();
  } catch (err) {
    console.warn("Interstitial ad skipped:", err);
  }
}

// Strict Sequential Progression
function getHighestUnlockedIndex() {
  let idx = 0;
  while (state.starsByLevel[idx] && state.starsByLevel[idx] > 0) {
    idx++;
  }
  return idx;
}

// 60FPS HTML5 Canvas Particle Engine
const fxCanvas = document.getElementById("fx-canvas");
const fxCtx = fxCanvas.getContext("2d");
let particles = [];

function resizeCanvas() {
  fxCanvas.width = window.innerWidth;
  fxCanvas.height = window.innerHeight;
  if (state.tutorialActive) {
    requestAnimationFrame(updateFloatingTutorialPosition);
  }
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

function spawnParticles(x, y, color, count = 18, speed = 4) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const velocity = Math.random() * speed + 1;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * velocity,
      vy: Math.sin(angle) * velocity,
      radius: Math.random() * 3.5 + 1.5,
      color,
      alpha: 1,
      decay: Math.random() * 0.025 + 0.018,
    });
  }
}

function spawnTileBurst(r, c, color, count = 16) {
  const tileEl = gridBoard.children[r * 5 + c];
  if (!tileEl) return;
  const rect = tileEl.getBoundingClientRect();
  spawnParticles(
    rect.left + rect.width / 2,
    rect.top + rect.height / 2,
    color,
    count,
  );
}

function animateParticles() {
  fxCtx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.alpha -= p.decay;

    if (p.alpha <= 0) {
      particles.splice(i, 1);
      continue;
    }

    fxCtx.save();
    fxCtx.globalAlpha = p.alpha;
    fxCtx.fillStyle = p.color;
    fxCtx.shadowBlur = 8;
    fxCtx.shadowColor = p.color;
    fxCtx.beginPath();
    fxCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    fxCtx.fill();
    fxCtx.restore();
  }
  requestAnimationFrame(animateParticles);
}
requestAnimationFrame(animateParticles);

// Web Audio API Synthesizer
let audioCtx = null;
function playSound(type) {
  if (!state.soundEnabled) return;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  const now = audioCtx.currentTime;

  if (type === "step") {
    osc.type = "sine";
    osc.frequency.setValueAtTime(340, now);
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.06);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
    osc.start(now);
    osc.stop(now + 0.06);
  } else if (type === "push") {
    osc.type = "triangle";
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(280, now + 0.09);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);
    osc.start(now);
    osc.stop(now + 0.09);
  } else if (type === "rewind") {
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(640, now);
    osc.frequency.exponentialRampToValueAtTime(210, now + 0.24);
    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.24);
    osc.start(now);
    osc.stop(now + 0.24);
  } else if (type === "hint") {
    osc.type = "sine";
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(780, now + 0.14);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);
    osc.start(now);
    osc.stop(now + 0.14);
  } else if (type === "paradox") {
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.setValueAtTime(112, now + 0.09);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    osc.start(now);
    osc.stop(now + 0.2);
  } else if (type === "fail") {
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.linearRampToValueAtTime(175, now + 0.16);
    osc.frequency.linearRampToValueAtTime(115, now + 0.34);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.36);
    osc.start(now);
    osc.stop(now + 0.36);
  } else if (type === "win") {
    osc.type = "triangle";
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.setValueAtTime(554, now + 0.1);
    osc.frequency.setValueAtTime(659, now + 0.2);
    osc.frequency.setValueAtTime(880, now + 0.3);
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
    osc.start(now);
    osc.stop(now + 0.45);
  }
}

// Custom SVG Graphics Templates
const SVG_GRAPHICS = {
  player: `
    <svg viewBox="0 0 64 64" width="100%" height="100%">
      <circle cx="32" cy="32" r="26" fill="#f59e0b" stroke="#fef08a" stroke-width="3"/>
      <rect x="16" y="20" width="32" height="16" rx="8" fill="#090d16"/>
      <circle cx="25" cy="28" r="4" fill="#38bdf8"/>
      <circle cx="39" cy="28" r="4" fill="#38bdf8"/>
      <path d="M24 44 Q32 49 40 44" stroke="#090d16" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    </svg>
  `,
  echo: `
    <svg viewBox="0 0 64 64" width="100%" height="100%">
      <circle cx="32" cy="32" r="25" fill="rgba(6,182,212,0.35)" stroke="#22d3ee" stroke-width="3" stroke-dasharray="6 3"/>
      <rect x="18" y="22" width="28" height="14" rx="7" fill="#083344"/>
      <circle cx="26" cy="29" r="3.5" fill="#67e8f9"/>
      <circle cx="38" cy="29" r="3.5" fill="#67e8f9"/>
    </svg>
  `,
  crate: `
    <svg viewBox="0 0 64 64" width="100%" height="100%">
      <rect x="8" y="8" width="48" height="48" rx="10" fill="#581c87" stroke="#c084fc" stroke-width="3.5"/>
      <rect x="16" y="16" width="32" height="32" rx="6" fill="#3b0764" stroke="#a855f7" stroke-width="2"/>
      <circle cx="32" cy="32" r="7" fill="#e879f9"/>
      <path d="M16 16 L25 25 M48 16 L39 25 M16 48 L25 39 M48 48 L39 39" stroke="#c084fc" stroke-width="2.5"/>
    </svg>
  `,
  switchPad: (active) => `
    <svg class="tile-decor-svg" viewBox="0 0 64 64">
      <circle cx="32" cy="32" r="22" fill="none" stroke="${active ? "#22d3ee" : "#0891b2"}" stroke-width="3" stroke-dasharray="5 4"/>
      <circle cx="32" cy="32" r="10" fill="${active ? "#22d3ee" : "rgba(6,182,212,0.3)"}"/>
    </svg>
  `,
  gateClosed: `
    <svg class="tile-decor-svg laser-beam" viewBox="0 0 64 64">
      <line x1="6" y1="20" x2="58" y2="20" stroke="#f43f5e" stroke-width="4" stroke-linecap="round"/>
      <line x1="6" y1="32" x2="58" y2="32" stroke="#fda4af" stroke-width="3" stroke-linecap="round"/>
      <line x1="6" y1="44" x2="58" y2="44" stroke="#f43f5e" stroke-width="4" stroke-linecap="round"/>
    </svg>
  `,
  portal: (open) => `
    <svg class="tile-decor-svg ${open ? "spin-vortex" : ""}" viewBox="0 0 64 64">
      <circle cx="32" cy="32" r="24" fill="none" stroke="${open ? "#34d399" : "#f43f5e"}" stroke-width="4" stroke-dasharray="10 6"/>
      <circle cx="32" cy="32" r="14" fill="none" stroke="${open ? "#6ee7b7" : "#fda4af"}" stroke-width="3" stroke-dasharray="6 4"/>
      <circle cx="32" cy="32" r="5" fill="${open ? "#10b981" : "#e11d48"}"/>
    </svg>
  `,
};

// DOM Elements
const gridBoard = document.getElementById("grid-board");
const levelBadge = document.getElementById("level-badge");
const levelTitle = document.getElementById("level-title");
const levelStarsDisplay = document.getElementById("level-stars-display");
const levelHint = document.getElementById("level-hint");
const movesLeftEl = document.getElementById("moves-left");
const echoesUsedEl = document.getElementById("echoes-used");
const portalStatusEl = document.getElementById("portal-status");
const toastAlert = document.getElementById("toast-alert");
const btnTutorial = document.getElementById("btn-tutorial");
const btnHint = document.getElementById("btn-hint");
const btnSound = document.getElementById("btn-sound");
const btnLevels = document.getElementById("btn-levels");
const btnWait = document.getElementById("btn-wait");
const btnRewind = document.getElementById("btn-rewind");
const btnReset = document.getElementById("btn-reset");

// Floating Tutorial DOM Elements
const tutorialLayer = document.getElementById("tutorial-layer");
const tutorialRing = document.getElementById("tutorial-ring");
const tutorialCard = document.getElementById("tutorial-card");
const tutorialTag = document.getElementById("tutorial-tag");
const tutorialStepBadge = document.getElementById("tutorial-step-badge");
const tutorialTitle = document.getElementById("tutorial-title");
const tutorialText = document.getElementById("tutorial-text");
const btnSkipTutorial = document.getElementById("btn-skip-tutorial");

// Victory Modal DOM
const victoryModal = document.getElementById("victory-modal");
const victoryLevelName = document.getElementById("victory-level-name");
const victoryStars = document.getElementById("victory-stars");
const victorySummary = document.getElementById("victory-summary");
const btnWinMenu = document.getElementById("btn-win-menu");
const btnWinReplay = document.getElementById("btn-win-replay");
const btnWinNext = document.getElementById("btn-win-next");

// Out of Moves Modal DOM
const gameoverModal = document.getElementById("gameover-modal");
const gameoverSummary = document.getElementById("gameover-summary");
const btnFailAdMoves = document.getElementById("btn-fail-ad-moves");
const btnFailRetry = document.getElementById("btn-fail-retry");
const btnFailHint = document.getElementById("btn-fail-hint");
const btnFailRewind = document.getElementById("btn-fail-rewind");

// Level Select Modal DOM
const levelModal = document.getElementById("level-modal");
const levelGrid = document.getElementById("level-grid");
const totalStarsLabel = document.getElementById("total-stars-label");
const menuUnlockBanner = document.getElementById("menu-unlock-banner");
const btnCloseModal = document.getElementById("btn-close-modal");

// Rewarded Ad Simulator Modal DOM
const rewardAdModal = document.getElementById("reward-ad-modal");
const adTimerBadge = document.getElementById("ad-timer-badge");
const adHeadline = document.getElementById("ad-headline");
const adSubtext = document.getElementById("ad-subtext");
const adProgressFill = document.getElementById("ad-progress-fill");
const btnCancelAd = document.getElementById("btn-cancel-ad");
const btnClaimAd = document.getElementById("btn-claim-ad");

function formatStars(count) {
  return "★".repeat(count) + "☆".repeat(3 - count);
}

function showToast(msg) {
  toastAlert.textContent = msg;
  toastAlert.classList.remove("hidden");
}

function clearToast() {
  toastAlert.classList.add("hidden");
}

function updateHintButtonsUI() {
  if (state.freeHints > 0) {
    btnHint.textContent = `💡 Hint (${state.freeHints})`;
    btnHint.classList.remove("ad-mode");
    btnFailHint.textContent = `💡 Smart Hint (${state.freeHints})`;
  } else {
    btnHint.textContent = "🎬 Watch Ad for Hint";
    btnHint.classList.add("ad-mode");
    btnFailHint.textContent = "🎬 Watch Ad for Hint";
  }
}

/**
 * HYBRID REWARDED VIDEO AD ENGINE
 * 1. If running in Native Android/iOS Capacitor App -> Calls Google AdMob Rewarded Video API
 * 2. If running on Web (GitHub Pages / Live Server) -> Runs 5-second HTML5 Ad Simulator
 * @param {"MOVES" | "HINT"} rewardType
 */
async function startRewardedAd(rewardType) {
  state.pendingAdReward = rewardType;
  tutorialLayer.classList.add("hidden");

  const AdMob = getNativeAdMobPlugin();
  if (AdMob) {
    try {
      await initNativeAdMob();
      const adUnitId =
        rewardType === "MOVES"
          ? ADMOB_CONFIG.rewardedMovesAdUnitId
          : ADMOB_CONFIG.rewardedHintAdUnitId;

      await AdMob.prepareRewardVideoAd({
        adId: adUnitId,
        isTesting: ADMOB_CONFIG.isTesting,
      });

      const rewardItem = await AdMob.showRewardVideoAd();
      if (rewardItem) {
        claimAdReward();
      }
      return;
    } catch (err) {
      console.warn("Native AdMob unavailable, using fallback simulator:", err);
    }
  }

  // Web & Offline Fallback: 5-second Interactive Rewarded Video Simulator
  if (rewardType === "MOVES") {
    adHeadline.textContent = "🎬 Reward: +3 Extra Moves";
    adSubtext.textContent =
      "Watch this 5-second sponsored preview to continue your current timeline with +3 Moves!";
  } else {
    adHeadline.textContent = "🎬 Reward: Smart Tactical Hint";
    adSubtext.textContent =
      "Watch this 5-second sponsored preview to unlock a live Smart Hint on the puzzle grid!";
  }

  let secondsLeft = 5;
  adTimerBadge.textContent = `Reward in ${secondsLeft}s`;
  adProgressFill.style.width = "0%";
  btnClaimAd.disabled = true;
  btnClaimAd.textContent = `⏳ Watching Ad (${secondsLeft}s)...`;

  rewardAdModal.classList.remove("hidden");

  if (state.adIntervalId) clearInterval(state.adIntervalId);

  state.adIntervalId = setInterval(() => {
    secondsLeft -= 1;
    const progressPercent = ((5 - secondsLeft) / 5) * 100;
    adProgressFill.style.width = `${progressPercent}%`;

    if (secondsLeft > 0) {
      adTimerBadge.textContent = `Reward in ${secondsLeft}s`;
      btnClaimAd.textContent = `⏳ Watching Ad (${secondsLeft}s)...`;
    } else {
      clearInterval(state.adIntervalId);
      state.adIntervalId = null;
      adTimerBadge.textContent = "✅ Reward Ready!";
      btnClaimAd.disabled = false;
      btnClaimAd.textContent =
        rewardType === "MOVES"
          ? "🎁 Claim +3 Moves Now!"
          : "🎁 Claim Smart Hint Now!";
      playSound("win");
    }
  }, 1000);
}

function claimAdReward() {
  const rewardType = state.pendingAdReward;
  state.pendingAdReward = null;
  rewardAdModal.classList.add("hidden");

  if (rewardType === "MOVES") {
    gameoverModal.classList.add("hidden");
    state.movesLeft += 3;
    spawnTileBurst(state.playerPos.r, state.playerPos.c, "#10b981", 28);
    showToast("🎬 Ad Reward Claimed! +3 Extra Moves added to your timeline!");
    render();
  } else if (rewardType === "HINT") {
    const wasOutOfMoves = !gameoverModal.classList.contains("hidden");
    gameoverModal.classList.add("hidden");
    if (wasOutOfMoves) {
      initLevel(state.levelIndex, false);
    }
    state.tutorialActive = false;
    tutorialLayer.classList.add("hidden");
    state.freeHints += 1;
    localStorage.setItem("echoGrid_freeHints", String(state.freeHints));
    executeHintLogic();
  }
}

// Helper to check if two rectangles overlap on screen
function rectsOverlap(r1, r2, margin = 8) {
  if (!r1 || !r2) return false;
  return !(
    r1.right + margin < r2.left ||
    r1.left - margin > r2.right ||
    r1.bottom + margin < r2.top ||
    r1.top - margin > r2.bottom
  );
}

/**
 * COLLISION-AWARE FLOATING TUTORIAL ENGINE
 */
function updateFloatingTutorialPosition() {
  if (
    !state.tutorialActive ||
    state.isLevelWon ||
    !gameoverModal.classList.contains("hidden") ||
    !rewardAdModal.classList.contains("hidden")
  ) {
    tutorialLayer.classList.add("hidden");
    return;
  }

  const level = LEVELS[state.levelIndex];
  const config = TUTORIAL_REGISTRY[level.mechanicId];
  if (!config) {
    tutorialLayer.classList.add("hidden");
    return;
  }

  const steps = config.getSteps(level);
  const activeStepIndex = steps.findIndex((step) => !step.isDone(state));

  if (activeStepIndex === -1) {
    tutorialLayer.classList.add("hidden");
    return;
  }

  const currentStep = steps[activeStepIndex];
  tutorialTag.textContent = config.tag;
  tutorialStepBadge.textContent = `STEP ${activeStepIndex + 1} / ${steps.length}`;
  tutorialTitle.textContent = config.title;
  tutorialText.textContent = currentStep.text;

  const targetInfo = currentStep.getTarget(state);
  let targetEl = null;

  if (targetInfo && targetInfo.type === "tile") {
    targetEl = gridBoard.children[targetInfo.r * level.gridSize + targetInfo.c];
  } else if (targetInfo && targetInfo.type === "dom") {
    targetEl = document.getElementById(targetInfo.id);
  }

  if (!targetEl) {
    tutorialLayer.classList.add("hidden");
    return;
  }

  tutorialLayer.classList.remove("hidden");

  const rect = targetEl.getBoundingClientRect();
  const pad = 6;
  tutorialRing.style.top = `${rect.top - pad}px`;
  tutorialRing.style.left = `${rect.left - pad}px`;
  tutorialRing.style.width = `${rect.width + pad * 2}px`;
  tutorialRing.style.height = `${rect.height + pad * 2}px`;

  const playerTileEl =
    gridBoard.children[state.playerPos.r * level.gridSize + state.playerPos.c];
  const playerRect = playerTileEl ? playerTileEl.getBoundingClientRect() : null;
  const boardRect = gridBoard.getBoundingClientRect();

  const cardWidth = Math.min(340, window.innerWidth * 0.92);
  const cardHeight = tutorialCard.offsetHeight || 118;

  let cardLeft = rect.left + rect.width / 2 - cardWidth / 2;
  cardLeft = Math.max(
    12,
    Math.min(cardLeft, window.innerWidth - cardWidth - 12),
  );

  const aboveTop = rect.top - cardHeight - 38;
  const belowTop = rect.bottom + 14;
  const topBoardY = Math.max(12, boardRect.top + 8);
  const bottomBoardY = Math.min(
    window.innerHeight - cardHeight - 12,
    boardRect.bottom - cardHeight - 8,
  );

  const preferAbove = targetInfo.type === "tile" && targetInfo.r >= 2;
  const candidateYs = preferAbove
    ? [aboveTop, topBoardY, belowTop, bottomBoardY]
    : [belowTop, aboveTop, bottomBoardY, topBoardY];

  let chosenTop = candidateYs[0];

  for (const y of candidateYs) {
    if (y < 10 || y + cardHeight > window.innerHeight - 10) continue;
    const candidateBox = {
      top: y,
      bottom: y + cardHeight,
      left: cardLeft,
      right: cardLeft + cardWidth,
    };
    const hitsTarget = rectsOverlap(candidateBox, rect, 4);
    const hitsPlayer = rectsOverlap(candidateBox, playerRect, 10);

    if (!hitsTarget && !hitsPlayer) {
      chosenTop = y;
      break;
    }
  }

  chosenTop = Math.max(
    12,
    Math.min(chosenTop, window.innerHeight - cardHeight - 12),
  );

  tutorialCard.style.top = `${chosenTop}px`;
  tutorialCard.style.left = `${cardLeft}px`;
}

// Initialize Level
function initLevel(index, forceTutorial = false) {
  const highestUnlocked = getHighestUnlockedIndex();
  if (index > highestUnlocked) {
    index = highestUnlocked;
  }

  ensureLevelExists(index);
  state.levelIndex = index;
  localStorage.setItem("echoGrid_savedLevel", String(index));

  const level = LEVELS[index];

  state.turn = 0;
  state.movesLeft = level.maxMoves;
  state.playerPos = { ...level.start };
  state.crates = level.crates.map((c) => ({ ...c }));
  state.currentRunHistory = [{ ...level.start }];
  state.echoHistories = [];
  state.isLevelWon = false;
  state.hintHighlight = null;

  const hasSeenMechanic = Boolean(state.completedTutorials[level.mechanicId]);
  state.tutorialActive =
    forceTutorial ||
    (!hasSeenMechanic && Boolean(TUTORIAL_REGISTRY[level.mechanicId]));

  btnRewind.classList.remove("pulse-attention");
  btnWait.classList.remove("pulse-attention");
  victoryModal.classList.add("hidden");
  gameoverModal.classList.add("hidden");
  rewardAdModal.classList.add("hidden");
  clearToast();
  render();
}

function getEchoPosAtTurn(history, turn) {
  const clampedIndex = Math.min(turn, history.length - 1);
  return history[clampedIndex];
}

function isTileInEchoTrail(r, c) {
  return state.echoHistories.some((history) =>
    history.some((pos) => pos.r === r && pos.c === c),
  );
}

function isSwitchCoveredByEchoOrCrate(switchId) {
  const level = LEVELS[state.levelIndex];
  const sw = level.switches.find((s) => s.id === switchId);
  if (!sw) return false;

  if (state.crates.some((c) => c.r === sw.r && c.c === sw.c)) {
    return true;
  }

  return state.echoHistories.some((history) => {
    const finalPos = history[history.length - 1];
    return finalPos.r === sw.r && finalPos.c === sw.c;
  });
}

function isSwitchPressed(switchId) {
  const level = LEVELS[state.levelIndex];
  const sw = level.switches.find((s) => s.id === switchId);
  if (!sw) return false;

  if (state.playerPos.r === sw.r && state.playerPos.c === sw.c) {
    return true;
  }

  if (state.crates.some((c) => c.r === sw.r && c.c === sw.c)) {
    return true;
  }

  return state.echoHistories.some((history) => {
    const pos = getEchoPosAtTurn(history, state.turn);
    return pos.r === sw.r && pos.c === sw.c;
  });
}

function isPortalUnlocked() {
  const level = LEVELS[state.levelIndex];
  return level.goal.requiredSwitches.every((id) => isSwitchPressed(id));
}

function isTileBlocked(r, c, nextTurn) {
  const level = LEVELS[state.levelIndex];

  if (r < 0 || r >= level.gridSize || c < 0 || c >= level.gridSize) {
    return true;
  }

  if (level.walls.some((w) => w.r === r && w.c === c)) {
    return true;
  }

  const gate = level.gates.find((g) => g.r === r && g.c === c);
  if (gate) {
    const sw = level.switches.find((s) => s.id === gate.switchId);
    const heldByPlayer = r === sw.r && c === sw.c;
    const heldByCrate = state.crates.some(
      (cr) => cr.r === sw.r && cr.c === sw.c,
    );
    const heldByEcho = state.echoHistories.some((history) => {
      const pos = getEchoPosAtTurn(history, nextTurn);
      return pos.r === sw.r && pos.c === sw.c;
    });
    if (!heldByPlayer && !heldByCrate && !heldByEcho) {
      return true;
    }
  }

  return false;
}

// Request a Smart Hint
function triggerSmartHint() {
  if (state.isLevelWon) return;

  if (state.freeHints <= 0) {
    startRewardedAd("HINT");
    return;
  }

  executeHintLogic();
}

function executeHintLogic() {
  if (state.isLevelWon) return;

  state.freeHints = Math.max(0, state.freeHints - 1);
  localStorage.setItem("echoGrid_freeHints", String(state.freeHints));
  updateHintButtonsUI();

  const level = LEVELS[state.levelIndex];
  playSound("hint");

  btnRewind.classList.remove("pulse-attention");
  btnWait.classList.remove("pulse-attention");

  const standingSwitch = level.switches.find(
    (s) => s.r === state.playerPos.r && s.c === state.playerPos.c,
  );

  if (
    standingSwitch &&
    state.echoHistories.length < level.maxEchoes &&
    !isSwitchCoveredByEchoOrCrate(standingSwitch.id)
  ) {
    btnRewind.classList.add("pulse-attention");
    spawnTileBurst(state.playerPos.r, state.playerPos.c, "#fbbf24", 20);
    showToast(
      `💡 Smart Hint: You reached Switch S${standingSwitch.id}! Tap '⏪ Lock Loop & Rewind' so your Echo holds it!`,
    );
    render();
    return;
  }

  let targetTile = null;
  let hintText = "";

  const unplacedCrate = state.crates.find(
    (cr) => !level.switches.some((s) => s.r === cr.r && s.c === cr.c),
  );

  const uncoveredSwitches = level.switches.filter(
    (s) => !isSwitchCoveredByEchoOrCrate(s.id),
  );

  if (
    state.echoHistories.length < level.maxEchoes &&
    uncoveredSwitches.length > 0
  ) {
    const echoSwitch =
      uncoveredSwitches.find(
        (s) =>
          !unplacedCrate ||
          Math.abs(s.r - unplacedCrate.r) + Math.abs(s.c - unplacedCrate.c) > 1,
      ) || uncoveredSwitches[0];

    targetTile = { r: echoSwitch.r, c: echoSwitch.c };
    hintText = `💡 Smart Hint: Move toward Switch S${echoSwitch.id} (gold target) to record Echo E${state.echoHistories.length + 1}!`;
  } else if (unplacedCrate) {
    targetTile = { r: unplacedCrate.r, c: unplacedCrate.c };
    hintText =
      "💡 Smart Hint: Walk up to the purple Core Crate and push it onto its adjacent Switch!";
  } else {
    targetTile = { r: level.goal.r, c: level.goal.c };
    hintText =
      "💡 Smart Hint: Switches are covered! Follow the gold step markers to the EXIT Portal.";
  }

  const echoFinalTiles = state.echoHistories.map(
    (history) => history[history.length - 1],
  );
  const obstacles = [...level.walls, ...echoFinalTiles];
  const fullPath =
    bfsFindPath(level.gridSize, state.playerPos, targetTile, obstacles) || [];
  const partialSteps = fullPath.slice(0, 2);

  state.hintHighlight = {
    steps: partialSteps,
    target: targetTile,
  };

  if (targetTile) {
    spawnTileBurst(targetTile.r, targetTile.c, "#fbbf24", 22);
  }
  showToast(hintText);
  render();
}

// Open Out of Moves Modal
function openGameOverModal() {
  const level = LEVELS[state.levelIndex];
  const canStillRewind =
    state.echoHistories.length < level.maxEchoes &&
    state.currentRunHistory.length > 1;

  tutorialLayer.classList.add("hidden");
  updateHintButtonsUI();
  playSound("fail");
  spawnTileBurst(state.playerPos.r, state.playerPos.c, "#f43f5e", 24);

  if (canStillRewind) {
    btnFailRewind.classList.remove("hidden");
    gameoverSummary.textContent =
      "0 moves left! Watch a short ad for +3 Extra Moves, tap '⏪ Lock & Rewind' to save this Echo, or retry.";
  } else {
    btnFailRewind.classList.add("hidden");
    gameoverSummary.textContent =
      "You ran out of moves before reaching the EXIT Portal. Watch an ad for +3 Moves or retry!";
  }

  gameoverModal.classList.remove("hidden");
}

// Execute a player step (or WAIT)
function stepTurn(dr, dc) {
  if (state.isLevelWon || state.movesLeft <= 0) return;
  clearToast();
  state.hintHighlight = null;
  btnRewind.classList.remove("pulse-attention");
  btnWait.classList.remove("pulse-attention");

  const level = LEVELS[state.levelIndex];
  const nextR = state.playerPos.r + dr;
  const nextC = state.playerPos.c + dc;
  const nextTurn = state.turn + 1;

  if (isTileBlocked(nextR, nextC, nextTurn)) {
    playSound("paradox");
    showToast(
      "🚧 Path blocked! Check walls or locked red Laser Gates (tap Wait Turn if an Echo is on its way).",
    );
    return;
  }

  // Time Paradox Check
  const collidingEchoIndex = state.echoHistories.findIndex((history) => {
    const echoNextPos = getEchoPosAtTurn(history, nextTurn);
    return echoNextPos.r === nextR && echoNextPos.c === nextC;
  });

  if (collidingEchoIndex !== -1) {
    playSound("paradox");
    spawnTileBurst(nextR, nextC, "#f43f5e", 20);
    showToast(
      `⚠️ Time Paradox! Echo E${collidingEchoIndex + 1} occupies that tile—tap '⏳ Wait Turn' or step around it!`,
    );
    return;
  }

  // Crate Pushing Logic
  let pushedCrate = false;
  const crateIdx = state.crates.findIndex(
    (cr) => cr.r === nextR && cr.c === nextC,
  );
  if (crateIdx !== -1) {
    if (dr === 0 && dc === 0) return;
    const crateNextR = nextR + dr;
    const crateNextC = nextC + dc;
    const anotherCrate = state.crates.some(
      (cr) => cr.r === crateNextR && cr.c === crateNextC,
    );
    const isGoalTile =
      crateNextR === level.goal.r && crateNextC === level.goal.c;

    if (isGoalTile) {
      playSound("paradox");
      showToast(
        "📦 Leave the Core Crate on the Switch and walk around it to the Portal!",
      );
      return;
    }

    if (isTileBlocked(crateNextR, crateNextC, nextTurn) || anotherCrate) {
      playSound("paradox");
      return;
    }
    state.crates[crateIdx] = { r: crateNextR, c: crateNextC };
    pushedCrate = true;
    spawnTileBurst(crateNextR, crateNextC, "#c084fc", 18);
  }

  state.playerPos = { r: nextR, c: nextC };
  state.turn = nextTurn;
  state.movesLeft -= 1;
  state.currentRunHistory.push({ ...state.playerPos });

  playSound(pushedCrate ? "push" : "step");
  spawnTileBurst(nextR, nextC, "#38bdf8", 8);

  checkWinCondition();
  render();

  if (!state.isLevelWon && state.movesLeft <= 0) {
    setTimeout(() => {
      if (!state.isLevelWon && state.movesLeft <= 0) {
        openGameOverModal();
      }
    }, 220);
  }
}

// Save current path as an Echo and rewind time to Turn 0
function rewindLoop() {
  const level = LEVELS[state.levelIndex];
  if (state.isLevelWon) return;
  if (state.echoHistories.length >= level.maxEchoes) return;
  if (state.currentRunHistory.length <= 1) return;

  gameoverModal.classList.add("hidden");
  state.echoHistories.push([...state.currentRunHistory]);
  state.turn = 0;
  state.movesLeft = level.maxMoves;
  state.playerPos = { ...level.start };
  state.crates = level.crates.map((c) => ({ ...c }));
  state.currentRunHistory = [{ ...level.start }];
  state.hintHighlight = null;
  btnRewind.classList.remove("pulse-attention");

  playSound("rewind");
  spawnTileBurst(level.start.r, level.start.c, "#22d3ee", 26);
  showToast(
    `⏪ Time Rewound! Echo E${state.echoHistories.length} is now replaying your previous path.`,
  );
  render();
}

// Check Win Condition & Open Victory Pop-up Window
function checkWinCondition() {
  const level = LEVELS[state.levelIndex];
  const onGoal =
    state.playerPos.r === level.goal.r && state.playerPos.c === level.goal.c;

  if (onGoal && isPortalUnlocked()) {
    state.isLevelWon = true;
    state.tutorialActive = false;
    tutorialLayer.classList.add("hidden");
    gameoverModal.classList.add("hidden");

    if (level.mechanicId) {
      state.completedTutorials[level.mechanicId] = true;
      localStorage.setItem(
        "echoGrid_tutorials",
        JSON.stringify(state.completedTutorials),
      );
    }

    playSound("win");

    const movesUsed = level.maxMoves - state.movesLeft;
    let earnedStars = 1;
    if (movesUsed <= level.parMoves) {
      earnedStars = 3;
    } else if (movesUsed <= level.parMoves + 2) {
      earnedStars = 2;
    }

    const prevBest = state.starsByLevel[state.levelIndex] || 0;
    if (earnedStars > prevBest) {
      state.starsByLevel[state.levelIndex] = earnedStars;
      localStorage.setItem(
        "echoGrid_stars",
        JSON.stringify(state.starsByLevel),
      );
    }

    state.newlyUnlockedLevelIndex = state.levelIndex + 1;

    spawnParticles(
      window.innerWidth * 0.35,
      window.innerHeight * 0.4,
      "#fbbf24",
      35,
      6,
    );
    spawnParticles(
      window.innerWidth * 0.65,
      window.innerHeight * 0.4,
      "#34d399",
      35,
      6,
    );

    openVictoryModal(level.name, earnedStars, movesUsed);
  }
}

function openVictoryModal(levelName, earnedStars, movesUsed) {
  victoryLevelName.textContent = levelName;
  victorySummary.textContent = `Solved in ${movesUsed} moves! Level ${state.levelIndex + 2} is now unlocked.`;

  const starEls = victoryStars.querySelectorAll(".star-slot");
  starEls.forEach((el, idx) => {
    el.classList.remove("earned");
    if (idx < earnedStars) {
      setTimeout(
        () => {
          el.classList.add("earned");
        },
        (idx + 1) * 180,
      );
    }
  });

  victoryModal.classList.remove("hidden");
}

// Open Level Select Modal (5 Cards Per Row)
function openLevelModal(highlightUnlockedIndex = null) {
  const highestUnlocked = getHighestUnlockedIndex();
  const minCards = Math.max(highestUnlocked + 5, 15);
  const totalCardsToShow = Math.ceil(minCards / 5) * 5;
  ensureLevelExists(totalCardsToShow);

  levelGrid.innerHTML = "";

  const totalStars = Object.values(state.starsByLevel).reduce(
    (sum, s) => sum + s,
    0,
  );
  totalStarsLabel.textContent = `Total Stars Earned: ★ ${totalStars}`;

  if (highlightUnlockedIndex !== null) {
    menuUnlockBanner.textContent = `🔓 Level ${highlightUnlockedIndex + 1} Unlocked! Tap the glowing green card below to start.`;
    menuUnlockBanner.classList.remove("hidden");
  } else {
    menuUnlockBanner.classList.add("hidden");
  }

  for (let i = 0; i < totalCardsToShow; i++) {
    ensureLevelExists(i);
    const isLocked = i > highestUnlocked;
    const isNewlyUnlocked = i === highlightUnlockedIndex;
    const stars = state.starsByLevel[i] || 0;

    const card = document.createElement("div");
    card.className = "level-card";
    if (isLocked) card.classList.add("locked-card");
    else if (isNewlyUnlocked) card.classList.add("newly-unlocked");
    else if (i === state.levelIndex) card.classList.add("active-level");

    if (isLocked) {
      card.innerHTML = `
        <span class="level-card-num">🔒 Lv ${i + 1}</span>
        <span class="level-card-tag">Beat Lv ${i} first</span>
        <span class="level-card-stars">---</span>
      `;
      card.addEventListener("click", () => {
        playSound("paradox");
        menuUnlockBanner.textContent = `🔒 Locked! You must complete Level ${highestUnlocked + 1} before playing Level ${i + 1}.`;
        menuUnlockBanner.classList.remove("hidden");
      });
    } else {
      card.innerHTML = `
        <span class="level-card-num">${isNewlyUnlocked ? "🔓 " : ""}Level ${i + 1}</span>
        <span class="level-card-tag">${isNewlyUnlocked ? "NEW UNLOCK!" : "⚡ Auto-Gen"}</span>
        <span class="level-card-stars">${formatStars(stars)}</span>
      `;
      card.addEventListener("click", () => {
        state.newlyUnlockedLevelIndex = null;
        levelModal.classList.add("hidden");
        initLevel(i);
      });
    }

    levelGrid.appendChild(card);

    if (isNewlyUnlocked) {
      setTimeout(() => {
        card.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }
  }

  levelModal.classList.remove("hidden");
}

// Render the Board, HUD, and Floating Tutorial Overlay
function render() {
  const level = LEVELS[state.levelIndex];
  const portalOpen = isPortalUnlocked();
  const savedStars = state.starsByLevel[state.levelIndex] || 0;

  updateHintButtonsUI();

  levelBadge.textContent = `LEVEL ${state.levelIndex + 1}`;
  levelTitle.textContent = level.name;
  levelStarsDisplay.textContent = formatStars(savedStars);
  levelHint.textContent = level.hint;
  movesLeftEl.textContent = state.movesLeft;
  echoesUsedEl.textContent = `${state.echoHistories.length} / ${level.maxEchoes}`;

  portalStatusEl.textContent = portalOpen ? "OPEN" : "LOCKED";
  portalStatusEl.className = `stat-value ${portalOpen ? "unlocked" : "locked"}`;

  btnRewind.disabled =
    state.echoHistories.length >= level.maxEchoes ||
    state.currentRunHistory.length <= 1 ||
    state.isLevelWon;
  btnWait.disabled = state.movesLeft <= 0 || state.isLevelWon;

  gridBoard.innerHTML = "";

  for (let r = 0; r < level.gridSize; r++) {
    for (let c = 0; c < level.gridSize; c++) {
      const tile = document.createElement("div");
      tile.className = "tile";

      if (level.walls.some((w) => w.r === r && w.c === c)) {
        tile.classList.add("wall");
      }

      const sw = level.switches.find((s) => s.r === r && s.c === c);
      if (sw) {
        const active = isSwitchPressed(sw.id);
        tile.classList.add("switch");
        if (active) tile.classList.add("active");
        tile.insertAdjacentHTML("beforeend", SVG_GRAPHICS.switchPad(active));

        const tag = document.createElement("span");
        tag.className = "tile-tag";
        tag.textContent = `S${sw.id}`;
        tile.appendChild(tag);
      }

      const gate = level.gates.find((g) => g.r === r && g.c === c);
      if (gate) {
        const open = isSwitchPressed(gate.switchId);
        tile.classList.add(open ? "gate-open" : "gate-closed");
        if (!open) {
          tile.insertAdjacentHTML("beforeend", SVG_GRAPHICS.gateClosed);
        }
        const tag = document.createElement("span");
        tag.className = "tile-tag";
        tag.textContent = `G${gate.switchId}`;
        tile.appendChild(tag);
      }

      if (level.goal.r === r && level.goal.c === c) {
        tile.classList.add(portalOpen ? "goal-unlocked" : "goal-locked");
        tile.insertAdjacentHTML("beforeend", SVG_GRAPHICS.portal(portalOpen));

        const tag = document.createElement("span");
        tag.className = "tile-tag";
        tag.textContent = "EXIT";
        tile.appendChild(tag);
      }

      if (state.hintHighlight) {
        const stepIdx = state.hintHighlight.steps.findIndex(
          (st) => st.r === r && st.c === c,
        );
        if (stepIdx !== -1) {
          tile.classList.add("hint-step-tile");
          const badge = document.createElement("span");
          badge.className = "hint-badge";
          badge.textContent = `STEP ${stepIdx + 1}`;
          tile.appendChild(badge);
        }
        if (
          state.hintHighlight.target &&
          state.hintHighlight.target.r === r &&
          state.hintHighlight.target.c === c
        ) {
          tile.classList.add("hint-target-tile");
          const badge = document.createElement("span");
          badge.className = "hint-badge";
          badge.textContent = "TARGET";
          tile.appendChild(badge);
        }
      }

      if (isTileInEchoTrail(r, c)) {
        const dot = document.createElement("div");
        dot.className = "echo-trail-dot";
        tile.appendChild(dot);
      }

      const hasCrate = state.crates.some((cr) => cr.r === r && cr.c === c);
      if (hasCrate) {
        const crateEl = document.createElement("div");
        crateEl.className = "entity-crate";
        crateEl.innerHTML = SVG_GRAPHICS.crate;
        tile.appendChild(crateEl);
      }

      state.echoHistories.forEach((history, idx) => {
        const echoPos = getEchoPosAtTurn(history, state.turn);
        if (echoPos.r === r && echoPos.c === c) {
          const echoEl = document.createElement("div");
          echoEl.className = "entity-echo";
          echoEl.innerHTML = `
            ${SVG_GRAPHICS.echo}
            <span class="entity-badge">E${idx + 1}</span>
          `;
          tile.appendChild(echoEl);
        }
      });

      if (state.playerPos.r === r && state.playerPos.c === c) {
        const playerEl = document.createElement("div");
        playerEl.className = "entity-player";
        playerEl.innerHTML = SVG_GRAPHICS.player;
        tile.appendChild(playerEl);
      }

      tile.addEventListener("click", () => {
        const dr = r - state.playerPos.r;
        const dc = c - state.playerPos.c;
        if (Math.abs(dr) + Math.abs(dc) === 1) {
          stepTurn(dr, dc);
        }
      });

      gridBoard.appendChild(tile);
    }
  }

  requestAnimationFrame(updateFloatingTutorialPosition);
}

// Event Listeners
const DIR_MAP = {
  UP: [-1, 0],
  DOWN: [1, 0],
  LEFT: [0, -1],
  RIGHT: [0, 1],
};

document.querySelectorAll(".dpad-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const [dr, dc] = DIR_MAP[btn.dataset.dir];
    stepTurn(dr, dc);
  });
});

btnTutorial.addEventListener("click", () => {
  playSound("hint");
  if (state.isLevelWon || state.movesLeft <= 0) {
    initLevel(state.levelIndex, true);
    return;
  }
  state.tutorialActive = true;
  updateFloatingTutorialPosition();
});

btnSkipTutorial.addEventListener("click", () => {
  state.tutorialActive = false;
  const level = LEVELS[state.levelIndex];
  if (level && level.mechanicId) {
    state.completedTutorials[level.mechanicId] = true;
    localStorage.setItem(
      "echoGrid_tutorials",
      JSON.stringify(state.completedTutorials),
    );
  }
  tutorialLayer.classList.add("hidden");
});

btnHint.addEventListener("click", triggerSmartHint);

btnSound.addEventListener("click", () => {
  state.soundEnabled = !state.soundEnabled;
  btnSound.textContent = state.soundEnabled ? "🔊" : "🔇";
});

btnLevels.addEventListener("click", () => openLevelModal(null));

btnCloseModal.addEventListener("click", () => {
  levelModal.classList.add("hidden");
  if (state.isLevelWon) {
    const level = LEVELS[state.levelIndex];
    const movesUsed = level.maxMoves - state.movesLeft;
    const savedStars = state.starsByLevel[state.levelIndex] || 3;
    openVictoryModal(level.name, savedStars, movesUsed);
  }
});

// Victory Modal Buttons
btnWinMenu.addEventListener("click", () => {
  victoryModal.classList.add("hidden");
  openLevelModal(null);
});

btnWinReplay.addEventListener("click", () => {
  victoryModal.classList.add("hidden");
  initLevel(state.levelIndex);
});

btnWinNext.addEventListener("click", async () => {
  victoryModal.classList.add("hidden");
  await maybeShowInterstitialAd();
  const unlockedIdx = state.levelIndex + 1;
  openLevelModal(unlockedIdx);
});

// Out-of-Moves Modal Buttons
btnFailAdMoves.addEventListener("click", () => {
  startRewardedAd("MOVES");
});

btnFailRetry.addEventListener("click", () => {
  gameoverModal.classList.add("hidden");
  initLevel(state.levelIndex);
});

btnFailHint.addEventListener("click", () => {
  if (state.freeHints > 0) {
    gameoverModal.classList.add("hidden");
    initLevel(state.levelIndex, false);
    state.tutorialActive = false;
    tutorialLayer.classList.add("hidden");
    executeHintLogic();
  } else {
    startRewardedAd("HINT");
  }
});

btnFailRewind.addEventListener("click", () => {
  gameoverModal.classList.add("hidden");
  rewindLoop();
});

// Rewarded Ad Simulator Modal Buttons
btnCancelAd.addEventListener("click", () => {
  if (state.adIntervalId) {
    clearInterval(state.adIntervalId);
    state.adIntervalId = null;
  }
  state.pendingAdReward = null;
  rewardAdModal.classList.add("hidden");
  showToast("⚠️ Ad cancelled before completion—no reward granted.");
});

btnClaimAd.addEventListener("click", claimAdReward);

btnWait.addEventListener("click", () => stepTurn(0, 0));
btnRewind.addEventListener("click", rewindLoop);
btnReset.addEventListener("click", () => initLevel(state.levelIndex));

window.addEventListener("keydown", (e) => {
  if (!rewardAdModal.classList.contains("hidden")) return;
  if (!victoryModal.classList.contains("hidden")) return;
  if (!gameoverModal.classList.contains("hidden")) {
    const key = e.key.toLowerCase();
    if (key === "escape") btnFailRetry.click();
    else if (key === "h") btnFailHint.click();
    else if (key === "r" && !btnFailRewind.classList.contains("hidden")) {
      btnFailRewind.click();
    }
    return;
  }
  if (!levelModal.classList.contains("hidden")) {
    if (e.key === "Escape") btnCloseModal.click();
    return;
  }
  const key = e.key.toLowerCase();
  if (key === "arrowup" || key === "w") stepTurn(-1, 0);
  else if (key === "arrowdown" || key === "s") stepTurn(1, 0);
  else if (key === "arrowleft" || key === "a") stepTurn(0, -1);
  else if (key === "arrowright" || key === "d") stepTurn(0, 1);
  else if (key === "h") triggerSmartHint();
  else if (key === "t") {
    if (state.isLevelWon || state.movesLeft <= 0) {
      initLevel(state.levelIndex, true);
    } else {
      state.tutorialActive = !state.tutorialActive;
      updateFloatingTutorialPosition();
    }
  } else if (key === " ") {
    e.preventDefault();
    stepTurn(0, 0);
  } else if (key === "r") {
    rewindLoop();
  } else if (key === "escape") {
    initLevel(state.levelIndex);
  }
});

// Mobile Touch Swipe Support
let touchStartX = 0;
let touchStartY = 0;
gridBoard.addEventListener(
  "touchstart",
  (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
  },
  { passive: true },
);

gridBoard.addEventListener(
  "touchend",
  (e) => {
    const dx = e.changedTouches[0].screenX - touchStartX;
    const dy = e.changedTouches[0].screenY - touchStartY;
    if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return;
    if (Math.abs(dx) > Math.abs(dy)) {
      stepTurn(0, dx > 0 ? 1 : -1);
    } else {
      stepTurn(dy > 0 ? 1 : -1, 0);
    }
  },
  { passive: true },
);

// Initialize Native AdMob on load (if running in Capacitor) and boot game
initNativeAdMob();
const savedLevel = parseInt(localStorage.getItem("echoGrid_savedLevel"), 10);
const maxAllowed = getHighestUnlockedIndex();
initLevel(
  !isNaN(savedLevel) && savedLevel >= 0 ? Math.min(savedLevel, maxAllowed) : 0,
);
