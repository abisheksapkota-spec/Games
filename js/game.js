/* ==========================================================================
   game.js
   Behavior for the gameplay screen (#screen-game): builds the maze grid on
   screen, moves the player, reveals fog-of-war as you explore, runs the
   timer, and hands off to the Modal when you reach the goal.

   Also drives the optional collectibles system (star shards, locked
   doors, flash/heart pickups) for any world whose config has
   `features.collectibles = true` (currently just Forest — see
   js/config/worlds.js). On worlds without that flag, everything in this
   file related to collectibles simply does nothing.

   Exposes: window.MazeApp.Game = { startLevel, tryMove }
   ========================================================================== */

window.MazeApp = window.MazeApp || {};

(function(){
  "use strict";
  const { state, MazeGenerator, Collectibles } = window.MazeApp;

  const mazeEl = document.getElementById('maze');
  const wrapperEl = document.getElementById('maze-wrapper');
  const playerEl = document.getElementById('player');
  const hudLevel = document.getElementById('hud-level');
  const hudTimer = document.getElementById('hud-timer');
  const hudShardsWrap = document.getElementById('hud-shards-wrap');
  const hudShards = document.getElementById('hud-shards');
  const toastEl = document.getElementById('toast');

  let cellEls = [];          // 2D array of the rendered <div class="cell"> elements
  let collectibleEls = {};   // "x,y" -> the collectible icon element on that cell
  let toastTimeout = null;

  // Tuning for the timed buffs (only used on collectibles-enabled worlds)
  const HEART_SLOW_MS = 6000,  HEART_SLOW_FACTOR = 0.4;   // timer ticks at 40% speed
  const GREEN_HEART_SLOW_MS = 9000, GREEN_HEART_SLOW_FACTOR = 0.25; // stronger + longer
  const FLASH_BOOST_MS = 8000, FLASH_BOOST_AMOUNT = 1.5;   // extra fog radius

  /* ------------------------------------------------------------------
     Building a level
     ------------------------------------------------------------------ */

  /** Generates the maze for `levelNum`, resets state, and renders it. */
  function startLevel(levelNum){
    const cfg = window.MazeApp.getActiveConfigs()[levelNum - 1];
    const world = window.MazeApp.getActiveWorld();
    state.currentLevel = levelNum;

    const seed = 1000 + levelNum * 97; // stable seed -> same maze on Retry
    const { grid, width, height } = MazeGenerator.generateMaze(cfg.w, cfg.h, cfg.braid, seed);

    state.grid = grid;
    state.width = width;
    state.height = height;
    state.player = { x: 1, y: 1 };
    state.goal = { x: width - 2, y: height - 2 };
    grid[state.goal.y][state.goal.x] = 0; // guarantee the goal tile is open

    state.exploredSet = new Set();
    state.hasMoved = false;
    state.elapsedMs = 0;
    state.fogNear = cfg.fogNear;
    state.fogSeen = cfg.fogSeen;
    state.slowUntil = 0;
    state.slowFactor = 1;
    state.flashBoostUntil = 0;
    state.flashBoostAmount = 0;
    state.shards = 0;
    state.starEverCollected = false;
    state.collectibles = {};
    state.doors = {};
    clearInterval(state.timerInterval);

    hudTimer.textContent = '0.0s';
    hudTimer.classList.remove('slowed');
    hudLevel.textContent = levelNum;

    const mainPath = MazeGenerator.shortestPath(grid, width, height, 1, 1, state.goal.x, state.goal.y);
    state.parSteps = (mainPath ? mainPath.length - 1 : 0) || (width + height);

    const hasCollectibles = !!(world.features && world.features.collectibles && cfg.collectibles);
    hudShardsWrap.style.display = hasCollectibles ? 'flex' : 'none';
    if(hasCollectibles){
      const rng = MazeGenerator.mulberry32(seed + 999); // separate stream from maze generation
      const placed = Collectibles.generate(grid, width, height, mainPath, rng, cfg.collectibles);
      state.collectibles = placed.collectibles;
      state.doors = placed.doors;
    }
    updateShardHUD();

    computeCellSize();
    renderMaze();
    updatePlayerPosition(false);
    updateFog();

    window.MazeApp.Screens.show('game');
  }

  /** Picks a cell pixel size that fits the current window for this maze's dimensions. */
  function computeCellSize(){
    const maxW = Math.min(window.innerWidth - 32, 560);
    const maxH = Math.min(window.innerHeight - 260, 560);
    const size = Math.floor(Math.min(maxW / state.width, maxH / state.height));
    state.cellSize = Math.max(8, Math.min(30, size));
  }

  /** Builds the DOM grid of wall/path/goal/door/collectible cells. */
  function renderMaze(){
    mazeEl.innerHTML = '';
    cellEls = [];
    collectibleEls = {};

    mazeEl.style.gridTemplateColumns = `repeat(${state.width}, ${state.cellSize}px)`;
    mazeEl.style.gridTemplateRows = `repeat(${state.height}, ${state.cellSize}px)`;
    wrapperEl.style.width = (state.width * state.cellSize) + 'px';
    wrapperEl.style.height = (state.height * state.cellSize) + 'px';

    for(let y=0; y<state.height; y++){
      const row = [];
      for(let x=0; x<state.width; x++){
        const key = x + ',' + y;
        const cell = document.createElement('div');
        const isWall = state.grid[y][x] === 1;
        const isGoal = (x === state.goal.x && y === state.goal.y);
        const door = state.doors[key];
        const collectible = state.collectibles[key];

        cell.className = 'cell ' + (isWall ? 'wall' : 'path') + (isGoal ? ' goal' : '');

        if(isGoal){
          const core = document.createElement('div');
          core.className = 'goal-core';
          cell.appendChild(core);
        }

        if(door){
          cell.classList.add('door', door.locked ? 'locked' : 'unlocked');
          const badge = document.createElement('div');
          badge.className = 'door-badge';
          badge.textContent = door.cost;
          cell.appendChild(badge);
        }

        if(collectible){
          const icon = buildCollectibleIcon(collectible.type);
          if(collectible.type === 'greenHeart' && !state.starEverCollected){
            icon.classList.add('hidden');
          }
          cell.appendChild(icon);
          collectibleEls[key] = icon;
        }

        mazeEl.appendChild(cell);
        row.push(cell);
      }
      cellEls.push(row);
    }

    playerEl.style.width = state.cellSize + 'px';
    playerEl.style.height = state.cellSize + 'px';
  }

  /** Builds the little SVG icon for a collectible type. */
  function buildCollectibleIcon(type){
    const icon = document.createElement('div');
    icon.className = 'collectible collectible-' + type;
    if(type === 'flash'){
      icon.innerHTML = '<svg viewBox="0 0 24 24"><path d="M13 2 3 14h7l-1 8 10-12h-7z"/></svg>';
    } else if(type === 'heart' || type === 'greenHeart'){
      icon.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 21s-6.7-4.35-9.3-8.28C.7 9.6 1.9 6 5.4 5.1 7.6 4.5 9.8 5.5 12 8c2.2-2.5 4.4-3.5 6.6-2.9 3.5.9 4.7 4.5 2.7 7.62C18.7 16.65 12 21 12 21z"/></svg>';
    } else { // star
      icon.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.7 7-6.3-3.9L5.7 21l1.7-7L2 9.2l7.1-.6z"/></svg>';
    }
    return icon;
  }

  /* ------------------------------------------------------------------
     Player movement & fog of war
     ------------------------------------------------------------------ */

  function updatePlayerPosition(animate){
    playerEl.style.transition = animate ? 'transform .1s linear' : 'none';
    playerEl.style.transform = `translate(${state.player.x * state.cellSize}px, ${state.player.y * state.cellSize}px)`;
  }

  /** Current torch radii, including any temporary flash boost. */
  function effectiveFogNear(){
    return state.fogNear + (performance.now() < state.flashBoostUntil ? state.flashBoostAmount : 0);
  }
  function effectiveFogSeen(){
    return state.fogSeen + (performance.now() < state.flashBoostUntil ? state.flashBoostAmount : 0);
  }

  /** Lights up cells near the player (bright) and remembers ones ever seen (dim). */
  function updateFog(){
    const { x: px, y: py } = state.player;
    const near = effectiveFogNear(), seenR = effectiveFogSeen();

    for(let y=0; y<state.height; y++){
      for(let x=0; x<state.width; x++){
        const d = Math.max(Math.abs(x-px), Math.abs(y-py));
        if(d <= seenR) state.exploredSet.add(x + ',' + y);
      }
    }
    applyFogClasses(near);
  }

  function applyFogClasses(nearRadius){
    const { x: px, y: py } = state.player;
    for(let y=0; y<state.height; y++){
      for(let x=0; x<state.width; x++){
        const el = cellEls[y][x];
        const key = x + ',' + y;
        const seen = state.exploredSet.has(key);
        const isNear = seen && Math.max(Math.abs(x-px), Math.abs(y-py)) <= nearRadius;
        el.classList.toggle('seen', seen);
        el.classList.toggle('near', isNear);
      }
    }
  }

  /* ------------------------------------------------------------------
     Doors & collectibles
     ------------------------------------------------------------------ */

  /** Returns true if the move should be blocked (locked door, not enough shards). */
  function handleDoorAttempt(key){
    const door = state.doors[key];
    if(!door || !door.locked) return false; // no door here, or already open — never blocks

    if(state.shards >= door.cost){
      state.shards -= door.cost;
      door.locked = false;
      updateShardHUD();
      const cellEl = cellEls[Number(key.split(',')[1])][Number(key.split(',')[0])];
      cellEl.classList.remove('locked');
      cellEl.classList.add('unlocked');
      return false; // door now open — move proceeds
    }

    showToast('Need a star shard to open this door');
    const cellEl = cellEls[Number(key.split(',')[1])][Number(key.split(',')[0])];
    cellEl.classList.remove('denied');
    void cellEl.offsetWidth; // restart the CSS animation
    cellEl.classList.add('denied');
    return true; // blocked
  }

  /** Applies whatever effect a collectible has, then removes it from the maze. */
  function collectAt(key){
    const item = state.collectibles[key];
    if(!item) return;

    if(item.type === 'greenHeart' && !state.starEverCollected) return; // not visible/collectible yet

    if(item.type === 'star'){
      state.shards++;
      state.starEverCollected = true;
      updateShardHUD();
      revealGreenHeart();
      showToast('Star shard collected');
    } else if(item.type === 'flash'){
      state.flashBoostUntil = performance.now() + FLASH_BOOST_MS;
      state.flashBoostAmount = FLASH_BOOST_AMOUNT;
      updateFog();
      showToast('Torch light widened');
      setTimeout(updateFog, FLASH_BOOST_MS + 20);
    } else if(item.type === 'heart'){
      state.slowUntil = performance.now() + HEART_SLOW_MS;
      state.slowFactor = HEART_SLOW_FACTOR;
      showToast('Time is passing slower...');
    } else if(item.type === 'greenHeart'){
      state.slowUntil = performance.now() + GREEN_HEART_SLOW_MS;
      state.slowFactor = GREEN_HEART_SLOW_FACTOR;
      showToast('A deep calm slows time...');
    }

    delete state.collectibles[key];
    const el = collectibleEls[key];
    if(el){
      el.classList.add('collected');
      setTimeout(() => el.remove(), 300);
    }
  }

  /** Once the first star is collected, fade in any green heart already on the board. */
  function revealGreenHeart(){
    for(const key in collectibleEls){
      const item = state.collectibles[key];
      if(item && item.type === 'greenHeart'){
        collectibleEls[key].classList.remove('hidden');
      }
    }
  }

  function updateShardHUD(){
    hudShards.textContent = state.shards;
  }

  function showToast(message){
    if(!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toastEl.classList.remove('show'), 1600);
  }

  /* ------------------------------------------------------------------
     Movement & the timer
     ------------------------------------------------------------------ */

  /** Attempts to move the player by (dx,dy) if that tile isn't a wall/locked door. */
  function tryMove(dx, dy){
    if(document.getElementById('modal-complete').classList.contains('active')) return;

    const nx = state.player.x + dx, ny = state.player.y + dy;
    if(nx<0 || ny<0 || nx>=state.width || ny>=state.height) return;
    if(state.grid[ny][nx] === 1) return; // wall — can't move there

    const key = nx + ',' + ny;
    if(handleDoorAttempt(key)) return; // locked & can't afford it — movement blocked

    if(!state.hasMoved){
      state.hasMoved = true;
      state.elapsedMs = 0;
      state.timerInterval = setInterval(tick, 100);
    }

    state.player.x = nx;
    state.player.y = ny;
    updatePlayerPosition(true);
    updateFog();
    collectAt(key);

    if(nx === state.goal.x && ny === state.goal.y){
      finishLevel();
    }
  }

  /** Runs every 100ms while playing. Advances the timer (slower during a
   *  heart buff) and keeps the fog radius live in case a flash just expired. */
  function tick(){
    const now = performance.now();
    const rate = now < state.slowUntil ? state.slowFactor : 1;
    state.elapsedMs += 100 * rate;
    hudTimer.textContent = (state.elapsedMs / 1000).toFixed(1) + 's';
    hudTimer.classList.toggle('slowed', rate < 1);
  }

  /* ------------------------------------------------------------------
     Finishing a level
     ------------------------------------------------------------------ */

  function finishLevel(){
    clearInterval(state.timerInterval);
    const timeSec = state.elapsedMs / 1000;

    // Star thresholds are relative to the maze's actual shortest-path length
    // (state.parSteps), so bigger/harder mazes get a fair, scaled par time.
    const par = state.parSteps * 0.42;
    let stars = 1;
    if(timeSec <= par) stars = 3;
    else if(timeSec <= par * 1.4) stars = 2;

    const idx = state.currentLevel - 1;
    const progress = window.MazeApp.getProgressForWorld(state.currentWorldId);
    const p = progress[idx];
    p.completed = true;
    p.bestStars = Math.max(p.bestStars, stars);
    if(p.bestTime == null || timeSec < p.bestTime) p.bestTime = timeSec;

    window.MazeApp.Modal.open(timeSec, stars);
  }

  /* ------------------------------------------------------------------
     Input: keyboard, touch buttons, window resize
     ------------------------------------------------------------------ */

  window.addEventListener('keydown', (e) => {
    if(!document.getElementById('screen-game').classList.contains('active')) return;
    const map = {
      ArrowUp:[0,-1], ArrowDown:[0,1], ArrowLeft:[-1,0], ArrowRight:[1,0],
      w:[0,-1], s:[0,1], a:[-1,0], d:[1,0],
      W:[0,-1], S:[0,1], A:[-1,0], D:[1,0],
    };
    if(map[e.key]){
      e.preventDefault();
      tryMove(map[e.key][0], map[e.key][1]);
    }
  });

  function bindTouchButton(id, dx, dy){
    document.getElementById(id).addEventListener('click', () => tryMove(dx, dy));
  }
  bindTouchButton('tc-up', 0, -1);
  bindTouchButton('tc-down', 0, 1);
  bindTouchButton('tc-left', -1, 0);
  bindTouchButton('tc-right', 1, 0);

  window.addEventListener('resize', () => {
    if(!document.getElementById('screen-game').classList.contains('active')) return;
    computeCellSize();
    renderMaze();
    applyFogClasses(effectiveFogNear());
    updatePlayerPosition(false);
  });

  window.MazeApp.Game = { startLevel, tryMove };
})();
