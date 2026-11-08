/* ==========================================================================
   Lunel interactive replicas — guided scenario driver
   --------------------------------------------------------------------------
   Chains the components that live inside it: the ring fills → a day opens in
   the calendar → the insight card responds → trends show the pattern over
   time. Beats, their durations and their captions all come from the markup,
   so a host page can re-cut the story without touching this file.

   Each beat element:
     <li data-beat="<scene>" data-ms="7000" data-act="<action>">caption</li>
   The actions are named below in ACTIONS; an unknown action is a no-op, so a
   host can drop a beat to a plain scene change.
   ========================================================================== */

(function () {
  'use strict';

  var L = window.Lunel;
  if (!L) return;

  L.define('scenario', function (root) {
    var scenes = {};
    root.querySelectorAll('[data-scene]').forEach(function (el) {
      scenes[el.getAttribute('data-scene')] = el;
    });

    var railEl = root.querySelector('[data-beats]');
    var captionEl = root.querySelector('[data-caption]');
    var playBtn = root.querySelector('[data-play]');
    var nextBtn = root.querySelector('[data-next]');
    var beats = [];
    railEl.querySelectorAll('li').forEach(function (li) {
      beats.push({
        el: li,
        scene: li.getAttribute('data-beat'),
        ms: parseInt(li.getAttribute('data-ms'), 10) || 7000,
        act: li.getAttribute('data-act') || '',
        caption: li.textContent.trim()
      });
      li.textContent = '';
    });

    var index = -1;
    var timer = null;
    var playing = false;

    /* Children mount after this root (document order), so look them up lazily. */
    function part(name) {
      var el = root.querySelector('[data-lunel-component="' + name + '"]');
      return el && el.__lunel ? el.__lunel : null;
    }

    function showScene(name) {
      for (var key in scenes) {
        if (!Object.prototype.hasOwnProperty.call(scenes, key)) continue;
        if (key === name) scenes[key].setAttribute('data-on', '');
        else scenes[key].removeAttribute('data-on');
      }
    }

    var ACTIONS = {
      /* 1 — the ring draws itself in, then scrubs a few days and comes back */
      ring: function () {
        var ring = part('cycle-ring');
        if (!ring) return;
        ring.replayIntro();
        if (L.motion.reduced()) return;
        var steps = [6, 9, 12, 9, 5, 2];
        steps.forEach(function (day, i) {
          setTimeout(function () { ring.setDay(day); }, 2400 + i * 520);
        });
      },

      /* 2 — open a logged day in the calendar */
      calendar: function () {
        var cal = part('calendar');
        if (!cal) return;
        cal.scrollToToday();
        setTimeout(function () { cal.selectCycleDay(1); }, 900);
        setTimeout(function () { cal.selectCycleDay(2); }, 2200);
      },

      /* 3 — back on Home, the insight card responds */
      insights: function () {
        var scroll = scenes.home && scenes.home.querySelector('[data-scene-scroll]');
        var insights = part('insights');
        if (scroll) {
          scroll.scrollTo({
            top: scroll.scrollHeight,
            behavior: L.motion.reduced() ? 'auto' : 'smooth'
          });
        }
        if (insights) setTimeout(function () { insights.openWeekly(); }, 1800);
      },

      /* 4 — the pattern over time, and the window pill re-counting it */
      trends: function () {
        var insights = part('insights');
        if (insights) insights.closeWeekly();
        var trends = part('trends');
        if (!trends) return;
        trends.setWindow('last3');
        trends.goTo(0);
        trends.playIn();
        setTimeout(function () { trends.setWindow('all'); }, 3200);
        setTimeout(function () { trends.goTo(1); }, 5600);
        setTimeout(function () { trends.goTo(2); }, 8200);
      }
    };

    function go(next) {
      clearTimeout(timer);
      if (next < 0 || next >= beats.length) {
        stop();
        return;
      }
      index = next;
      var beat = beats[index];
      showScene(beat.scene);
      captionEl.textContent = beat.caption;

      for (var i = 0; i < beats.length; i++) {
        beats[i].el.removeAttribute('data-current');
        if (i < index) beats[i].el.setAttribute('data-done', '');
        else beats[i].el.removeAttribute('data-done');
      }
      beat.el.style.setProperty('--beat-ms', beat.ms + 'ms');
      /* restart the rail fill */
      beat.el.removeAttribute('data-current');
      void beat.el.offsetWidth;
      if (playing) beat.el.setAttribute('data-current', '');
      else beat.el.setAttribute('data-done', '');

      var action = ACTIONS[beat.act];
      if (action) action();

      if (playing) {
        timer = setTimeout(function () {
          if (index === beats.length - 1) stop(true);
          else go(index + 1);
        }, beat.ms);
      }
    }

    function start() {
      playing = true;
      playBtn.setAttribute('data-playing', '');
      playBtn.textContent = playBtn.getAttribute('data-label-stop') || 'Stop';
      go(0);
    }

    function stop(finished) {
      playing = false;
      clearTimeout(timer);
      playBtn.removeAttribute('data-playing');
      playBtn.textContent = playBtn.getAttribute(
        finished ? 'data-label-replay' : 'data-label-play'
      ) || 'Play';
      if (finished) {
        for (var i = 0; i < beats.length; i++) {
          beats[i].el.removeAttribute('data-current');
          beats[i].el.setAttribute('data-done', '');
        }
      }
    }

    playBtn.addEventListener('click', function () {
      if (playing) stop();
      else start();
    });

    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        if (index >= beats.length - 1) {
          go(0);
          return;
        }
        go(index + 1);
      });
    }

    /* The toast / insight card can hand the story forward on its own. */
    root.addEventListener('lunel:toast-tap', function () {
      var at = -1;
      for (var i = 0; i < beats.length; i++) if (beats[i].act === 'trends') at = i;
      if (at >= 0) go(at);
    });

    showScene(beats.length ? beats[0].scene : 'home');
    captionEl.textContent = beats.length ? beats[0].caption : '';
    index = 0;

    return {
      start: start,
      stop: stop,
      go: go,
      get beat() { return index; }
    };
  });
})();
