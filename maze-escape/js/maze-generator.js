/* ==========================================================================
   maze-generator.js
   Pure maze-generation math — no DOM, no game state. Everything here is a
   plain function so it's easy to test or reuse on its own.

   Exposes: window.MazeApp.MazeGenerator = { mulberry32, shuffle, generateMaze, shortestPathLen }
   ========================================================================== */

window.MazeApp = window.MazeApp || {};

(function(){
  "use strict";

  /**
   * A tiny seeded random-number generator ("mulberry32"). Using a seed
   * (instead of Math.random) means the SAME level always generates the
   * SAME maze within a session — handy for "Retry".
   */
  function mulberry32(seed){
    return function(){
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /** Shuffle an array in place using the given rng() function (0..1). */
  function shuffle(arr, rng){
    for(let i=arr.length-1; i>0; i--){
      const j = Math.floor(rng()*(i+1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /**
   * Generates a maze using the "recursive backtracker" algorithm, then
   * optionally "braids" it (turns some dead-ends into loops, which makes
   * the maze more forgiving / easier).
   *
   * @param {number} w - maze width in CELLS (not pixels/grid-units)
   * @param {number} h - maze height in CELLS
   * @param {number} braidChance - 0 = a "perfect" maze (only dead ends,
   *                  exactly one solution, hardest). 1 = very loopy, easy.
   * @param {number} seed - RNG seed, so the same level regenerates identically
   * @returns {{grid:number[][], width:number, height:number}}
   *          grid is width×height cells where 0 = walkable path, 1 = wall.
   *          The rendered grid is (2*w+1) by (2*h+1): every maze "cell"
   *          becomes a path tile, with a wall or opening between each pair.
   */
  function generateMaze(w, h, braidChance, seed){
    const rng = mulberry32(seed);
    const width = 2*w+1, height = 2*h+1;
    const grid = Array.from({length:height}, () => Array(width).fill(1));
    const visited = Array.from({length:h}, () => Array(w).fill(false));
    const toGrid = (cx,cy) => ({x:2*cx+1, y:2*cy+1});

    const stack = [[0,0]];
    visited[0][0] = true;
    { const p = toGrid(0,0); grid[p.y][p.x] = 0; }

    const DIRS = [[0,-1],[0,1],[-1,0],[1,0]]; // N, S, W, E

    while(stack.length){
      const [cx,cy] = stack[stack.length-1];
      const dirs = shuffle(DIRS.slice(), rng);
      let moved = false;

      for(const [dx,dy] of dirs){
        const nx = cx+dx, ny = cy+dy;
        if(nx>=0 && nx<w && ny>=0 && ny<h && !visited[ny][nx]){
          visited[ny][nx] = true;
          const a = toGrid(cx,cy), b = toGrid(nx,ny);
          grid[b.y][b.x] = 0;                          // open the new cell
          grid[(a.y+b.y)/2][(a.x+b.x)/2] = 0;           // open the wall between them
          stack.push([nx,ny]);
          moved = true;
          break;
        }
      }
      if(!moved) stack.pop(); // dead end — backtrack
    }

    if(braidChance > 0){
      braid(grid, w, h, rng, braidChance, toGrid);
    }

    return {grid, width, height};
  }

  /** Turns some dead-ends into loops by knocking down one extra wall. */
  function braid(grid, w, h, rng, braidChance, toGrid){
    const neighborDirs = [[0,-1],[0,1],[-1,0],[1,0]];

    for(let cy=0; cy<h; cy++){
      for(let cx=0; cx<w; cx++){
        const p = toGrid(cx,cy);

        const openCount = neighborDirs.filter(([dx,dy]) => {
          const wx=p.x+dx, wy=p.y+dy;
          return grid[wy] && grid[wy][wx]===0;
        }).length;

        if(openCount===1 && rng()<braidChance){
          const closed = neighborDirs.filter(([dx,dy]) => {
            const wx=p.x+dx, wy=p.y+dy;
            const cx2=cx+dx, cy2=cy+dy;
            if(cx2<0||cx2>=w||cy2<0||cy2>=h) return false;
            return grid[wy] && grid[wy][wx]===1;
          });
          if(closed.length){
            const [dx,dy] = closed[Math.floor(rng()*closed.length)];
            grid[p.y+dy][p.x+dx] = 0;
          }
        }
      }
    }
  }

  /**
   * Breadth-first search for the shortest path length between two points
   * in grid coordinates. Used to (a) confirm the maze is solvable and
   * (b) calculate a fair "par" time for star ratings.
   */
  function shortestPathLen(grid, width, height, sx, sy, gx, gy){
    const dist = Array.from({length:height}, () => Array(width).fill(-1));
    dist[sy][sx] = 0;
    const queue = [[sx,sy]];
    let qi = 0;

    while(qi < queue.length){
      const [x,y] = queue[qi++];
      if(x===gx && y===gy) return dist[y][x];

      for(const [dx,dy] of [[0,-1],[0,1],[-1,0],[1,0]]){
        const nx=x+dx, ny=y+dy;
        if(nx>=0 && nx<width && ny>=0 && ny<height && grid[ny][nx]===0 && dist[ny][nx]===-1){
          dist[ny][nx] = dist[y][x]+1;
          queue.push([nx,ny]);
        }
      }
    }
    return dist[gy][gx]; // -1 if unreachable (shouldn't happen)
  }

  window.MazeApp.MazeGenerator = { mulberry32, shuffle, generateMaze, shortestPathLen };
})();
