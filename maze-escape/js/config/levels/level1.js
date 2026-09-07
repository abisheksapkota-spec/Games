/* ==========================================================================
   level1.js — EASY
   Small maze, lots of loops (high braid = very forgiving), wide torch light.
   This is the template every other levelN.js file follows.
   ========================================================================== */

window.MazeApp = window.MazeApp || {};
window.MazeApp.levelConfigs = window.MazeApp.levelConfigs || [];

window.MazeApp.levelConfigs[0] = {
  number: 1,
  w: 5, h: 5,        // maze is 5x5 cells -> rendered as an 11x11 grid
  braid: 0.65,       // 65% of dead-ends get turned into loops -> easy to recover from wrong turns
  fogNear: 3,        // bright torch radius (in grid cells)
  fogSeen: 5,         // how far the "already explored, dimly lit" memory extends
};
