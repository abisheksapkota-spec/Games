/* ==========================================================================
   forest/level1.js — EASY
   The Forest world's own level list, same shape as the Dungeon's level
   files (js/config/levels/levelN.js) so it's easy to compare the two.
   ========================================================================== */

window.MazeApp = window.MazeApp || {};
window.MazeApp.worldConfigs = window.MazeApp.worldConfigs || {};
window.MazeApp.worldConfigs.forest = window.MazeApp.worldConfigs.forest || [];

window.MazeApp.worldConfigs.forest[0] = {
  number: 1,
  w: 5, h: 5,
  braid: 0.60,
  fogNear: 3,
  fogSeen: 5,
  collectibles: { stars: 1, doors: 1, flashes: 1, hearts: 1, hasGreenHeart: true },
};
