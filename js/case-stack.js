/* Стопка блоков: каждый приклеен к шапке и остаётся на месте, следующий
   наезжает сверху, а тот, что под ним, бледнеет и исчезает.
   Распорка после блока даёт прокрутку, пока он приколот: по экрану на кейс.
   Точек девять — пять смысловых блоков и семь кейсов внутри них. */
(function () {
  'use strict';

  var HEADER = 88;
  var MOBILE = 700;
  var FADE = 1.3;   // во сколько раз исчезание опережает наезд
  /* Доводим на пиксель дальше точной остановки. При дробном devicePixelRatio
     (у Инны 1.8) шапка высотой 88px раскладывается в 87.99, и остановка
     попадает ровно на границу прилипания: браузер на каждом кадре решает
     заново, приклеен блок или ещё нет, и тот дёргается на треть пикселя.
     Лишний пиксель уводит блок за границу — на глаз незаметно. */
  var BIAS = 1;
  // карточка проекта отстаёт от обложки компании: лёгкий параллакс по времени
  var LAG_TAU = 0.05;  // с

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
    blocks.forEach(function (b) {
      // меряем по раскладке (offsetTop), а не по rect: на карточках уже
      // висит сдвиг от прошлого кадра, и rect показал бы его же
      var innerH = b.content ? b.content.offsetHeight : 0;
      b.projectUp = b.projects.map(function (c) { return c.offsetHeight + 24; });
      // вниз — за нижний край блока, чтобы следующую карточку не было
      // видно заранее: блок обрезает содержимое по себе
      b.projectDown = b.projects.map(function (c) {
        var d = innerH - c.offsetTop + 16;
        return d > 0 ? d : c.offsetHeight + 24;
      });
      b.doorTravel = b.doors.length && b.doors[0].offsetHeight ? b.doors[0].offsetHeight : h;
      b.uc = null;   // после перекладки опоздание сбрасываем, иначе карточка поедет сама
    });

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

  /* ---------- Карточки внутри блока ----------
     u — дробный номер кейса: 2.0 значит «третий стоит», 2.4 — «третий
     прошёл сорок процентов пути к четвёртому». Уходящая карточка чуть
     уменьшается и медленно уезжает вверх, следующая быстро поднимается
     снизу и растёт из маленькой. Разная скорость на одном отрезке
     прокрутки и даёт параллакс. Карточка проекта уезжает под карточку
     компании: у той z-index выше. */
  var DOOR_UP = 0.32;     // доля высоты, на которую уходит обложка вверх
  var DOOR_SMALL = 0.22;  // насколько мельчает уходящая обложка
  var DOOR_IN = 0.2;      // с какого уменьшения начинается приходящая
  var CARD_UP = 0.18;     // то же для карточки проекта
  var CARD_IN = 0.18;

  // уходит — резво с самого начала; приходит — резво, а в конце мягко садится
  function out(t) { var k = 1 - t; return 1 - k * k; }
  function inc(t) { var k = 1 - t; return k * k; }

  function paintCards(b, u, uc) {
    for (var k = 0; k < b.doors.length; k++) {
      var rel = k - u;                 // 0 — эта карточка сейчас на месте
      if (rel > -0.01 && rel < 0.01) rel = 0;   // на остановке карточка стоит ровно
      var off = rel < -1 || rel > 1;
      var relC = k - uc;               // карточка проекта идёт с небольшим опозданием
      if (relC > -0.01 && relC < 0.01) relC = 0;
      var offC = relC < -1 || relC > 1;

      var door = b.doors[k];
      if (door) {
        if (off) {
          door.style.opacity = "0";
        } else if (rel <= 0) {
          var e = out(-rel);
          door.style.transform = "translate3d(0," + (-e * DOOR_UP * b.doorTravel).toFixed(1) +
            "px,0) scale(" + (1 - e * DOOR_SMALL).toFixed(4) + ")";
          // гаснет чуть медленнее, чем мельчает, иначе уменьшения не видно
          door.style.opacity = clamp(1 + rel * 1.7).toFixed(3);
          door.style.zIndex = "1";
        } else {
          var r = inc(1 - rel);
          door.style.transform = "translate3d(0," + (r * b.doorTravel).toFixed(1) +
            "px,0) scale(" + (1 - r * DOOR_IN).toFixed(4) + ")";
          door.style.opacity = "1";
          door.style.zIndex = "2";
        }
      }

      var card = b.projects[k];
      if (!card) continue;
      if (offC) {
        card.style.opacity = "0";
      } else if (relC <= 0) {
        // уезжает под карточку компании, поэтому гаснет только у самого края
        var ec = out(-relC);
        card.style.transform = "translate3d(0," + (-ec * (b.projectUp[k] || 200)).toFixed(1) +
          "px,0) scale(" + (1 - ec * CARD_UP).toFixed(4) + ")";
        // гаснет по той же резвой кривой, что и движение, и быстрее неё:
        // иначе уходящая карточка наезжает на блок компании и сливается с ним
        card.style.opacity = clamp(1 - ec * 3.1).toFixed(3);
        card.style.zIndex = "1";
      } else {
        // поднимается из-за нижнего края блока — заранее её не видно
        var rc = inc(1 - relC);
        card.style.transform = "translate3d(0," + (rc * (b.projectDown[k] || 300)).toFixed(1) +
          "px,0) scale(" + (1 - rc * CARD_IN).toFixed(4) + ")";
        card.style.opacity = "1";
        card.style.zIndex = "2";
      }
    }
  }

  function clearCards(b) {
    b.doors.concat(b.projects).forEach(function (el) {
      el.style.transform = "";
      el.style.opacity = "";
      el.style.zIndex = "";
    });
  }

  function update() {
    if (isMobile()) {
      blocks.forEach(function (b) {
        b.doors.forEach(function (d) { toggle(d, true); });
        b.projects.forEach(function (p) { toggle(p, true); });
        clearCards(b);
        b.active = -1;
      });
      return;
    }

    var h = blockHeight();
    var y = window.pageYOffset;
    var now = performance.now();
    var dtU = lastUpd ? Math.min(0.05, (now - lastUpd) / 1000) : 1;
    lastUpd = now;
    var kLag = 1 - Math.exp(-dtU / LAG_TAU);
    var lagLive = false;

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
        var u = used / h + 0.002;
        if (u < 0) u = 0;
        if (u > b.count - 1) u = b.count - 1;
        var i = Math.floor(u);
        setActive(b, i);
        if (b.uc == null) b.uc = u;
        else {
          b.uc += (u - b.uc) * kLag;
          if (Math.abs(u - b.uc) < 0.0005) b.uc = u; else lagLive = true;
        }
        paintCards(b, u, b.uc);
      }

      // наезд следующего блока: 0 у нижнего края экрана, 1 у шапки
      var nextLeft = k + 1 < lefts.length ? lefts[k + 1] : aboutLeft;
      var cover = clamp(1 - nextLeft / h);
      // гаснет только содержимое, полотно под ним остаётся на месте
      var fade = clamp(cover * FADE);
      if (b.content) b.content.style.opacity = (1 - fade).toFixed(3);

      if (!b.spacer) paintCards(b, 0, 0);

      if (lefts[k] <= 0) dot = b.firstDot + (b.active > 0 ? b.active : 0);
    });

    if (aboutLeft <= 0) dot = dots.length - 1;
    paintDots(dot);

    // прокрутка встала, а карточка проекта ещё догоняет — дорисовываем сами
    if (lagLive && !lagRaf) lagRaf = requestAnimationFrame(function () { lagRaf = 0; update(); });
  }
  var lastUpd = 0;
  var lagRaf = 0;

  /* ---------- Плавная прокрутка и доводка ----------
     Главный принцип: скорость нигде не обрывается, и рука может перебить
     движение в любой момент.
     1. Колесо двигает не страницу, а цель. Страница догоняет цель по
        экспоненте (TAU): щелчки мыши превращаются в ровный ход, а задержки
        на глаз нет.
     2. Решение «к какому кейсу ехать» принимается в конце жеста, а не
        посреди него: по позиции плюс прикидке инерции (куда страница
        доехала бы сама). Дальше одной остановки за жест не уезжаем.
     3. Доводка — критически задемпфированная пружина: стартует с той
        скоростью, с которой страница уже ехала, и садится без отскока.
     4. Колесо не блокируется. Затухающий хвост инерции тачпада доводка
        поглощает, а новый жест — усиление, смена направления или пауза —
        сразу отдаёт управление руке.
     На телефоне и при «уменьшить движение» в системе всё это выключено:
     там обычная прокрутка браузера. */
  var TAU = 0.085;      // с: за это время страница проходит ~63% пути до цели
  var OMEGA = 12;       // рад/с: жёсткость пружины доводки
  var ADV_PAD = 0.14;   // доля экрана: дальше — едем к следующему кейсу (тачпад)
  var ADV_WHEEL = 0.05; // мышке хватает одного щелчка колеса
  var END_MS = 90;      // столько тишины колеса — жест закончен
  var EXT_MS = 140;     // то же для прокрутки ползунком и прочего не-колеса
  var FLICK = 22;       // px за событие: с такого пика жест считаем броском

  var reduceMotion = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

  var stops = 0;       // сколько остановок в стопке
  var stackTop = 0;    // прокрутка, при которой первый экран у шапки

  var pos = window.pageYOffset;  // где страница сейчас (дробное)
  var target = pos;              // куда её тянет колесо
  var vel = 0;                   // px/с
  var mode = 'idle';             // idle | follow | spring
  var springTo = 0;
  var raf = 0, lastT = 0;
  var written = -1;              // последняя прокрутка, выставленная нами

  var lastWheelT = 0, lastDelta = 0, peak = 0, decays = 0;
  var gestureDir = 0, mouseLike = false;
  var endTimer = 0, extTimer = 0, lastExtY = 0;

  function metrics() {
    var h = blockHeight();
    stackTop = flow.getBoundingClientRect().top + window.pageYOffset - HEADER;
    stops = 1;
    blocks.forEach(function (b, i) { if (i) stops += b.count; });
    if (about) stops += 1;
    return h;
  }

  function inStack(rel) { return rel >= -0.02 && rel <= stops - 1 + 0.02; }

  function maxScroll() {
    return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  }

  // шторка кейса и мобильное меню запирают страницу — тогда не вмешиваемся
  function locked() {
    return document.documentElement.style.overflow === 'hidden' ||
      document.body.style.overflow === 'hidden' ||
      document.body.classList.contains('panel-open');
  }

  function engineOn() {
    return !isMobile() && !(reduceMotion && reduceMotion.matches) && !locked();
  }

  function write(y) {
    written = y;
    window.scrollTo({ top: y, behavior: 'instant' });
    update();   // в том же кадре, иначе карточки отстанут от липкого блока на кадр
  }

  function run() {
    if (!raf) raf = requestAnimationFrame(frame);
  }

  function stop() {
    mode = 'idle';
    vel = 0;
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    lastT = 0;
  }

  function frame(t) {
    raf = 0;
    var dt = lastT ? Math.min(0.05, (t - lastT) / 1000) : 1 / 60;
    lastT = t;
    if (!dt) { run(); return; }
    var prev = pos;

    if (mode === 'follow') {
      pos += (target - pos) * (1 - Math.exp(-dt / TAU));
      if (Math.abs(target - pos) < 0.25) pos = target;
      vel = (pos - prev) / dt;
    } else if (mode === 'spring') {
      // точное решение x'' = -ω²x - 2ωx' на шаге dt: не зависит от частоты кадров
      var w = OMEGA, x0 = pos - springTo, v0 = vel, e = Math.exp(-w * dt);
      var c = v0 + w * x0;
      var x = (x0 + c * dt) * e;
      vel = (v0 - w * c * dt) * e;
      pos = springTo + x;
      if (Math.abs(x) < 0.35 && Math.abs(vel) < 10) { pos = springTo; vel = 0; }
      target = pos;
    }

    write(pos);

    if ((mode === 'follow' && pos === target) || (mode === 'spring' && pos === springTo && vel === 0)) {
      mode = 'idle';
      vel = 0;
      lastT = 0;
      return;
    }
    run();
  }

  function springToStop(index, h) {
    springTo = Math.min(maxScroll(), stackTop + index * h + BIAS);
    mode = 'spring';
    target = springTo;
    run();
  }

  /* extra — сколько ещё страница проехала бы сама по инерции */
  function snap(extra) {
    if (!engineOn()) return;
    var h = metrics();
    var rel = (pos - stackTop) / h;
    if (!inStack(rel)) return;
    var proj = (target + extra - stackTop) / h;
    var dir = proj > rel + 1e-4 ? 1 : (proj < rel - 1e-4 ? -1 : gestureDir);
    if (!dir) dir = 1;
    var base = dir > 0 ? Math.floor(rel + 1e-3) : Math.ceil(rel - 1e-3);
    // вниз от последней остановки уходим свободно: там «Обо мне» и подвал
    if (dir > 0 && base >= stops - 1) return;
    var adv = mouseLike ? ADV_WHEEL : ADV_PAD;
    var idx = Math.abs(proj - base) > adv ? base + dir : base;
    idx = Math.max(0, Math.min(stops - 1, idx));
    springToStop(idx, h);
  }

  // у элемента своя прокрутка и ему есть куда ехать — колесо его
  function scrollsInside(el, dy) {
    for (var n = el; n && n.nodeType === 1 && n !== document.body && n !== document.documentElement; n = n.parentElement) {
      var oy = getComputedStyle(n).overflowY;
      if ((oy === 'auto' || oy === 'scroll') && n.scrollHeight > n.clientHeight + 1) {
        if (dy > 0 ? n.scrollTop + n.clientHeight < n.scrollHeight - 1 : n.scrollTop > 0) return true;
      }
    }
    return false;
  }

  function onWheel(e) {
    if (e.ctrlKey || e.defaultPrevented || !engineOn()) return;
    var dy = e.deltaY * (e.deltaMode === 1 ? 16 : (e.deltaMode === 2 ? window.innerHeight : 1));
    if (!dy || Math.abs(e.deltaX) > Math.abs(dy)) return;
    if (scrollsInside(e.target, dy)) return;
    e.preventDefault();

    var now = performance.now();
    var gap = now - lastWheelT;
    var dir = dy > 0 ? 1 : -1;
    var ad = Math.abs(dy);
    var prevAd = Math.abs(lastDelta);

    if (gap > END_MS || dir !== gestureDir) {
      // новый жест; тачпад начинает с мелких шагов, мышь — сразу щелчком
      mouseLike = e.deltaMode !== 0 || ad >= 40;
      peak = 0;
      decays = 0;
    }
    // хвост инерции тачпада: без паузы, в ту же сторону, каждое событие не сильнее прошлого
    var tail = !mouseLike && gap < 60 && dir === gestureDir && ad <= prevAd + 0.5;
    if (ad > peak) peak = ad;
    decays = tail && ad < prevAd ? decays + 1 : (tail ? decays : 0);

    lastWheelT = now;
    lastDelta = dy;
    gestureDir = dir;

    if (mode === 'spring' && tail) return;   // доводка уже решила, хвост её не дёргает

    if (mode !== 'follow') {
      // перехватываем руку с того места и той скорости, что есть сейчас
      target = pos;
      mode = 'follow';
    }
    target = Math.max(0, Math.min(maxScroll(), target + dy));
    run();

    if (endTimer) clearTimeout(endTimer);
    // бросок тачпадом: пик пройден и шаги стабильно гаснут — решаем сразу,
    // не дожидаясь, пока инерция дотечёт до конца
    if (!mouseLike && peak >= FLICK && decays >= 3 && ad < peak * 0.6) {
      var r = prevAd ? Math.max(0.8, Math.min(0.97, ad / prevAd)) : 0.9;
      var rest = Math.min(blockHeight() * 1.2, ad * r / (1 - r));
      snap(dir * rest);
      return;
    }
    endTimer = setTimeout(function () { endTimer = 0; if (mode === 'follow') snap(0); }, END_MS);
  }

  function editable(el) {
    return el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(el.tagName));
  }

  // стрелки, Page Up/Down и пробел внутри стопки листают по одному кейсу
  function onKey(e) {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || !engineOn()) return;
    if (editable(document.activeElement)) return;
    var dir = 0;
    if (e.key === 'ArrowDown' || e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey)) dir = 1;
    else if (e.key === 'ArrowUp' || e.key === 'PageUp' || (e.key === ' ' && e.shiftKey)) dir = -1;
    if (!dir) return;
    var h = metrics();
    var from = mode === 'spring' ? springTo : pos;
    var rel = (from - stackTop) / h;
    if (!inStack(rel)) return;
    var cur = Math.round(rel);
    if (dir > 0 && cur >= stops - 1) return;
    if (dir < 0 && cur <= 0) return;
    e.preventDefault();
    gestureDir = dir;
    if (mode === 'idle') vel = 0;
    springToStop(cur + dir, h);
  }

  function onScroll() {
    var y = window.pageYOffset;
    if (written >= 0 && Math.abs(y - written) < 1.5) return;   // это мы сами
    // ползунок, поиск по странице, фокус, мобильная прокрутка — едет не наш движок
    if (mode !== 'idle') stop();
    gestureDir = y > lastExtY ? 1 : (y < lastExtY ? -1 : gestureDir);
    lastExtY = y;
    pos = target = y;
    written = -1;
    update();
    if (extTimer) clearTimeout(extTimer);
    extTimer = setTimeout(function () {
      extTimer = 0;
      if (mode !== 'idle' || !engineOn()) return;
      pos = target = window.pageYOffset;
      mouseLike = false;
      snap(0);
    }, EXT_MS);
  }

  function resync() {
    stop();
    pos = target = window.pageYOffset;
    written = -1;
    layout();
    update();
  }

  window.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('keydown', onKey);
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', resync);
  window.addEventListener('load', resync);
})();
