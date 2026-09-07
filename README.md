MAZE ESCAPE — folder guide
===========================

HOW TO RUN
-----------
Just double-click index.html to open it in your browser. Everything is
plain HTML/CSS/JS with no build step or server required.


FOLDER STRUCTURE
-----------------
index.html                    <- the only HTML file. Contains the markup
                                  for all 5 screens (title, world select,
                                  level select, game, complete-popup) and
                                  loads every CSS/JS file below in order.

css/
  variables.css                <- ALL colors, as CSS variables. This is
                                   the file to edit to retheme the Dungeon
                                   world, or to add a brand new color theme.
  base.css                     <- shared reset, fonts, buttons, the
                                   screen show/hide system.
  home.css                     <- just the title screen's theme picker.
  world-select.css             <- the world-select screen's world cards.
  level-select.css             <- just the level-select grid of tiles.
  game.css                     <- the maze grid, player torch, fog, HUD,
                                   touch controls.
  modal.css                    <- the "level complete" popup.
  mood-forest.css              <- Forest world's colors (hedge walls, dirt
                                   path, firefly player). Applies whenever
                                   <body> has the "world-forest" class.
                                   TEMPLATE for future worlds' mood files.
  collectibles.css              <- star shards, locked doors, flash/heart
                                    pickups, the shard HUD counter, and
                                    the on-screen toast hint. Only ever
                                    used by collectibles-enabled worlds.

js/
  maze-generator.js            <- pure maze math (no DOM): random maze
                                   generation + shortest-path finder. Same
                                   engine powers every world.
  collectibles.js              <- procedural placement of star shards,
                                   locked doors, and flash/heart pickups on
                                   a maze's dead-end side branches. Used by
                                   any world whose config sets
                                   features.collectibles = true (currently
                                   just Forest). Guarantees doors are never
                                   required to reach the goal.
  audio.js                     <- the one sound effect (star chime).
  config/
    themes.js                  <- list of color-theme names (Dungeon only).
    levels/
      level1.js ... level10.js <- Dungeon world's 10 level configs.
    worlds/
      forest/
        level1.js ... level5.js <- Forest world's 5 level configs. Same
                                     shape as the Dungeon files above, plus
                                     a `collectibles: {...}` field (how
                                     many star shards / doors / flashes /
                                     hearts to place, and whether this
                                     level has a hidden green heart).
      [future worlds' folders go here — see worlds.js for the how-to]
    worlds.js                  <- THE WORLD REGISTRY. Combines the level
                                   config lists above into a list of
                                   playable worlds, and has clearly-marked
                                   commented-out placeholders + a "coming
                                   soon" list, ready for future moods. Also
                                   where a world opts into the collectibles
                                   system via `features: {collectibles:true}`.
  state.js                     <- the single shared "what's happening
                                   right now" object. Tracks progress
                                   SEPARATELY per world, so Dungeon and
                                   Forest stars/times never overwrite
                                   each other.
  home.js                      <- title screen behavior (theme picker).
  world-select.js              <- draws the world cards (+ locked
                                   "coming soon" placeholders) and applies
                                   the picked world's visual mood.
  level-select.js              <- draws the level grid for whichever
                                   world is currently selected.
  game.js                      <- the biggest file: renders the maze,
                                   moves the player, updates the fog of
                                   war, runs the timer, handles keyboard/
                                   touch input, and — for collectibles-
                                   enabled worlds — placing/collecting
                                   star shards, unlocking doors, and
                                   applying flash/heart buffs. World-
                                   agnostic — it just asks "what's the
                                   active world's config" whenever it
                                   needs level data.
  modal.js                     <- the "level complete" popup's behavior
                                   (star reveal animation + its buttons).
  main.js                      <- loads LAST. Wires up screen navigation
                                   (Title -> World Select -> Level Select
                                   -> Game) and starts the app.


HOW TO ADD ANOTHER MOOD LATER (e.g. "The City")
--------------------------------------------------
1. Make js/config/worlds/city/level1.js, level2.js, ... — copy the
   forest folder as a template.
2. (Optional but recommended) Make css/mood-city.css — copy
   css/mood-forest.css as a template and change the colors/selectors.
3. In js/config/worlds.js, uncomment (or copy) the "city" placeholder
   entry near the bottom of the file and point its `configs` at the
   array your new level files filled in.
4. In index.html, add <script> tags for the new level files (next to
   the Forest ones) and a <link> for the new mood CSS (if you made one).
That's the whole checklist — World Select, Level Select, and the game
itself all read from the worlds.js registry automatically, so nothing
else needs to change.


WHY NO SEPARATE HTML/CSS PER LEVEL?
------------------------------------
All mazes in a world are built by the same generator (maze-generator.js)
— a level isn't really a separate "page", it's a different size/
difficulty fed into the same code. So instead of duplicate HTML/CSS
files per level (which would just be things to keep in sync), each
level gets its own tiny CONFIG file stating exactly what's different
about it. Visuals differ by WORLD (mood-forest.css etc.), not by
individual level — level files only ever contain size/difficulty
numbers.
