/* ==========================================================================
   state.js
   One shared object holding "what's currently going on" — which world,
   which level, the maze grid, the player's position, timers, per-level best
   scores, and the active color theme. Every other module reads/writes this
   instead of keeping its own copies, so there's a single source of truth.

   Must load AFTER config/worlds.js (it doesn't need worlds.js's contents
   directly at load time, but getProgressForWorld() below calls into it
   later, once the app is running).

   Exposes: window.MazeApp.state = { ... }
            window.MazeApp.getProgressForWorld(worldId)
   ========================================================================== */

window.MazeApp = window.MazeApp || {};

window.MazeApp.state = {
  // ----- which world & level -----
  currentWorldId: null,      // set by world-select.js when the player picks a world
  currentLevel: 1,
  grid: null, width: 0, height: 0,
  player: { x: 1, y: 1 },
  goal: { x: 0, y: 0 },

  // ----- fog of war -----
  exploredSet: new Set(),   // keys "x,y" the player has ever lit up
  fogNear: 2,                // current level's bright-torch radius
  fogSeen: 3.6,               // current level's "stays dimly visible" radius

  // ----- timer -----
  startTime: null,
  hasMoved: false,
  timerInterval: null,
  parSteps: 0,                // shortest-path length, used for star thresholds

  // ----- rendering -----
  cellSize: 24,

  // ----- theme (Dungeon world only — mood worlds like Forest override
  //       their own colors regardless of this pick; see css/mood-forest.css) -----
  theme: 'amber',

  // ----- progress, kept SEPARATELY per world so e.g. Dungeon level 3
  //       and Forest level 3 have independent stars/times -----
  // shape: { dungeon: [{completed,bestStars,bestTime}, ...], forest: [...] }
  progressByWorld: {},
};

/**
 * Returns the progress array for the given world, creating it (all levels
 * un-started) the first time that world is visited.
 */
window.MazeApp.getProgressForWorld = function(worldId){
  const state = window.MazeApp.state;
  if(!state.progressByWorld[worldId]){
    const world = window.MazeApp.worlds.find(w => w.id === worldId);
    state.progressByWorld[worldId] = world.configs.map(() => ({
      completed: false,
      bestStars: 0,
      bestTime: null,
    }));
  }
  return state.progressByWorld[worldId];
};
