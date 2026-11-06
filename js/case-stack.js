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
    lastP = -1;      // окно точек могло сместиться — перерисовать их в любом случае

    if (mobile) {
      blocks.forEach(function (b) {
        if (b.content) b.content.style.opacity = mobile ? '' : '1';
      });
    }
  }

  // обложка — сама ссылка, а у карточки проекта ссылка внутри, на стрелке
  function toggle(el, on) {
    var link = el.matches('a') ? el : el.querySelector('a');
    el.classList.toggle('is-active', on);
    if (on) {
      if (link) link.removeAttribute('tabindex');
      el.removeAttribute('aria-hidden');
    } else {
      if (link) link.setAttribute('tabindex', '-1');
      el.setAttribute('aria-hidden', 'true');
    }
  }

  function setActive(b, i) {
    if (b.active === i) return;
    b.active = i;
    b.doors.forEach(function (d, k) { toggle(d, k === i); });
    b.projects.forEach(function (p, k) { toggle(p, k === i); });
  }

  /* ---------- Точки ----------
     p — дробный номер остановки, тот же, по которому едут блоки и карточки:
     2.4 значит «прошли сорок процентов пути от третьей остановки к четвёртой».
     Поэтому точки не ждут конца анимации, а идут с ней кадр в кадр.
     Видно пять точек (как в макете), лента со всеми точками едет внутри
     окна так, чтобы активная стояла в средней клетке, пока есть куда ехать.
     У края, за которым ещё есть точки, они мельчают: крайняя 4, следующая 6. */
  var DOT = 8, DOT_STEP = 16, DOT_SLOTS = 5;
  var lastP = -1;

  // насколько мельчает точка в j клетках от края окна (j < 0 — уже за краем)
  function shrink(j) {
    if (j <= -1) return DOT;
    if (j <= 0) return 4 - j * 4;   // за краем: 4 → 0
    if (j <= 1) return 4 - j * 2;   // крайняя клетка: 4, дальше 6
    if (j <= 2) return 2 - (j - 1) * 2;
    return 0;
  }

  function paintDots(p) {
    var n = dots.length;
    if (!n || !isFinite(p)) return;
    p = p < 0 ? 0 : (p > n - 1 ? n - 1 : p);
    var near = Math.round(p);
    if (Math.abs(p - near) < 0.002) p = near;   // на остановке — ровно
    if (p === lastP) return;
    lastP = p;
    var maxS = Math.max(0, n - DOT_SLOTS);
    var s = p - 2;                       // активная — в средней клетке
    s = s < 0 ? 0 : (s > maxS ? maxS : s);
    var topHidden = Math.min(1, s);              // есть ли точки выше окна
    var botHidden = Math.min(1, maxS - s);       // и ниже
    // Кружок круглый, только если его край стоит на границе физического
    // пикселя: при масштабе 1,8 точка 8px — это 14,4 пикселя, и дробный
    // край сплющивал её. Поэтому размер и место считаем в физических
    // пикселях и округляем, а в css переводим обратно.
    var dpr = window.devicePixelRatio || 1;
    var box = dotsBox.getBoundingClientRect();
    dots.forEach(function (d, k) {
      var j = k - s;                     // клетка окна, 0…4
      var cut = Math.max(topHidden * shrink(j), botHidden * shrink(DOT_SLOTS - 1 - j));
      var size = Math.max(0, DOT - cut);
      var on = Math.max(0, 1 - Math.abs(k - p));   // 1 — активная, 0 — нет
      var px = Math.round(size * dpr);                       // диаметр, целые пиксели
      var cx = (box.left + box.width / 2) * dpr;             // центр клетки на экране
      var cy = (box.top + DOT / 2 + j * DOT_STEP) * dpr;
      var x = Math.round(cx - px / 2), y = Math.round(cy - px / 2);
      d.style.width = d.style.height = (px / dpr) + 'px';
      d.style.left = (x / dpr - box.left) + 'px';
      d.style.top = (y / dpr - box.top) + 'px';
      d.style.visibility = px ? '' : 'hidden';
      d.style.backgroundColor = 'rgba(4,7,37,' + (0.1 + 0.9 * on).toFixed(3) + ')';
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
    });

    // остановки идут ровно через экран, начиная с первого экрана у шапки —
    // по ним же доводит прокрутку snap(), значит и точки считаем от них.
    // Начало стопки берём со страницы, а не из layout(): тот срабатывает
    // только на load, и пока страница догружается, точки получали NaN
    // и стояли на месте, хотя блоки уже ехали
    var flowY = flow.getBoundingClientRect().top + y;
    paintDots((y - (flowY - HEADER)) / h);

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

  var lastWheelT = 0, peak = 0, sincePeak = 0, ema = 0, emaPrev = 0;
  var swallow = false;           // гасим хвост инерции жеста, по которому уже доводим
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
  /* Возвращает true, если доводка началась. Сверху вниз и снизу вверх
     решение одно и то же, зеркально:
     - отсчёт ведём от остановки, с которой жест начался. Страница стоит
       на остановке с запасом в пиксель (BIAS), и раньше при движении вверх
       эта доля процента превращалась в «следующую» остановку: жест вверх
       из «Обо мне» доводился обратно вниз и съедался;
     - снизу, из «Обо мне» и подвала, в стопку въезжаем по прикидке инерции:
       если бросок туда докатится, доводка начинается от последней
       остановки, а не ждёт, пока страница сама в неё заедет. */
  function snap(extra) {
    if (!engineOn()) return false;
    var h = metrics();
    var last = stops - 1;
    var rel = (pos - stackTop) / h;
    var proj = (target + extra - stackTop) / h;
    if (!inStack(rel)) {
      // ниже стопки, но бросок вверх в неё докатится — начинаем от «Обо мне»
      if (rel > last && proj < last - 0.02) rel = last;
      else return false;
    }
    var dir = proj > rel + 1e-4 ? 1 : (proj < rel - 1e-4 ? -1 : gestureDir);
    if (!dir) dir = 1;
    var near = Math.round(rel);
    var base = Math.abs(rel - near) < 0.03 ? near : (dir > 0 ? Math.floor(rel) : Math.ceil(rel));
    // вниз от последней остановки уходим свободно: там «Обо мне» и подвал
    if (dir > 0 && base >= last) return false;
    var adv = mouseLike ? ADV_WHEEL : ADV_PAD;
    var idx = Math.abs(proj - base) > adv ? base + dir : base;
    idx = Math.max(0, Math.min(last, idx));
    swallow = !mouseLike;
    springToStop(idx, h);
    return true;
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

  /* Инерция тачпада неровная: шаги гаснут, но с дрожью — 12, 13, 11, 12, 10.
     Раньше любой шаг крупнее предыдущего считался новым жестом и обрывал
     доводку, страница резко тормозила и потом ползла к остановке. Теперь
     сравниваем со сглаженной силой жеста (ema) и обрываем доводку только
     на явном новом намерении: пауза, смена направления или резкий рост.
     Хвост инерции после доводки тоже гасим, пока жест не закончился:
     пружина садится за полсекунды, а инерция Mac идёт до полутора, и без
     этого хвост сдвигал уже вставшую страницу. */
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
    lastWheelT = now;

    var fresh = gap > END_MS || dir !== gestureDir;
    // новое намерение посреди жеста: шаг резко сильнее того, что было
    var surge = !fresh && ad > Math.max(ema * 1.8, ema + 10);

    if (fresh) {
      // тачпад начинает с мелких шагов, мышь — сразу щелчком
      mouseLike = e.deltaMode !== 0 || ad >= 40;
      peak = ad;
      sincePeak = 0;
      emaPrev = ema = ad;
    } else {
      emaPrev = ema;
      ema = ema * 0.6 + ad * 0.4;
      if (ad >= peak) { peak = ad; sincePeak = 0; } else sincePeak++;
    }
    gestureDir = dir;

    if (fresh || surge || mouseLike) swallow = false;
    // доводка уже решила, куда ехать: хвост этого же жеста её не трогает
    if (swallow) return;

    if (mode !== 'follow') {
      // перехватываем руку с того места и той скорости, что есть сейчас
      target = pos;
      mode = 'follow';
    }
    target = Math.max(0, Math.min(maxScroll(), target + dy));
    run();

    if (endTimer) clearTimeout(endTimer);
    // бросок тачпадом: пик пройден и сила жеста стабильно гаснет —
    // решаем сразу, не дожидаясь, пока инерция дотечёт до конца
    if (!mouseLike && peak >= FLICK && sincePeak >= 4 && ema < peak * 0.6) {
      var r = emaPrev ? Math.max(0.8, Math.min(0.97, ema / emaPrev)) : 0.9;
      var rest = Math.min(blockHeight() * 1.2, ema * r / (1 - r));
      // в свободной зоне под стопкой доводки нет — тогда ждём конца жеста
      if (snap(dir * rest)) return;
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
    swallow = false;
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
