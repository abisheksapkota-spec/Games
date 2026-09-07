/* ==========================================================================
   forest/level4.js — HARD
   ========================================================================== */

window.MazeApp = window.MazeApp || {};
window.MazeApp.worldConfigs = window.MazeApp.worldConfigs || {};
window.MazeApp.worldConfigs.forest = window.MazeApp.worldConfigs.forest || [];

window.MazeApp.worldConfigs.forest[3] = {
  number: 4,
  w: 11, h: 11,
  braid: 0.10,
  fogNear: 1.6,
  fogSeen: 3,
  collectibles: { stars: 3, doors: 2, flashes: 2, hearts: 2, hasGreenHeart: true },
};
