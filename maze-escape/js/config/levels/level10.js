/* ==========================================================================
   level10.js — THE FINAL CHAMBER
   Zero braid = a "perfect" maze: exactly one solution, no loops, every
   wrong turn is a dead end. Weakest torch light in the game.
   ========================================================================== */

window.MazeApp = window.MazeApp || {};
window.MazeApp.levelConfigs = window.MazeApp.levelConfigs || [];

window.MazeApp.levelConfigs[9] = {
  number: 10,
  w: 18, h: 18,
  braid: 0.00,
  fogNear: 1.2,
  fogSeen: 2.3,
};
