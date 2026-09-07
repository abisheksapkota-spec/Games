/* ==========================================================================
   config/worlds.js
   THE LIST OF WORLDS. Each "world" is one mood of the game (Dungeon,
   Forest, ...) with its own set of level config files.

   Must load AFTER:
     - config/levels/level1..10.js        (fills window.MazeApp.levelConfigs)
     - config/worlds/forest/level1..5.js  (fills window.MazeApp.worldConfigs.forest)

   HOW TO ADD A NEW MOOD IN A FUTURE UPDATE:
     1. Make a new folder:  js/config/worlds/<yourWorldId>/
        with level1.js, level2.js, ... (copy the forest folder as a template —
        each file just sets window.MazeApp.worldConfigs.<yourWorldId>[i] = {...})
     2. (Optional) Make a css/mood-<yourWorldId>.css that styles
        `body.world-<yourWorldId> .cell.wall`, `.cell.path`, `#player`,
        `.goal-core` etc. — copy css/mood-forest.css as a template.
     3. Uncomment / copy one of the placeholder entries below and fill it in.
     4. In index.html, add <script> tags for your new level files (next to
        the forest ones) and a <link> for your mood CSS (if you made one).
   That's it — World Select, Level Select, and the game itself all read
   from this list automatically, nothing else needs to change.
   ========================================================================== */

window.MazeApp = window.MazeApp || {};

window.MazeApp.worlds = [
  {
    id: 'dungeon',
    name: 'The Dungeon',
    mood: 'Classic',
    description: 'Ten torch-lit stone chambers. Where it all began.',
    iconGradient: 'radial-gradient(circle at 35% 30%, #ffd79a, #e8b04b 60%, #4a3620 100%)',
    configs: window.MazeApp.levelConfigs,
  },
  {
    id: 'forest',
    name: 'The Forest',
    mood: 'Nature',
    description: 'Five hedge-lined groves, lit by fireflies instead of fire.',
    iconGradient: 'radial-gradient(circle at 35% 30%, #f2ffd6, #a8e66e 60%, #234a34 100%)',
    configs: window.MazeApp.worldConfigs.forest,
    features: { collectibles: true },
  },

  // ---------------------------------------------------------------------
  // FUTURE WORLDS — uncomment and fill in once the matching level files
  // and mood CSS exist (see the how-to comment at the top of this file).
  // ---------------------------------------------------------------------
  // {
  //   id: 'city',
  //   name: 'The City',
  //   mood: 'Neon',
  //   description: 'Back-alley shortcuts under buzzing signs.',
  //   iconGradient: 'radial-gradient(circle at 35% 30%, #d6f7ff, #4ecbff 60%, #1a2a4a 100%)',
  //   configs: window.MazeApp.worldConfigs.city,
  // },
  // {
  //   id: 'ice',
  //   name: 'The Ice Caves',
  //   mood: 'Frozen',
  //   description: 'Frostbitten tunnels where the torchlight barely holds.',
  //   iconGradient: 'radial-gradient(circle at 35% 30%, #ffffff, #7fd4ff 60%, #234152 100%)',
  //   configs: window.MazeApp.worldConfigs.ice,
  // },
];

// Purely cosmetic — names shown as locked "Coming Soon" cards on the World
// Select screen so there's always visible room for what's next. Once a
// world above is uncommented, remove its name from this list.
window.MazeApp.comingSoonWorlds = ['The City', 'The Ice Caves'];

/** Returns the world object the player currently has selected. */
window.MazeApp.getActiveWorld = function(){
  return window.MazeApp.worlds.find(w => w.id === window.MazeApp.state.currentWorldId);
};

/** Returns just the active world's level config array (shorthand). */
window.MazeApp.getActiveConfigs = function(){
  const world = window.MazeApp.getActiveWorld();
  return world ? world.configs : [];
};
