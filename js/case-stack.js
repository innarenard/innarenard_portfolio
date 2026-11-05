/* Стопка блоков и точки разделов.
   Пять смысловых блоков: первый экран, Lunel, Самокат (4 кейса),
   МЭШ (2 кейса), «Обо мне». Точек девять — блоки плюс кейсы внутри них.
   Высота блока равна высоте окна минус шапка, поэтому трек каждого
   блока считается заново на resize. */
(function () {
  'use strict';

  var HEADER = 88;
  var MOBILE = 700;

  var hero = document.querySelector('.hero');
  var stack = document.getElementById('caseStack');
  var about = document.querySelector('.case-flow > .about');
  var dotsBox = document.getElementById('pageDots');
  if (!hero || !stack) return;

  var dots = dotsBox ? [].slice.call(dotsBox.querySelectorAll('.page-dots__dot')) : [];

  var screens = [].slice.call(stack.querySelectorAll('.case-screen')).map(function (el) {
    return {
      el: el,
      inner: el.querySelector('.case-screen__inner'),
      count: parseInt(el.getAttribute('data-cases'), 10) || 1,
      firstDot: parseInt(el.getAttribute('data-dot'), 10) || 0,
      doors: [].slice.call(el.querySelectorAll('.case-door')),
      projects: [].slice.call(el.querySelectorAll('.case-project')),
      active: -1
    };
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
    screens.forEach(function (s) {
      // блок держится у шапки столько экранов прокрутки, сколько в нём кейсов
      s.el.style.height = mobile ? '' : (h * (s.count + 1)) + 'px';
    });
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

  function setActive(s, i) {
    if (s.active === i) return;
    s.active = i;
    s.doors.forEach(function (d, k) { toggle(d, k === i); });
    s.projects.forEach(function (p, k) { toggle(p, k === i); });
  }

  // размеры точек из макета: рядом с активной 8, через одну 6, дальше 4
  var current = -1;
  function paintDots(i) {
    if (!dots.length || i === current) return;
    current = i;
    dots.forEach(function (d, k) {
      var far = Math.abs(k - i);
      d.classList.toggle('is-active', far === 0);
      d.classList.toggle('is-close', far <= 1);
      d.classList.toggle('is-near', far === 2);
    });
  }

  function update() {
    if (isMobile()) {
      screens.forEach(function (s) {
        s.doors.forEach(function (d) { toggle(d, true); });
        s.projects.forEach(function (p) { toggle(p, true); });
        s.active = -1;
      });
      return;
    }

    var h = blockHeight();
    var dot = 0; // первый экран

    screens.forEach(function (s) {
      var box = s.el.getBoundingClientRect();
      var travel = box.height - h;
      var passed = HEADER - box.top;
      var p = travel > 0 ? passed / travel : 0;
      p = p < 0 ? 0 : (p > 1 ? 1 : p);
      var i = Math.min(s.count - 1, Math.floor(p * s.count));
      setActive(s, i);
      // блок считается текущим, как только дошёл до шапки
      if (box.top <= HEADER + 1) dot = s.firstDot + i;
    });

    if (about && about.getBoundingClientRect().top <= HEADER + 1) dot = dots.length - 1;
    paintDots(dot);
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { ticking = false; update(); });
  }

  layout();
  update();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { layout(); update(); });
  window.addEventListener('load', function () { layout(); update(); });
})();
