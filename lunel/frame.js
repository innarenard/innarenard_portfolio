/* ==========================================================================
   Фрейм Lunel на главной
   --------------------------------------------------------------------------
   Собирает на месте картинки images/lunel-placeholder_{lang}.png те же экраны,
   но живыми компонентами бандла lunel/interactive.

   Координаты кусков — замер по самому коллажу (1899 × 1426, пипеткой по краям
   карточек и рамки телефона), поэтому холст внутри фрейма живёт в координатах
   картинки, а наружу масштабируется целиком:

      карточка инсайта   137, 0     740 × 965
      настроение, 1-я    1030, 124  726 × 198
      настроение, 2-я    1076, 260  636 × 180   низ карточки по 440, верх срезан
      кольцо             центр 487 × 1369, масштаб 1,848
      телефон            1026, 580  748 × 1579  низ уходит за край фрейма

   Тексты и состояния — те, что в приложении сейчас: коллаж снят до переделки
   1–6 октября 2026, и трёх его строк («55 отметок», «Симптомы и самочувствие
   добавлены в статистику», «Сводка») в продукте больше нет.
   ========================================================================== */

(function () {
  'use strict';

  var host = document.querySelector('[data-lunel-frame]');
  var L = window.Lunel;
  if (!host || !L) return;

  var CANVAS_W = 1899;

  /* Один цикл на оба кольца: data-anchor — дата первого дня цикла, значит при
     2 марта день 6 это 7 марта (фолликулярная, телефон), а день 18 — 19 марта
     (лютеиновая, кольцо слева). Ровно те даты, что стоят на коллаже. */
  var RING_ATTRS =
    'data-cycle-length="28" data-period-length="5" data-current-day="18" ' +
    'data-anchor="2026-03-02" data-notes="2,9,17,24"';
  var HOME_ATTRS =
    'data-cycle-length="28" data-period-length="5" data-current-day="6" ' +
    'data-anchor="2026-03-02" data-notes="2,9,17,24" ' +
    'data-fill="full" data-toast="stats" data-toast-dwell="0" data-learn ' +
    'data-insights="ready:mood,symptoms,phase,intimacy,changes"';

  /* Статус-бар телефона — та же разметка, что на стенде компонентов. */
  var STATUSBAR =
    '<div class="lunel-screen__statusbar" aria-hidden="true">' +
    '<span class="lunel-statusbar__time">09:41</span>' +
    '<span class="lunel-island"></span>' +
    '<span class="lunel-statusbar__icons">' +
    '<svg width="18" height="12" viewBox="0 0 18 12"><rect x="0" y="8.5" width="3" height="3.5" rx="1"/>' +
    '<rect x="5" y="6" width="3" height="6" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/>' +
    '<rect x="15" y="0" width="3" height="12" rx="1"/></svg>' +
    '<svg width="17" height="12" viewBox="0 0 17 12">' +
    '<path d="M8.5 2.1c2.6 0 5 1 6.8 2.6l1.4-1.5A12 12 0 0 0 8.5 0 12 12 0 0 0 .3 3.2l1.4 1.5A10 10 0 0 1 8.5 2.1z"/>' +
    '<path d="M8.5 6.1c1.5 0 2.9.6 4 1.5l1.4-1.5a8 8 0 0 0-10.8 0l1.4 1.5a6 6 0 0 1 4-1.5z"/>' +
    '<circle cx="8.5" cy="10.1" r="1.9"/></svg>' +
    '<svg width="27" height="13" viewBox="0 0 27 13">' +
    '<rect x="0.6" y="0.6" width="23" height="11.8" rx="3.6" fill="none" stroke="currentColor" stroke-width="1.1" opacity=".35"/>' +
    '<rect x="2.2" y="2.2" width="14" height="8.6" rx="2.2"/>' +
    '<path d="M25.1 4.4c.9.4 1.4 1.2 1.4 2.1s-.5 1.7-1.4 2.1z" opacity=".35"/></svg>' +
    '</span></div>';

  /* Скелет кольца — тот же, что строит home.js (ringHost): это контракт,
     который читает cycle-ring.js. Шапку «Today» прячет frame.css. */
  var RING_ROOT =
    '<div class="lunel lunel-frame__col" lang="en" data-lunel-component="cycle-ring" ' + RING_ATTRS + '>' +
    '<div class="lunel-home">' +
    '<header class="lunel-home__header">' +
    '<h2 class="lunel-h2 lunel-home__title" data-title>Today</h2>' +
    '<button type="button" class="lunel-ghost-btn lunel-home__today" data-today data-i18n="Today" hidden>Today</button>' +
    '</header>' +
    '<div class="lunel-home__stage">' +
    '<div class="lunel-ring" data-ring>' +
    '<div class="lunel-ring__orbs" data-orbs aria-hidden="true"></div>' +
    '<canvas class="lunel-ring__bridge" data-bridge aria-hidden="true" width="345" height="345"></canvas>' +
    '<div class="lunel-ring__circles" data-circles aria-hidden="true"></div>' +
    '<div class="lunel-ring__numbers" data-numbers aria-hidden="true"></div>' +
    '<div class="lunel-ring__center" data-center>' +
    '<p class="lunel-h1 lunel-ring__date">' +
    '<span class="lunel-ring__month" data-month></span>' +
    '<span class="lunel-ring__daynum" data-daynum></span>' +
    '</p>' +
    '<p class="lunel-caption1 lunel-ring__phase" id="lunel-frame-ring-phase" data-phase></p>' +
    '<p class="lunel-caption2 lunel-ring__tag lunel-tnum" data-tag></p>' +
    '</div>' +
    '<div class="lunel-ring__noise" aria-hidden="true"></div>' +
    '<div class="lunel-ring__input" data-input role="slider" tabindex="0"' +
    ' aria-labelledby="lunel-frame-ring-phase"></div>' +
    '</div></div></div></div>';

  var TRENDS_ROOT =
    '<div class="lunel lunel-frame__screenbox" lang="en" data-lunel-component="trends">' +
    '<div class="lunel-trends">' +
    '<div class="lunel-trends__header">' +
    '<h2 class="lunel-h1 lunel-trends__title" data-i18n="Trends">Trends</h2>' +
    '<p class="lunel-trends__window" data-window></p>' +
    '</div>' +
    '<div class="lunel-trends__pages" data-pages></div>' +
    '<div class="lunel-trends__dots" data-dots aria-hidden="true"></div>' +
    '</div></div>';

  var INSIGHT_ROOT =
    '<div class="lunel lunel-frame__col" lang="en">' +
    '<div data-lunel-component="insight-screen"></div>' +
    '</div>';

  var PHONE_ROOT =
    '<div class="lunel lunel-device" lang="en" data-lunel-component="home" ' + HOME_ATTRS + '>' +
    '<div class="lunel-screen">' +
    STATUSBAR +
    '<div class="lunel-screen__content"></div>' +
    '<div class="lunel-screen__home-indicator" aria-hidden="true"></div>' +
    '</div></div>';

  /* ------------------------------------------------------------- каркас */

  function pageLang() {
    return document.documentElement.lang === 'ru' ? 'ru' : 'en';
  }

  var canvas = document.createElement('div');
  canvas.className = 'lunel-frame__canvas';
  host.appendChild(canvas);

  function piece(modifiers, box, rootHTML, scale) {
    var el = document.createElement('div');
    el.className = 'lunel-frame__piece ' + modifiers.map(function (m) {
      return 'lunel-frame__piece--' + m;
    }).join(' ');
    el.style.left = box.l + 'px';
    el.style.top = box.t + 'px';
    if (box.w) el.style.width = box.w + 'px';
    if (box.h) el.style.height = box.h + 'px';

    var wrap = document.createElement('div');
    wrap.className = 'lunel-frame__mount';
    wrap.style.transform = 'scale(' + scale + ')';
    wrap.innerHTML = rootHTML;
    /* Язык ставим до монтирования: тост и даты рисуются один раз при старте,
       и на русской странице они иначе родились бы английскими. */
    wrap.firstElementChild.setAttribute('lang', pageLang());

    el.appendChild(wrap);
    canvas.appendChild(el);
    return { el: el, wrap: wrap, root: wrap.firstElementChild, box: box, scale: scale };
  }

  var insight = piece(['insight'], { l: 137, t: 0, w: 740, h: 965 }, INSIGHT_ROOT, 740 / 393);
  var moodA = piece(['mood'], { l: 1030, t: 124, w: 726, h: 198 }, TRENDS_ROOT, 726 / 345);
  var moodB = piece(['mood', 'masked'], { l: 1076, t: 260, w: 636, h: 180 }, TRENDS_ROOT, 636 / 345);
  var ring = piece(['ring'], { l: 0, t: 0 }, RING_ROOT, 1.848);
  var phone = piece(['phone'], { l: 1026, t: 580, w: 748, h: 1579 }, PHONE_ROOT, 748 / 407);

  L.mount(canvas);

  /* --------------------------------------------------------- расстановка */

  function currentK() {
    return parseFloat(getComputedStyle(host).getPropertyValue('--lunel-frame-k')) || 1;
  }

  /* Кусок стоит по замеру картинки, а не по тому, где компонент решил
     нарисовать карточку: после монтирования двигаем содержимое так, чтобы
     нужный элемент лёг ровно в коробку. */
  function offsetTo(part, target, align) {
    var k = currentK();
    var box = part.el.getBoundingClientRect();
    var rect = target.getBoundingClientRect();
    var dx = (box.left - rect.left) / k;
    var dy = align === 'bottom'
      ? (box.bottom - rect.bottom) / k
      : (box.top - rect.top) / k;
    part.wrap.style.left = (parseFloat(part.wrap.style.left) || 0) + dx + 'px';
    part.wrap.style.top = (parseFloat(part.wrap.style.top) || 0) + dy + 'px';
  }

  /* Колода трендов — вертикальный скроллер со снапом, и её собственный goTo
     едет плавно: замер в тот же кадр попадает на середину анимации. Поэтому
     страницу «Настроение и энергия по фазам» ставим скроллом напрямую, а
     скроллер в css закрыт overflow: hidden, чтобы колёсико мыши не уводило
     карточку из коробки. */
  function moodCard(part, index) {
    var pagesEl = part.root.querySelector('[data-pages]');
    var page = part.root.querySelectorAll('.lunel-trends__page')[1];
    if (!pagesEl || !page) return null;
    part.root.querySelectorAll('.lunel-trends__page').forEach(function (p) {
      p.setAttribute('data-drawn', '');
    });
    pagesEl.style.scrollBehavior = 'auto';
    pagesEl.scrollTop = page.offsetTop;
    return page.querySelectorAll('.lunel-tcard')[index] || null;
  }

  function placeRing() {
    var ringEl = ring.root.querySelector('[data-ring]');
    if (!ringEl) return;
    var k = currentK();
    var hostBox = host.getBoundingClientRect();
    var rect = ringEl.getBoundingClientRect();
    var cx = (rect.left + rect.width / 2 - hostBox.left) / k;
    var cy = (rect.top + rect.height / 2 - hostBox.top) / k;
    ring.el.style.left = (parseFloat(ring.el.style.left) || 0) + (487 - cx) + 'px';
    ring.el.style.top = (parseFloat(ring.el.style.top) || 0) + (1369 - cy) + 'px';
  }

  /* Вторая карточка на коллаже срезана сверху по прямой, но её бублик торчит
     над срезом — поэтому не overflow, а маска «прямоугольник плюс круг».
     Числа снимаем с живого компонента, а не ставим на глаз. */
  function maskMoodB(card) {
    var style = moodB.el.style;
    if (!card) return;
    var k = currentK();
    var box = moodB.el.getBoundingClientRect();
    /* Срез на коллаже проходит по 344: заголовок карточки уходит под него,
       обе строки легенды видны целиком. Ниже строки с названием фазы срез
       не опускаем — иначе, если карточка в приложении станет выше, он
       съест первую строку легенды. */
    var top = card.querySelector('.lunel-tcard__top');
    var cut = 344 - moodB.box.t;
    if (top) cut = Math.max(cut, (top.getBoundingClientRect().bottom - box.top) / k);
    style.setProperty('--cut', cut + 'px');
    var donut = card.querySelector('svg');
    if (!donut) return;
    var d = donut.getBoundingClientRect();
    style.setProperty('--dot-x', (d.left + d.width / 2 - box.left) / k + 'px');
    style.setProperty('--dot-y', (d.top + d.height / 2 - box.top) / k + 'px');
    style.setProperty('--dot-r', (d.width / 2 + 2) / k + 'px');
  }

  function layout() {
    var a = moodCard(moodA, 0);
    if (a) offsetTo(moodA, a, 'top');
    var b = moodCard(moodB, 1);
    if (b) offsetTo(moodB, b, 'bottom');
    maskMoodB(b);
    placeRing();
  }

  /* ------------------------------------------------------- масштаб холста */

  function fit() {
    var w = host.clientWidth;
    if (w) host.style.setProperty('--lunel-frame-k', w / CANVAS_W);
  }

  fit();
  if (typeof ResizeObserver === 'function') new ResizeObserver(fit).observe(host);
  else window.addEventListener('resize', fit);

  /* --------------------------------------------------------------- языки */

  /* Язык фрейм берёт у страницы: js/i18n.js меняет lang у <html>, и общий
     словарь сайта сюда не лезет. Событие lunel:lang не всплывает, а home
     держит в себе ещё три компонента — поэтому зовём setLang на каждом
     смонтированном корне, как это делает стенд компонентов. */
  function syncLang() {
    var lang = pageLang();
    canvas.querySelectorAll('.lunel, [data-lunel-component]').forEach(function (root) {
      /* Без проверки «а вдруг уже этот язык»: у вложенного компонента lang
         наследуется от корня, проверка всегда говорит «уже ru», и событие
         перерисовки не уходит. */
      L.i18n.setLang(root, lang);
    });
  }

  if (typeof MutationObserver === 'function') {
    new MutationObserver(syncLang).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['lang']
    });
  }

  /* --------------------------------------------------------------- финиш */

  function ready() {
    layout();
    syncLang();
    /* Декорация: мышью всё живое, с клавиатуры блок пропускается — на его
       месте стояла картинка, и шесть лишних остановок табом на главной
       ничего не дают. */
    canvas.querySelectorAll('[tabindex], button, a, input, textarea').forEach(function (el) {
      el.setAttribute('tabindex', '-1');
    });
    host.setAttribute('data-lunel-frame-ready', '');
  }

  /* Тот же случай, что со шторкой в checklist.js: в скрытой вкладке кадр
     анимации не приходит, и фрейм так и остался бы картинкой. Поэтому
     расстановка висит и на таймере, а не только на requestAnimationFrame. */
  var done = false;
  function readyOnce() {
    if (done) return;
    done = true;
    ready();
  }

  requestAnimationFrame(function () {
    requestAnimationFrame(readyOnce);
  });
  setTimeout(readyOnce, 300);

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { requestAnimationFrame(layout); });
  }

  window.addEventListener('resize', function () {
    requestAnimationFrame(layout);
  });
})();
