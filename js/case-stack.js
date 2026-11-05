/* Стопка блоков: каждый приклеен к шапке и остаётся на месте, следующий
   наезжает сверху, а тот, что под ним, бледнеет и исчезает.
   Распорка после блока даёт прокрутку, пока он приколот: по экрану на кейс.
   Точек девять — пять смысловых блоков и семь кейсов внутри них. */
(function () {
  'use strict';

  var HEADER = 88;
  var MOBILE = 700;
  var DIM = 0.02;   // насколько уезжающий блок уменьшается, пока исчезает

  var flow = document.querySelector('.case-flow');
  var hero = document.querySelector('.hero');
  var about = document.querySelector('.case-flow > .about');
  var dotsBox = document.getElementById('pageDots');
  if (!flow || !hero) return;

  var dots = dotsBox ? [].slice.call(dotsBox.querySelectorAll('.page-dots__dot')) : [];

  var blocks = [{ el: hero, spacer: null, count: 1, firstDot: 0, doors: [], projects: [], active: 0 }];

  [].slice.call(flow.querySelectorAll('.case-screen')).forEach(function (el) {
    var id = el.getAttribute('data-case-screen');
    blocks.push({
      el: el,
      spacer: flow.querySelector('.case-spacer[data-spacer-for="' + id + '"]'),
      count: parseInt(el.getAttribute('data-cases'), 10) || 1,
      firstDot: parseInt(el.getAttribute('data-dot'), 10) || 0,
      doors: [].slice.call(el.querySelectorAll('.case-door')),
      projects: [].slice.call(el.querySelectorAll('.case-project')),
      active: -1
    });
  });

  // следующий блок — тот, кто наедет сверху; у последнего это «Обо мне»
  blocks.forEach(function (b, i) {
    b.next = blocks[i + 1] ? blocks[i + 1].el : about;
  });

  function isMobile() {
    // в свёрнутой панели браузера innerWidth равен 0 — это не телефон
    return window.innerWidth > 0 && window.innerWidth <= MOBILE;
  }

  function blockHeight() {
    return Math.max(560, window.innerHeight - HEADER);
  }

  function layout() {
    var mobile = isMobile();
    var h = blockHeight();
    blocks.forEach(function (b) {
      if (!b.spacer) return;
      b.spacer.style.height = mobile ? '' : (h * b.count) + 'px';
    });
    // место блока в потоке — его и спрашиваем, дошёл ли он до шапки
    var flowTop = flow.getBoundingClientRect().top + window.pageYOffset;
    blocks.forEach(function (b) { b.flowTop = flowTop + b.el.offsetTop; });
    if (mobile) {
      blocks.forEach(function (b) {
        b.el.style.opacity = '';
        b.el.style.transform = '';
      });
    }
  }

  function toggle(el, on) {
    el.classList.toggle('is-active', on);
    if (on) {
      el.removeAttribute('tabindex');
      el.removeAttribute('aria-hidden');
    } else {
      el.setAttribute('tabindex', '-1');
      el.setAttribute('aria-hidden', 'true');
    }
  }

  function setActive(b, i) {
    if (b.active === i) return;
    b.active = i;
    b.doors.forEach(function (d, k) { toggle(d, k === i); });
    b.projects.forEach(function (p, k) { toggle(p, k === i); });
  }

  var currentDot = -1;
  function paintDots(i) {
    if (!dots.length || i === currentDot) return;
    currentDot = i;
    dots.forEach(function (d, k) {
      var far = Math.abs(k - i);
      d.classList.toggle('is-active', far === 0);
      d.classList.toggle('is-close', far <= 1);
      d.classList.toggle('is-near', far === 2);
    });
  }

  function clamp(v) { return v < 0 ? 0 : (v > 1 ? 1 : v); }

  function update() {
    if (isMobile()) {
      blocks.forEach(function (b) {
        b.doors.forEach(function (d) { toggle(d, true); });
        b.projects.forEach(function (p) { toggle(p, true); });
        b.active = -1;
      });
      return;
    }

    var h = blockHeight();

    // сначала читаем геометрию, потом пишем стили — чтобы не дёргать раскладку
    var read = blocks.map(function (b) {
      return {
        top: b.el.getBoundingClientRect().top,
        spacerTop: b.spacer ? b.spacer.getBoundingClientRect().top : 0,
        nextTop: b.next ? b.next.getBoundingClientRect().top : Infinity
      };
    });
    var aboutTop = about ? about.getBoundingClientRect().top : Infinity;

    var dot = 0;
    blocks.forEach(function (b, k) {
      var r = read[k];

      if (b.spacer) {
        // распорка начинается на экран ниже шапки; считаем, сколько её съели
        var used = (HEADER + h) - r.spacerTop;
        var i = Math.floor(used / h);
        setActive(b, i < 0 ? 0 : (i > b.count - 1 ? b.count - 1 : i));
      }

      // следующий блок наезжает: от нижнего края экрана до шапки
      var cover = clamp((HEADER + h - r.nextTop) / h);
      b.el.style.opacity = String(1 - cover);
      b.el.style.transform = cover ? "scale(" + (1 - DIM * cover) + ")" : "";

      if (window.pageYOffset + HEADER >= b.flowTop - 1) {
        dot = b.firstDot + (b.active > 0 ? b.active : 0);
      }
    });

    if (aboutTop <= HEADER + 1) dot = dots.length - 1;
    paintDots(dot);
  }

  layout();
  update();
  // браузер и так шлёт scroll не чаще кадра, лишняя защёлка только мешает
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', function () { layout(); update(); });
  window.addEventListener('load', function () { layout(); update(); });
})();
