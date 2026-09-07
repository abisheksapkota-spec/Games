/* ==========================================================================
   modal.js
   Behavior for the "level complete" popup (#modal-complete): fills in the
   time/stars, plays the reveal animation + chime, and wires up its own
   Retry / Next Level / Levels buttons.

   Exposes: window.MazeApp.Modal = { open, close }
   ========================================================================== */

window.MazeApp = window.MazeApp || {};

(function(){
  "use strict";
  const { state, Audio } = window.MazeApp;

  const modalEl = document.getElementById('modal-complete');

  /** Shows the modal with the given result, animating the stars in one by one. */
  function open(timeSec, stars){
    document.getElementById('modal-level-title').textContent = 'Level ' + state.currentLevel + ' Cleared';
    document.getElementById('modal-time-val').textContent = timeSec.toFixed(1) + 's';

    const starEls = document.querySelectorAll('#modal-stars .star-svg');
    starEls.forEach(s => s.classList.remove('show', 'filled'));

    const totalLevels = window.MazeApp.getActiveConfigs().length;
    const nextBtn = document.getElementById('modal-next-btn');
    nextBtn.style.display = state.currentLevel < totalLevels ? 'inline-block' : 'none';

    modalEl.classList.add('active');

    starEls.forEach((s, i) => {
      setTimeout(() => {
        if(i < stars){
          s.classList.add('filled');
          Audio.playChime(i);
        }
        s.classList.add('show');
      }, 250 + i * 260);
    });
  }

  function close(){
    modalEl.classList.remove('active');
  }

  /* ---------- This modal's own buttons ---------- */
  document.getElementById('modal-levels-btn').addEventListener('click', () => {
    close();
    window.MazeApp.LevelSelect.render();
    window.MazeApp.Screens.show('levels');
  });

  document.getElementById('modal-retry-btn').addEventListener('click', () => {
    close();
    window.MazeApp.Game.startLevel(state.currentLevel);
  });

  document.getElementById('modal-next-btn').addEventListener('click', () => {
    close();
    window.MazeApp.Game.startLevel(state.currentLevel + 1);
  });

  window.MazeApp.Modal = { open, close };
})();
