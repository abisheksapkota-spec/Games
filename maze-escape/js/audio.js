/* ==========================================================================
   audio.js
   One tiny sound effect (a soft chime played when each star is revealed on
   the level-complete modal), generated live with WebAudio — no sound files
   needed. If the browser blocks audio for any reason, it just fails silently.

   Exposes: window.MazeApp.Audio = { playChime(step) }
   ========================================================================== */

window.MazeApp = window.MazeApp || {};

(function(){
  "use strict";

  let audioContext; // created lazily, on first use (some browsers require a user gesture first)

  /**
   * Plays a short sine-wave "ding". `step` (0, 1, 2 ...) picks a note from
   * an ascending chord, so the 1st/2nd/3rd star each sound slightly different.
   */
  function playChime(step){
    try{
      audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();

      osc.type = 'sine';
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      osc.frequency.value = notes[step] || 880;

      gain.gain.value = 0.0001;
      osc.connect(gain);
      gain.connect(audioContext.destination);

      const now = audioContext.currentTime;
      gain.gain.exponentialRampToValueAtTime(0.15, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

      osc.start(now);
      osc.stop(now + 0.5);
    }catch(err){
      // Audio not available (e.g. autoplay restrictions) — safe to ignore.
    }
  }

  window.MazeApp.Audio = { playChime };
})();
