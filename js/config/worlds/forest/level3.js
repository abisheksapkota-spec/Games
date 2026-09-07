/* ==========================================================================
   forest/level3.js — MEDIUM
   ========================================================================== */

window.MazeApp = window.MazeApp || {};
window.MazeApp.worldConfigs = window.MazeApp.worldConfigs || {};
window.MazeApp.worldConfigs.forest = window.MazeApp.worldConfigs.forest || [];

window.MazeApp.worldConfigs.forest[2] = {
  number: 3,
  w: 9, h: 9,
  braid: 0.25,
  fogNear: 2,
  fogSeen: 3.6,
  collectibles: { stars: 2, doors: 2, flashes: 1, hearts: 2, hasGreenHeart: true },
};
