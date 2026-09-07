/* ==========================================================================
   level-select.js
   Behavior for the level-select screen (#screen-levels): draws tiles for
   whichever world is currently selected (see world-select.js), shows each
   one's best star result, and locks levels the player hasn't unlocked yet.

   Exposes: window.MazeApp.LevelSelect = { render }
   ========================================================================== */

window.MazeApp = window.MazeApp || {};

(function(){
  "use strict";
  const { state } = window.MazeApp;

  /** Builds one small star-icon SVG string, filled or empty. */
  function starSVG(filled){
    return `<svg class="star-svg${filled ? ' filled' : ''}" viewBox="0 0 24 24">` +
           `<path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.7 7-6.3-3.9L5.7 21l1.7-7L2 9.2l7.1-.6z"/></svg>`;
  }

  /** Redraws the full tile grid for the CURRENTLY SELECTED world. */
  function render(){
    const world = window.MazeApp.getActiveWorld();
    const configs = world.configs;
    const progress = window.MazeApp.getProgressForWorld(world.id);

    document.getElementById('level-select-title').textContent = world.name;
    document.getElementById('level-select-eyebrow').textContent = world.mood + ' · Choose Your Level';

    const grid = document.getElementById('level-grid');
    grid.innerHTML = '';

    configs.forEach((cfg, i) => {
      const levelNum = i + 1;
      const unlocked = levelNum === 1 || progress[i-1].completed;
      const p = progress[i];

      const tile = document.createElement('div');
      tile.className = 'level-tile' + (unlocked ? '' : ' locked');
      tile.innerHTML =
        `<div class="num">${levelNum}</div>` +
        `<div class="stars">${[0,1,2].map(s => starSVG(s < p.bestStars)).join('')}</div>`;

      if(unlocked){
        tile.addEventListener('click', () => window.MazeApp.Game.startLevel(levelNum));
      }
      grid.appendChild(tile);
    });
  }

  window.MazeApp.LevelSelect = { render };
})();
