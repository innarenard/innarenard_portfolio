/* Обложки кейсов: высота трека и переключение кейса по прокрутке.
   Блок с N кейсами держится у хедера N экранов прокрутки; внутри
   этого отрезка меняется активная обложка и карточка проекта.
   Разметка статична, скрипт только считает и ставит классы. */
(function () {
  'use strict';

  var HEADER = 88;          // высота шапки, макет
  var SCREEN = 676;         // высота плашки кейса, макет
  var MOBILE = 700;

  var stack = document.getElementById('caseStack');
  if (!stack) return;

  var screens = [].slice.call(stack.querySelectorAll('.case-screen')).map(function (el) {
    return {
      el: el,
      count: parseInt(el.getAttribute('data-cases'), 10) || 1,
      firstDot: parseInt(el.getAttribute('data-dot'), 10) || 0,
      doors: [].slice.call(el.querySelectorAll('.case-door')),
      projects: [].slice.call(el.querySelectorAll('.case-project')),
      dots: [].slice.call(el.querySelectorAll('.case-screen__dots span')),
      active: -1
    };
  });

  function isMobile() {
    // в свёрнутой панели браузера innerWidth бывает 0 — тогда это не телефон
    return window.innerWidth > 0 && window.innerWidth <= MOBILE;
  }

  function layout() {
    var mobile = isMobile();
    screens.forEach(function (s) {
      if (mobile) {
        s.el.style.height = '';
      } else {
        // один экран прокрутки на кейс плюс сама плашка
        var step = Math.max(window.innerHeight - HEADER, 420);
        s.el.style.height = (SCREEN + step * (s.count - 1) + step) + 'px';
      }
    });
  }

  function setActive(s, i) {
    if (s.active === i) return;
    s.active = i;
    s.doors.forEach(function (d, k) { toggle(d, k === i); });
    s.projects.forEach(function (p, k) { toggle(p, k === i); });
    var dot = s.firstDot + i;
    s.dots.forEach(function (d, k) { d.classList.toggle('is-active', k === dot); });
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

  function update() {
    if (isMobile()) {
      screens.forEach(function (s) {
        s.doors.forEach(function (d) { toggle(d, true); });
        s.projects.forEach(function (p) { toggle(p, true); });
        s.active = -1;
      });
      return;
    }
    screens.forEach(function (s) {
      if (s.count === 1) { setActive(s, 0); return; }
      var box = s.el.getBoundingClientRect();
      // сколько прокрутили внутри трека, от 0 до 1
      var travel = box.height - SCREEN;
      var passed = HEADER - box.top;
      var p = travel > 0 ? passed / travel : 0;
      p = p < 0 ? 0 : (p > 1 ? 1 : p);
      var i = Math.min(s.count - 1, Math.floor(p * s.count));
      setActive(s, i);
    });
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
