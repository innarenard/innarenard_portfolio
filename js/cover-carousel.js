/* Обложка-карусель: экраны едут справа налево, тот, что в центре, крупнее.
   Геометрия из макета Figma (кадр 839×644, «Перемещение товаров», 3960:30211):
   малый экран 230.63×500, крупный 267.07×579, зазор между краями 36.
   Экран стоит в центре HOLD мс, затем за MOVE мс уезжает на одно место влево.
   Положение каждого экрана — дробный номер места p (0 — центр), из него
   считаются сдвиг --x (в пикселях макета) и масштаб --k. */
(function () {
  var SMALL = 230.63;
  var BIG = 267.07;
  var GAP = 36;
  var K_BIG = BIG / SMALL;
  var NEAR = BIG / 2 + GAP + SMALL / 2; // от центра до соседа
  var PITCH = SMALL + GAP;              // между малыми
  var HOLD = 2200;
  var MOVE = 900;

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function ease(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function place(p) {
    var a = Math.abs(p);
    var d = a <= 1 ? NEAR * a : NEAR + PITCH * (a - 1);
    return p < 0 ? -d : d;
  }

  function setup(stage) {
    var shots = [].slice.call(stage.querySelectorAll('.tg-cover__shot'));
    var n = shots.length;
    var start = parseInt(stage.getAttribute('data-start') || '0', 10);
    var visible = true;
    var t0 = null;

    function render(offset) {
      shots.forEach(function (el, i) {
        // место экрана относительно центра, свёрнутое в [-n/2, n/2)
        var p = ((i - start - offset) % n + n * 1.5) % n - n / 2;
        var a = Math.min(Math.abs(p), 1);
        el.style.setProperty('--x', place(p).toFixed(2));
        el.style.setProperty('--k', (K_BIG - (K_BIG - 1) * a).toFixed(4));
        el.style.zIndex = String(10 - Math.round(Math.abs(p)));
      });
    }

    render(0);
    if (reduce || n < 2) return;

    function frame(now) {
      if (!visible) { t0 = null; return; }
      if (t0 === null) t0 = now - (stage._elapsed || 0);
      var e = now - t0;
      stage._elapsed = e;
      var cycle = HOLD + MOVE;
      var step = Math.floor(e / cycle);
      var inCycle = e - step * cycle;
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
