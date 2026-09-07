/* ==========================================================================
   game.js
   Behavior for the gameplay screen (#screen-game): builds the maze grid on
   screen, moves the player, reveals fog-of-war as you explore, runs the
   timer, and hands off to the Modal when you reach the goal.

   Exposes: window.MazeApp.Game = { startLevel, tryMove }
   ========================================================================== */

window.MazeApp = window.MazeApp || {};

(function(){
  "use strict";
  const { state, MazeGenerator } = window.MazeApp;

  const mazeEl = document.getElementById('maze');
  const wrapperEl = document.getElementById('maze-wrapper');
  const playerEl = document.getElementById('player');
  const hudLevel = document.getElementById('hud-level');
  const hudTimer = document.getElementById('hud-timer');

  let cellEls = []; // 2D array of the rendered <div class="cell"> elements

  /* ------------------------------------------------------------------
     Building a level
     ------------------------------------------------------------------ */

  /** Generates the maze for `levelNum`, resets state, and renders it. */
  function startLevel(levelNum){
    const cfg = window.MazeApp.getActiveConfigs()[levelNum - 1];
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
    state.startTime = null;
    state.fogNear = cfg.fogNear;
    state.fogSeen = cfg.fogSeen;
    clearInterval(state.timerInterval);

    hudTimer.textContent = '0.0s';
    hudLevel.textContent = levelNum;

    state.parSteps = MazeGenerator.shortestPathLen(
      grid, width, height, 1, 1, state.goal.x, state.goal.y
    ) || (width + height);

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

  /** Builds the DOM grid of wall/path/goal cells from state.grid. */
  function renderMaze(){
    mazeEl.innerHTML = '';
    cellEls = [];

    mazeEl.style.gridTemplateColumns = `repeat(${state.width}, ${state.cellSize}px)`;
    mazeEl.style.gridTemplateRows = `repeat(${state.height}, ${state.cellSize}px)`;
    wrapperEl.style.width = (state.width * state.cellSize) + 'px';
    wrapperEl.style.height = (state.height * state.cellSize) + 'px';

    for(let y=0; y<state.height; y++){
      const row = [];
      for(let x=0; x<state.width; x++){
        const cell = document.createElement('div');
        const isWall = state.grid[y][x] === 1;
        const isGoal = (x === state.goal.x && y === state.goal.y);

        cell.className = 'cell ' + (isWall ? 'wall' : 'path') + (isGoal ? ' goal' : '');
        if(isGoal){
          const core = document.createElement('div');
          core.className = 'goal-core';
          cell.appendChild(core);
        }
        mazeEl.appendChild(cell);
        row.push(cell);
      }
      cellEls.push(row);
    }

    playerEl.style.width = state.cellSize + 'px';
    playerEl.style.height = state.cellSize + 'px';
  }

  /* ------------------------------------------------------------------
     Player movement & fog of war
     ------------------------------------------------------------------ */

  function updatePlayerPosition(animate){
    playerEl.style.transition = animate ? 'transform .1s linear' : 'none';
    playerEl.style.transform = `translate(${state.player.x * state.cellSize}px, ${state.player.y * state.cellSize}px)`;
  }

  /** Lights up cells near the player (bright) and remembers ones ever seen (dim). */
  function updateFog(){
    const { x: px, y: py } = state.player;

    for(let y=0; y<state.height; y++){
      for(let x=0; x<state.width; x++){
        const d = Math.max(Math.abs(x-px), Math.abs(y-py));
        if(d <= state.fogSeen) state.exploredSet.add(x + ',' + y);
      }
    }

    for(let y=0; y<state.height; y++){
      for(let x=0; x<state.width; x++){
        const el = cellEls[y][x];
        const key = x + ',' + y;
        const seen = state.exploredSet.has(key);
        const near = seen && Math.max(Math.abs(x-px), Math.abs(y-py)) <= state.fogNear;
        el.classList.toggle('seen', seen);
        el.classList.toggle('near', near);
      }
    }
  }

  /** Attempts to move the player by (dx,dy) if that tile isn't a wall. */
  function tryMove(dx, dy){
    if(document.getElementById('modal-complete').classList.contains('active')) return;

    const nx = state.player.x + dx, ny = state.player.y + dy;
    if(nx<0 || ny<0 || nx>=state.width || ny>=state.height) return;
    if(state.grid[ny][nx] === 1) return; // wall — can't move there

    if(!state.hasMoved){
      state.hasMoved = true;
      state.startTime = performance.now();
      state.timerInterval = setInterval(updateTimerDisplay, 100);
    }

    state.player.x = nx;
    state.player.y = ny;
    updatePlayerPosition(true);
    updateFog();

    if(nx === state.goal.x && ny === state.goal.y){
      finishLevel();
    }
  }

  function updateTimerDisplay(){
    if(state.startTime == null) return;
    const t = (performance.now() - state.startTime) / 1000;
    hudTimer.textContent = t.toFixed(1) + 's';
  }

  /* ------------------------------------------------------------------
     Finishing a level
     ------------------------------------------------------------------ */

  function finishLevel(){
    clearInterval(state.timerInterval);
    const timeSec = state.startTime != null ? (performance.now() - state.startTime) / 1000 : 0;

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
    redrawFogOnly();
    updatePlayerPosition(false);
  });

  /** After a resize the cells are rebuilt fresh, so just reapply seen/near
   *  classes from the existing exploredSet (no need to expand it further). */
  function redrawFogOnly(){
    const { x: px, y: py } = state.player;
    for(let y=0; y<state.height; y++){
      for(let x=0; x<state.width; x++){
        const el = cellEls[y][x];
        const key = x + ',' + y;
        const seen = state.exploredSet.has(key);
        const near = seen && Math.max(Math.abs(x-px), Math.abs(y-py)) <= state.fogNear;
        el.classList.toggle('seen', seen);
        el.classList.toggle('near', near);
      }
    }
  }

  window.MazeApp.Game = { startLevel, tryMove };
})();
