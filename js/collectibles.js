/* ==========================================================================
   collectibles.js
   Figures out WHERE to put star shards, locked doors, flashes, and hearts
   in a generated maze — and guarantees they never block the required path
   to the goal. Pure logic, no DOM.

   THE CORE IDEA: take the maze's shortest path (the "main path"). Every
   other reachable path cell hangs off that main path as a dead-end
   branch ("spur"). Collectibles only ever go on spurs — so ignoring every
   collectible entirely still gets you to the goal.

   For a "locked branch" (a door + its reward), the star that opens that
   exact door is placed EARLIER on the very same spur, before the door.
   That means each locked branch is fully self-contained: walk in, grab
   the star, spend it on the door right there, grab the reward. No need
   to have found a star anywhere else first.

   Exposes: window.MazeApp.Collectibles = { generate }
   ========================================================================== */

window.MazeApp = window.MazeApp || {};

(function(){
  "use strict";
  const { MazeGenerator } = window.MazeApp;

  /** Multi-source BFS starting from every main-path cell at once, walking
   *  outward through open (non-wall) cells. Gives every other reachable
   *  path cell a distance-from-main-path and a "parent" pointer, which
   *  together describe a tree of branches hanging off the main path. */
  function bfsFromMainPath(grid, width, height, mainPathSet){
    const dist = Array.from({length:height}, () => Array(width).fill(-1));
    const parent = Array.from({length:height}, () => Array(width).fill(null));
    const queue = [];

    for(const key of mainPathSet){
      const [x,y] = key.split(',').map(Number);
      dist[y][x] = 0;
      queue.push([x,y]);
    }

    let qi = 0;
    while(qi < queue.length){
      const [x,y] = queue[qi++];
      for(const [dx,dy] of [[0,-1],[0,1],[-1,0],[1,0]]){
        const nx=x+dx, ny=y+dy;
        if(nx<0||ny<0||nx>=width||ny>=height) continue;
        if(grid[ny][nx] !== 0) continue;        // wall — can't branch through it
        if(dist[ny][nx] !== -1) continue;        // already reached
        dist[ny][nx] = dist[y][x] + 1;
        parent[ny][nx] = [x,y];
        queue.push([nx,ny]);
      }
    }
    return { dist, parent };
  }

  /** Finds every dead-end "spur" (a chain of cells branching off the main
   *  path, ordered from the cell closest to the main path to the tip). */
  function findSpurs(grid, width, height, mainPathSet){
    const { dist, parent } = bfsFromMainPath(grid, width, height, mainPathSet);

    // A cell is a "leaf" (spur tip) if nothing else branches from it.
    const isParentOf = Array.from({length:height}, () => Array(width).fill(false));
    for(let y=0; y<height; y++){
      for(let x=0; x<width; x++){
        const p = parent[y][x];
        if(p) isParentOf[p[1]][p[0]] = true;
      }
    }

    const spurs = [];
    for(let y=0; y<height; y++){
      for(let x=0; x<width; x++){
        if(dist[y][x] > 0 && !isParentOf[y][x]){
          // Walk this leaf back to where it meets the main path.
          const chain = [];
          let cx=x, cy=y;
          while(dist[cy][cx] > 0){
            chain.unshift({x:cx, y:cy});
            const p = parent[cy][cx];
            cx = p[0]; cy = p[1];
          }
          spurs.push(chain); // chain[0] = nearest the main path, chain[last] = dead-end tip
        }
      }
    }
    return spurs;
  }

  /**
   * @param {number[][]} grid  the maze's wall/path grid (0=path, 1=wall)
   * @param {number} width
   * @param {number} height
   * @param {{x:number,y:number}[]} mainPath  from MazeGenerator.shortestPath()
   * @param {function():number} rng  a seeded 0..1 random function (for reproducible layouts)
   * @param {{stars:number, doors:number, flashes:number, hearts:number, hasGreenHeart:boolean}} cfg
   * @returns {{collectibles:Object, doors:Object}}
   *          Both keyed by "x,y". collectibles[key] = {type: 'star'|'flash'|'heart'|'greenHeart'}
   *          doors[key] = {locked:true, cost:1}
   */
  function generate(grid, width, height, mainPath, rng, cfg){
    const mainPathSet = new Set(mainPath.map(p => p.x + ',' + p.y));
    let spurs = findSpurs(grid, width, height, mainPathSet);

    // Shuffle for variety, then sort longest-first so the best branches
    // (long enough for star + door + reward) get picked for locked doors.
    spurs = MazeGenerator.shuffle(spurs, rng);
    spurs.sort((a,b) => b.length - a.length);

    const collectibles = {};
    const doors = {};
    const used = new Set();
    const markUsed = (chain) => chain.forEach(c => used.add(c.x + ',' + c.y));
    const isFree = (chain) => !chain.some(c => used.has(c.x + ',' + c.y));

    // ---- Green Heart: reserve the spur closest to the goal ----
    if(cfg.hasGreenHeart && spurs.length){
      const goal = mainPath[mainPath.length - 1];
      let best = null, bestDist = Infinity;
      for(const chain of spurs){
        const tip = chain[chain.length - 1];
        const d = Math.abs(tip.x - goal.x) + Math.abs(tip.y - goal.y);
        if(d < bestDist){ bestDist = d; best = chain; }
      }
      if(best){
        const tip = best[best.length - 1];
        collectibles[tip.x + ',' + tip.y] = { type: 'greenHeart' };
        markUsed(best);
      }
    }

    // ---- Locked branches: star near the entrance, door right after it,
    //      reward (flash/heart, alternating) at the dead-end tip ----
    let doorsPlaced = 0, flashesPlaced = 0, heartsPlaced = 0;
    const rewardCycle = ['flash', 'heart'];
    for(const chain of spurs){
      if(doorsPlaced >= cfg.doors) break;
      if(chain.length < 3) continue;   // need room for star + door + reward
      if(!isFree(chain)) continue;

      const starCell = chain[0];
      const doorCell = chain[1];
      const tip = chain[chain.length - 1];
      const rewardType = rewardCycle[doorsPlaced % rewardCycle.length];

      collectibles[starCell.x + ',' + starCell.y] = { type: 'star' };
      doors[doorCell.x + ',' + doorCell.y] = { locked: true, cost: 1 };
      collectibles[tip.x + ',' + tip.y] = { type: rewardType };
      if(rewardType === 'flash') flashesPlaced++; else heartsPlaced++;

      markUsed(chain);
      doorsPlaced++;
    }

    // ---- Plain free stars on whatever spurs are left ----
    let starsPlaced = 0;
    for(const chain of spurs){
      if(starsPlaced >= cfg.stars) break;
      if(!isFree(chain)) continue;
      const tip = chain[chain.length - 1];
      collectibles[tip.x + ',' + tip.y] = { type: 'star' };
      markUsed(chain);
      starsPlaced++;
    }

    // ---- Any extra flashes/hearts still owed (in case there weren't
    //      enough long spurs for doors), placed standalone with no door ----
    let extraFlashes = Math.max(0, cfg.flashes - flashesPlaced);
    let extraHearts = Math.max(0, cfg.hearts - heartsPlaced);
    for(const chain of spurs){
      if(extraFlashes<=0 && extraHearts<=0) break;
      if(!isFree(chain)) continue;
      const tip = chain[chain.length - 1];
      if(extraFlashes > 0){
        collectibles[tip.x + ',' + tip.y] = { type: 'flash' };
        extraFlashes--;
      } else {
        collectibles[tip.x + ',' + tip.y] = { type: 'heart' };
        extraHearts--;
      }
      markUsed(chain);
    }

    return { collectibles, doors };
  }

  window.MazeApp.Collectibles = { generate };
})();
