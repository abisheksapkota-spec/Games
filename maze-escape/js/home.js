/* ==========================================================================
   home.js
   Behavior for the title screen (#screen-title): the color-theme swatch
   picker. Navigating away from this screen (the "Enter the Maze" button)
   is wired up in main.js, since it involves switching screens.

   Exposes: window.MazeApp.Home = { init, applyTheme }
   ========================================================================== */

window.MazeApp = window.MazeApp || {};

(function(){
  "use strict";
  const { state, themes } = window.MazeApp;

  /** Sets the active theme: updates state, the <html data-theme> attribute,
   *  and which swatch shows as "active". */
  function applyTheme(name){
    state.theme = name;
    document.documentElement.setAttribute('data-theme', name);
    document.querySelectorAll('.theme-swatch').forEach(el => {
      el.classList.toggle('active', el.dataset.theme === name);
    });
  }

  /** Builds the row of clickable theme swatches from js/config/themes.js. */
  function renderThemePicker(){
    const wrap = document.getElementById('theme-swatches');
    wrap.innerHTML = '';
    themes.forEach(name => {
      const swatch = document.createElement('div');
      swatch.className = 'theme-swatch' + (name === state.theme ? ' active' : '');
      swatch.dataset.theme = name;
      swatch.title = name.charAt(0).toUpperCase() + name.slice(1);
      swatch.addEventListener('click', () => applyTheme(name));
      wrap.appendChild(swatch);
    });
  }

  /** Called once when the app boots. */
  function init(){
    renderThemePicker();
    applyTheme(state.theme);
  }

  window.MazeApp.Home = { init, applyTheme };
})();
