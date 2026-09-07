/* ==========================================================================
   world-select.js
   Behavior for the world-select screen (#screen-worlds): shows one card per
   playable world (Dungeon, Forest, ...) plus grayed-out "coming soon" cards
   for future moods. Picking a world sets state.currentWorldId, applies that
   world's visual mood (body.world-<id> class), and goes to Level Select.

   Exposes: window.MazeApp.WorldSelect = { render }
   ========================================================================== */

window.MazeApp = window.MazeApp || {};

(function(){
  "use strict";
  const { state, worlds, comingSoonWorlds } = window.MazeApp;

  /** Swaps the body's world-<id> mood class so the right CSS (see
   *  css/mood-forest.css etc.) takes effect. Dungeon has no mood file,
   *  so it just falls back to the default look. */
  function applyWorldMood(worldId){
    worlds.forEach(w => document.body.classList.remove('world-' + w.id));
    document.body.classList.add('world-' + worldId);
  }

  function selectWorld(worldId){
    state.currentWorldId = worldId;
    applyWorldMood(worldId);
    window.MazeApp.LevelSelect.render();
    window.MazeApp.Screens.show('levels');
  }

  function render(){
    const grid = document.getElementById('world-grid');
    grid.innerHTML = '';

    worlds.forEach(world => {
      const card = document.createElement('div');
      card.className = 'world-card';
      card.innerHTML =
        `<div class="world-icon" style="background:${world.iconGradient}"></div>` +
        `<div class="world-info">` +
          `<div class="world-name">${world.name}</div>` +
          `<div class="world-mood">${world.mood} · ${world.configs.length} Levels</div>` +
          `<div class="world-desc">${world.description}</div>` +
        `</div>`;
      card.addEventListener('click', () => selectWorld(world.id));
      grid.appendChild(card);
    });

    // Locked placeholders — visible proof there's room for more moods later.
    comingSoonWorlds.forEach(name => {
      const card = document.createElement('div');
      card.className = 'world-card locked-future';
      card.innerHTML =
        `<div class="world-icon world-icon-placeholder">+</div>` +
        `<div class="world-info">` +
          `<div class="world-name">${name}</div>` +
          `<div class="world-mood">Coming Soon</div>` +
        `</div>`;
      grid.appendChild(card);
    });
  }

  window.MazeApp.WorldSelect = { render };
})();
