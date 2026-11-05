/* Стопка блоков: каждый приклеен к шапке и остаётся на месте, следующий
   наезжает сверху, а тот, что под ним, бледнеет и исчезает.
   Распорка после блока даёт прокрутку, пока он приколот: по экрану на кейс.
   Точек девять — пять смысловых блоков и семь кейсов внутри них. */
(function () {
  'use strict';

  var HEADER = 88;
  var MOBILE = 700;
  var DIM = 0.03;   // насколько содержимое уменьшается, пока исчезает
  var FADE = 1.3;   // во сколько раз исчезание опережает наезд
  var LAND = 0.68;  // на какой доле перехода блок уже стоит у шапки

  var flow = document.querySelector('.case-flow');
  var hero = document.querySelector('.hero');
  var about = document.querySelector('.case-flow > .about');
  var dotsBox = document.getElementById('pageDots');
  if (!flow || !hero) return;

  var dots = dotsBox ? [].slice.call(dotsBox.querySelectorAll('.page-dots__dot')) : [];
  var aboutFlowTop = 0;

  var blocks = [{ el: hero, content: hero.querySelector('.hero__stage'), spacer: null, count: 1, firstDot: 0, doors: [], projects: [], active: 0 }];

  [].slice.call(flow.querySelectorAll('.case-screen')).forEach(function (el) {
    var id = el.getAttribute('data-case-screen');
    blocks.push({
      el: el,
      content: el.querySelector('.case-screen__inner'),
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
    if (about) aboutFlowTop = flowTop + about.offsetTop;
    if (mobile && about) about.style.transform = '';
    if (mobile) {
      blocks.forEach(function (b) {
        b.el.style.transform = '';
        if (!b.content) return;
        b.content.style.opacity = '';
        b.content.style.transform = '';
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
    var y = window.pageYOffset;

    // Магнит. Блок идёт к шапке быстрее прокрутки: оставшееся расстояние
    // считается не один к одному, а по кривой, и доходит до нуля, когда
    // прокручено LAND от перехода. Дальше сдвиг сам сходит на нет,
    // потому что блок и так дополз до шапки.
    function pull(flowTop) {
      var d = flowTop - y - HEADER;     // сколько осталось до шапки
      if (d <= 0) return { d: d, left: 0, shift: 0 };
      var t = clamp(1 - d / h);         // 0 у нижнего края, 1 у шапки
      var p = clamp(t / LAND);
      var left = h * (1 - p) * (1 - p); // сколько должно остаться на вид
      if (left > d) left = d;           // вниз не тянем
      return { d: d, left: left, shift: left - d };
    }

    var pulls = blocks.map(function (b) { return pull(b.flowTop); });
    var aboutPull = about ? pull(aboutFlowTop) : null;
    var spacerTops = blocks.map(function (b) {
      return b.spacer ? b.spacer.getBoundingClientRect().top : 0;
    });

    var dot = 0;
    blocks.forEach(function (b, k) {
      var me = pulls[k];
      var next = pulls[k + 1] || aboutPull;

      b.el.style.transform = me.shift ? "translate3d(0," + me.shift.toFixed(1) + "px,0)" : "";

      if (b.spacer) {
        // распорка начинается на экран ниже шапки; считаем, сколько её съели
        var used = (HEADER + h) - spacerTops[k];
        var i = Math.floor(used / h);
        setActive(b, i < 0 ? 0 : (i > b.count - 1 ? b.count - 1 : i));
      }

      // наезд считаем по тому, где следующий блок виден, а не где он в потоке
      var cover = next ? clamp(1 - next.left / h) : 0;
      var fade = clamp(cover * FADE);
      if (b.content) {
        b.content.style.opacity = String(1 - fade);
        b.content.style.transform = fade ? "scale(" + (1 - DIM * fade) + ")" : "";
      }

      // блок считается текущим, как только доехал до шапки на вид
      if (me.left <= 0) dot = b.firstDot + (b.active > 0 ? b.active : 0);
    });

    if (about) {
      about.style.transform = aboutPull.shift ? "translate3d(0," + aboutPull.shift.toFixed(1) + "px,0)" : "";
      if (aboutPull.left <= 0) dot = dots.length - 1;
    }
    paintDots(dot);
  }

  // браузер и так шлёт scroll не чаще кадра, лишняя защёлка только мешает
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', function () { layout(); update(); });
  window.addEventListener('load', function () { layout(); update(); });
})();
