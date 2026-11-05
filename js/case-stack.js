/* Стопка блоков: каждый приклеен к шапке и остаётся на месте, следующий
   наезжает сверху, а тот, что под ним, бледнеет и исчезает.
   Распорка после блока даёт прокрутку, пока он приколот: по экрану на кейс.
   Точек девять — пять смысловых блоков и семь кейсов внутри них. */
(function () {
  'use strict';

  var HEADER = 88;
  var MOBILE = 700;
  var FADE = 1.3;   // во сколько раз исчезание опережает наезд
  var THIRD = 1 / 3;  // с какой доли экрана прокрутка доводится сама
  var DEAD = 0.05;    // мельче этого не возвращаем: иначе блок прыгает от любого касания
  /* Доводим на пиксель дальше точной остановки. При дробном devicePixelRatio
     (у Инны 1.8) шапка высотой 88px раскладывается в 87.99, и остановка
     попадает ровно на границу прилипания: браузер на каждом кадре решает
     заново, приклеен блок или ещё нет, и тот дёргается на треть пикселя.
     Лишний пиксель уводит блок за границу — на глаз незаметно. */
  var BIAS = 1;
  var GLIDE_MS = 300; // сколько едет доводка
  var IDLE_MS = 120; // через сколько после остановки руки она включается

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
      b.spacer.style.height = mobile ? '' : (h * (b.count - 1)) + 'px';
    });
    // место блока в потоке — его и спрашиваем, дошёл ли он до шапки
    var flowTop = flow.getBoundingClientRect().top + window.pageYOffset;
    blocks.forEach(function (b) { b.flowTop = flowTop + b.el.offsetTop; });
    if (about) aboutFlowTop = flowTop + about.offsetTop;

    if (mobile) {
      blocks.forEach(function (b) {
        if (b.content) b.content.style.opacity = mobile ? '' : '1';
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

    // Блоки едут один в один с прокруткой: никаких подтягиваний транформом.
    // Раньше блок тянуло к шапке по кривой, и крошечное движение колеса
    // давало втрое больший прыжок — отсюда и дёрганье. К шапке его доводит
    // не кривая, а доводка прокрутки ниже.
    function left(flowTop) {
      var d = flowTop - y - HEADER;   // сколько осталось до шапки
      return d < 0 ? 0 : (d > h ? h : d);
    }

    var lefts = blocks.map(function (b) { return left(b.flowTop); });
    var aboutLeft = about ? left(aboutFlowTop) : h;
    var spacerTops = blocks.map(function (b) {
      return b.spacer ? b.spacer.getBoundingClientRect().top : 0;
    });

    var dot = 0;
    blocks.forEach(function (b, k) {
      if (b.spacer) {
        // распорка начинается на экран ниже шапки; считаем, сколько её съели
        // +0.002: на самой границе дробь даёт 0.99999 и кейс не переключался
        var used = (HEADER + h) - spacerTops[k];
        var i = Math.floor(used / h + 0.002);
        setActive(b, i < 0 ? 0 : (i > b.count - 1 ? b.count - 1 : i));
      }

      // наезд следующего блока: 0 у нижнего края экрана, 1 у шапки
      var nextLeft = k + 1 < lefts.length ? lefts[k + 1] : aboutLeft;
      var cover = clamp(1 - nextLeft / h);
      // гаснет только содержимое, полотно под ним остаётся на месте
      var fade = clamp(cover * FADE);
      if (b.content) b.content.style.opacity = (1 - fade).toFixed(3);

      if (lefts[k] <= 0) dot = b.firstDot + (b.active > 0 ? b.active : 0);
    });

    if (aboutLeft <= 0) dot = dots.length - 1;
    paintDots(dot);
  }

  /* ---------- Доводка до остановки ----------
     Остановки стоят ровно через экран. Рука свободно тянет блок до трети
     экрана; как только треть пройдена, блок сам доезжает до шапки, и на
     это время колесо отключается — иначе инерция тачпада дерётся
     с доводкой и блок дёргается. Если рука остановилась, не дойдя
     до трети, блок так же сам возвращается назад. Ниже стопки не трогаем. */
  var stops = 0;       // сколько остановок в стопке
  var stackTop = 0;    // прокрутка, при которой первый экран у шапки
  var anchor = 0;      // остановка, от которой считаем
  var gliding = false;
  var glideRaf = 0;
  var idleTimer = 0;

  function metrics() {
    var h = blockHeight();
    stackTop = flow.getBoundingClientRect().top + window.pageYOffset - HEADER;
    stops = 1;
    blocks.forEach(function (b, i) { if (i) stops += b.count; });
    if (about) stops += 1;
    return h;
  }

  function relNow(h) { return (window.pageYOffset - stackTop) / h; }

  function inStack(rel) { return rel >= -0.02 && rel <= stops - 1 + 0.02; }

  function glideTo(index, h) {
    var to = stackTop + index * h + BIAS;
    var from = window.pageYOffset;
    var dist = to - from;
    if (Math.abs(dist) < 1) { anchor = index; return; }
    if (glideRaf) cancelAnimationFrame(glideRaf);
    gliding = true;
    var t0 = 0;
    var step = function (now) {
      if (!t0) t0 = now;
      var k = (now - t0) / GLIDE_MS;
      if (k > 1) k = 1;
      // мягко трогается и мягко тормозит — так движение читается уверенным
      var e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      window.scrollTo({ top: from + dist * e, behavior: 'instant' });
      if (k < 1) { glideRaf = requestAnimationFrame(step); }
      else { glideRaf = 0; gliding = false; anchor = index; }
    };
    glideRaf = requestAnimationFrame(step);
  }

  // пока блок едет сам, колесо и клавиши не вмешиваются
  function block(e) { if (gliding) e.preventDefault(); }

  function onScroll() {
    update();
    if (gliding || isMobile()) return;

    var h = metrics();
    var rel = relNow(h);
    if (!inStack(rel)) {
      anchor = Math.max(0, Math.min(stops - 1, Math.round(rel)));
      return;
    }

    var delta = rel - anchor;
    // вниз от последней остановки уходим свободно: там «Обо мне» и подвал
    if (delta > 0 && anchor >= stops - 1) return;

    if (delta >= THIRD || delta <= -THIRD) {
      var jump = delta > 0 ? Math.max(1, Math.round(delta)) : Math.min(-1, Math.round(delta));
      glideTo(Math.max(0, Math.min(stops - 1, anchor + jump)), h);
      return;
    }

    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(function () {
      if (gliding || isMobile()) return;
      var hh = metrics();
      var r = relNow(hh);
      if (!inStack(r)) return;
      var d = r - anchor;
      if (d > 0 && anchor >= stops - 1) return;
      if (Math.abs(d) < DEAD || Math.abs(d) >= THIRD) return;
      glideTo(anchor, hh);
    }, IDLE_MS);
  }

  window.addEventListener('wheel', block, { passive: false });
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { layout(); update(); });
  window.addEventListener('load', function () { layout(); update(); });
})();
