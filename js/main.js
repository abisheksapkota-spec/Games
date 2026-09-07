/* ==========================================================================
   main.js
   The app's entry point. Loads LAST, after every other module has defined
   itself on window.MazeApp. Responsible for:
     1. The simple "screens" system (title / levels / game — only one visible
        at a time).
     2. Wiring up the handful of navigation buttons that move between
        screens (each screen's OWN internal buttons are wired in that
        screen's own file, e.g. modal.js wires the modal's buttons).
     3. Kicking everything off once the page has loaded.
   ========================================================================== */

window.MazeApp = window.MazeApp || {};

(function(){
  "use strict";

  const screens = {
    title:  document.getElementById('screen-title'),
    worlds: document.getElementById('screen-worlds'),
    levels: document.getElementById('screen-levels'),
    game:   document.getElementById('screen-game'),
  };

  /** Shows one screen (by key: 'title' | 'worlds' | 'levels' | 'game') and hides the rest. */
  function show(name){
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[name].classList.add('active');
  }

  window.MazeApp.Screens = { show };

  /* ---------- Top-level navigation buttons ---------- */
  document.getElementById('btn-play').addEventListener('click', () => {
    window.MazeApp.WorldSelect.render();
    show('worlds');
  });

  document.getElementById('btn-worlds-back').addEventListener('click', () => show('title'));

  document.getElementById('btn-levels-back').addEventListener('click', () => {
    window.MazeApp.WorldSelect.render();
    show('worlds');
  });

  document.getElementById('back-btn').addEventListener('click', () => {
    clearInterval(window.MazeApp.state.timerInterval);
    window.MazeApp.LevelSelect.render();
    show('levels');
  });

  /* ---------- Boot the app ---------- */
  window.MazeApp.Home.init(); // sets up the theme picker + applies the default theme
  show('title');
})();
