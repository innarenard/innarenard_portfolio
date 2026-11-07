/* Обложка-карусель: экраны едут по одной оси, тот, что в центре, крупнее.
   Параметры берутся из data-атрибутов сцены, в пикселях макета Figma
   (размер вдоль оси движения):
     data-small  — малый экран,  data-big — крупный,  data-gap — зазор между краями,
     data-axis   — x или y,      data-dir — 1 (вправо/вниз) или -1 (влево/вверх),
     data-start  — какой по счёту экран стоит в центре на первом кадре.
   Экран стоит в центре HOLD мс, затем за MOVE мс сдвигается на одно место.
   Положение каждого экрана — дробный номер места p (0 — центр), из него
   считаются сдвиг --off (в пикселях макета) и масштаб --k. */
(function () {
  var HOLD = 2200;
  var MOVE = 900;

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function ease(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function num(el, name, def) {
    var v = parseFloat(el.getAttribute('data-' + name));
    return isNaN(v) ? def : v;
  }

  function setup(stage) {
    var shots = [].slice.call(stage.children);
    var n = shots.length;
    var small = num(stage, 'small', 230.63);
    var big = num(stage, 'big', 267.07);
    var gap = num(stage, 'gap', 36);
    var dir = num(stage, 'dir', -1);
    var start = num(stage, 'start', 0);
    var kBig = big / small;
    var near = big / 2 + gap + small / 2; // от центра до соседа
    var pitch = small + gap;              // между малыми
    var visible = true;
    var t0 = null;
    var elapsed = 0;

    function place(p) {
      var a = Math.abs(p);
      var d = a <= 1 ? near * a : near + pitch * (a - 1);
      return p < 0 ? -d : d;
    }

    function render(offset) {
      shots.forEach(function (el, i) {
        // место экрана относительно центра, свёрнутое в [-n/2, n/2)
        var p = ((i - start + dir * offset) % n + n * 1.5) % n - n / 2;
        var a = Math.min(Math.abs(p), 1);
        el.style.setProperty('--off', place(p).toFixed(2));
        el.style.setProperty('--k', (kBig - (kBig - 1) * a).toFixed(4));
        el.style.zIndex = String(10 - Math.round(Math.abs(p)));
      });
    }

    render(0);
    if (reduce || n < 2) return;

    function frame(now) {
      if (!visible) { t0 = null; return; }
      if (t0 === null) t0 = now - elapsed;
      elapsed = now - t0;
      var cycle = HOLD + MOVE;
      var step = Math.floor(elapsed / cycle);
      var inCycle = elapsed - step * cycle;
      var frac = inCycle < HOLD ? 0 : ease((inCycle - HOLD) / MOVE);
      render(step + frac);
      requestAnimationFrame(frame);
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        var was = visible;
        visible = entries[0].isIntersecting;
        if (visible && !was) requestAnimationFrame(frame);
      }).observe(stage.parentNode);
    }
    requestAnimationFrame(frame);
  }

  function init() {
    [].forEach.call(document.querySelectorAll('[data-cover-carousel]'), setup);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
