/* ==========================================================================
   config/themes.js
   Just the list of theme names. The actual colors for each theme live in
   css/variables.css (look for html[data-theme="..."]) — this file only
   needs to know the names so it can build the swatch picker on the title
   screen. To add a theme: add its name here AND add a matching color block
   in css/variables.css.

   Exposes: window.MazeApp.themes = [ ...names ]
   ========================================================================== */

window.MazeApp = window.MazeApp || {};

window.MazeApp.themes = ['amber', 'emerald', 'crimson', 'frost', 'violet'];
