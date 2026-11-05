/* ==========================================================================
   Lunel interactive replicas — shared runtime
   --------------------------------------------------------------------------
   One global, `window.Lunel`. No modules, no build step, no dependencies.
   Load this before any component file:

     <link rel="stylesheet" href="lunel-tokens.css">
     <link rel="stylesheet" href="lunel-core.css">
     <link rel="stylesheet" href="cycle-ring.css">
     <script src="lunel-core.js" defer></script>
     <script src="cycle-ring.js" defer></script>

   What lives here and why the next two components should use it rather than
   rebuild it:

     Lunel.define(name, factory)   component registry + auto-mount
     Lunel.mount(scope)            mount anything added later
     Lunel.i18n                    EN-in-markup / RU-from-dictionary swap,
                                   app strings, Russian plural rules
     Lunel.motion                  prefers-reduced-motion, spring → linear()
     Lunel.ticker                  ONE shared rAF loop for every component,
                                   auto-paused off-screen and on hidden tabs
     Lunel.inView                  "first time it scrolls into view" hook
     Lunel.fitFrame                scales the 393px phone down on narrow pages
     Lunel.phase                   cycle-phase model + colours
     Lunel.color                   hex / HSB helpers (orb tinting)
     Lunel.dates                   localized month + forecast range formatting
   ========================================================================== */

(function (global) {
  'use strict';

  if (global.Lunel) return;

  /* ---------------------------------------------------------------- motion */

  var reduceQuery =
    global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)');
  var reduceListeners = [];
  var reduceOverride = null;

  function reduced() {
    if (reduceOverride !== null) return reduceOverride;
    return !!(reduceQuery && reduceQuery.matches);
  }

  /* Workbench switch: force the reduced-motion presentation on or off
     regardless of the system setting (null hands control back). It flips the
     same tokens the media query flips, via [data-reduce-motion]. */
  function overrideReduced(value) {
    reduceOverride = value === null || value === undefined ? null : !!value;
    var roots = global.document.querySelectorAll('.lunel');
    for (var i = 0; i < roots.length; i++) {
      if (reduced()) roots[i].setAttribute('data-reduce-motion', '');
      else roots[i].removeAttribute('data-reduce-motion');
    }
    for (var j = 0; j < reduceListeners.length; j++) reduceListeners[j](reduced());
    return reduced();
  }

  if (reduceQuery) {
    var notifyReduce = function () {
      for (var i = 0; i < reduceListeners.length; i++) reduceListeners[i](reduced());
    };
    if (reduceQuery.addEventListener) reduceQuery.addEventListener('change', notifyReduce);
    else if (reduceQuery.addListener) reduceQuery.addListener(notifyReduce);
  }

  /* SwiftUI spring(response:dampingFraction:) sampled into a CSS linear()
     easing. The springs the app actually uses are already baked into
     lunel-tokens.css as --lunel-spring-*; this is here for the cases a
     component needs one that is not in the token list. */
  function springValue(t, response, zeta) {
    var w0 = (2 * Math.PI) / response;
    if (zeta < 1) {
      var wd = w0 * Math.sqrt(1 - zeta * zeta);
      return (
        1 -
        Math.exp(-zeta * w0 * t) *
          (Math.cos(wd * t) + ((zeta * w0) / wd) * Math.sin(wd * t))
      );
    }
    if (zeta === 1) return 1 - Math.exp(-w0 * t) * (1 + w0 * t);
    var a = w0 * Math.sqrt(zeta * zeta - 1);
    var c1 = (zeta * w0 + a) / (2 * a);
    return 1 - (c1 * Math.exp((-zeta * w0 + a) * t) + (1 - c1) * Math.exp((-zeta * w0 - a) * t));
  }

  function springEasing(response, zeta, steps) {
    steps = steps || 40;
    var dt = 1 / 600;
    var settle = 0;
    for (var i = 1; i < 6000; i++) {
      var tt = i * dt;
      if (Math.abs(springValue(tt, response, zeta) - 1) > 0.001) settle = tt;
    }
    var durMs = Math.ceil((settle + dt) * 1000);
    var stops = [];
    for (var s = 0; s <= steps; s++) {
      stops.push(+springValue((s / steps) * (durMs / 1000), response, zeta).toFixed(4));
    }
    stops[0] = 0;
    stops[stops.length - 1] = 1;
    return { duration: durMs, easing: 'linear(' + stops.join(', ') + ')' };
  }

  /* ---------------------------------------------------------------- ticker */

  /* One requestAnimationFrame loop for the whole page. A task is only called
     while its element is in the viewport and the tab is visible, so six
     mounted components cost one loop and only the visible ones do work. */
  var tasks = [];
  var rafId = null;
  var lastTime = 0;

  function loop(now) {
    rafId = global.requestAnimationFrame(loop);
    var dt = lastTime ? (now - lastTime) / 1000 : 0;
    lastTime = now;
    var running = 0;
    for (var i = 0; i < tasks.length; i++) {
      var task = tasks[i];
      if (!task.visible || task.paused) continue;
      running++;
      task.fn(now / 1000, dt);
    }
    if (!running) stopLoop();
  }

  function startLoop() {
    if (rafId === null && !global.document.hidden) {
      lastTime = 0;
      rafId = global.requestAnimationFrame(loop);
    }
  }

  function stopLoop() {
    if (rafId !== null) {
      global.cancelAnimationFrame(rafId);
      rafId = null;
      lastTime = 0;
    }
  }

  function wake() {
    for (var i = 0; i < tasks.length; i++) {
      if (tasks[i].visible && !tasks[i].paused) {
        startLoop();
        return;
      }
    }
  }

  global.document.addEventListener('visibilitychange', function () {
    if (global.document.hidden) stopLoop();
    else wake();
  });

  var visObserver =
    typeof IntersectionObserver === 'function'
      ? new IntersectionObserver(
          function (entries) {
            for (var i = 0; i < entries.length; i++) {
              var entry = entries[i];
              for (var j = 0; j < tasks.length; j++) {
                if (tasks[j].el === entry.target) tasks[j].visible = entry.isIntersecting;
              }
            }
            wake();
          },
          { rootMargin: '120px' }
        )
      : null;

  function addTask(fn, el) {
    var task = { fn: fn, el: el || null, visible: !visObserver || !el, paused: false };
    tasks.push(task);
    if (visObserver && el) visObserver.observe(el);
    wake();
    return {
      pause: function () { task.paused = true; },
      resume: function () { task.paused = false; wake(); },
      stop: function () {
        var idx = tasks.indexOf(task);
        if (idx >= 0) tasks.splice(idx, 1);
        if (visObserver && el) visObserver.unobserve(el);
      }
    };
  }

  /* Fire once, the first time `el` scrolls into view (immediately if it
     already is, or if IntersectionObserver is missing). */
  function inView(el, cb, options) {
    var opts = options || {};
    if (typeof IntersectionObserver !== 'function') {
      cb();
      return { cancel: function () {} };
    }
    var io = new IntersectionObserver(
      function (entries) {
        for (var i = 0; i < entries.length; i++) {
          if (entries[i].isIntersecting) {
            io.disconnect();
            cb();
            return;
          }
        }
      },
      { threshold: opts.threshold == null ? 0.35 : opts.threshold }
    );
    io.observe(el);
    return { cancel: function () { io.disconnect(); } };
  }

  /* ------------------------------------------------------------- the frame */

  /* Scales the 393 × 852 device down when its column is narrower, and keeps
     the stage's height honest so the page does not get a transform-sized gap. */
  function fitFrame(device) {
    var stage = device.parentElement;
    if (!stage) return function () {};

    var lastScale = null;
    var lastHeight = null;

    function apply() {
      var available = stage.clientWidth;
      var natural = device.offsetWidth;
      if (!natural) return;
      var scale = Math.min(1, available / natural);
      var height = Math.round(device.offsetHeight * scale);
      /* Writing only on a real change keeps the ResizeObserver from
         re-entering (and from logging "ResizeObserver loop completed"). */
      if (lastScale !== null && Math.abs(scale - lastScale) < 0.001 && height === lastHeight) {
        return;
      }
      lastScale = scale;
      lastHeight = height;
      device.style.setProperty('--lunel-frame-scale', String(scale));
      stage.style.height = height + 'px';
    }

    apply();
    var ro = typeof ResizeObserver === 'function' ? new ResizeObserver(apply) : null;
    if (ro) ro.observe(stage);
    else global.addEventListener('resize', apply);
    return function () {
      if (ro) ro.disconnect();
      else global.removeEventListener('resize', apply);
    };
  }

  /* ------------------------------------------------------------------ i18n */

  /* English lives in the markup; Russian comes from this dictionary, keyed by
     data-i18n. On the first apply() the element's own text is remembered as
     the English version — exactly the mechanism js/i18n.js uses on the
     portfolio site, so a component behaves the same in either host.

     Every string below is harvested from the app's own Localizable.strings /
     .stringsdict via lunel-spec.md. Nothing here is a fresh translation. */

  var STRINGS = {
    en: {
      Home: 'Home',
      Calendar: 'Calendar',
      Trends: 'Trends',
      Settings: 'Settings',
      Continue: 'Continue',
      Done: 'Done',
      Cancel: 'Cancel',
      Unlock: 'Unlock',
      'Changes saved': 'Changes saved',
      'No data': 'No data',
      Period: 'Period',
      Flow: 'Flow',
      Mood: 'Mood',
      'Daily log': 'Daily log',
      'Period start date': 'Period start date',
      'Period started': 'Period started',
      'Period ended': 'Period ended',
      'Period not started': 'Period not started',
      "I don't want to log": "I don't want to log",
      'Skipped today': 'Skipped today',
      Skipped: 'Skipped',
      "What's on my mind?": "What's on my mind?",
      'My thoughts': 'My thoughts',
      'My thoughts:': 'My thoughts:',
      Heavier: 'Heavier',
      Lighter: 'Lighter',
      'High energy': 'High energy',
      'Low energy': 'Low energy',
      'Negative mood': 'Negative mood',
      'Positive mood': 'Positive mood',
      Today: 'Today',
      Tomorrow: 'Tomorrow',
      Yesterday: 'Yesterday',
      Menstrual: 'Menstrual',
      Follicular: 'Follicular',
      Ovulation: 'Ovulation',
      Luteal: 'Luteal',
      'Menstrual phase': 'Menstrual phase',
      'Follicular phase': 'Follicular phase',
      'Ovulation phase': 'Ovulation phase',
      'Luteal phase': 'Luteal phase',
      Checklist: 'Checklist',
      Note: 'Note',
      'AI insights': 'AI insights',
      home_ring_day_phase: 'Day %d · %@',
      home_period_last_day: 'Last day',
      home_next_period_window: 'Next: %@'
    },
    ru: {
      Home: 'Главная',
      Calendar: 'Календарь',
      Trends: 'Тренды',
      Settings: 'Настройки',
      Continue: 'Продолжить',
      Done: 'Готово',
      Cancel: 'Отменить',
      Unlock: 'Открыть',
      'Changes saved': 'Изменения сохранены',
      'No data': 'Нет данных',
      Period: 'Месячные',
      Flow: 'Выделения',
      Mood: 'Настроение',
      'Daily log': 'Мой день',
      'Period start date': 'Дата начала месячных',
      'Period started': 'Месячные начались',
      'Period ended': 'Период закончился',
      'Period not started': 'Ещё не начались',
      "I don't want to log": 'Не хочу отмечать',
      'Skipped today': 'Сегодня пропускаю',
      Skipped: 'Пропущено',
      "What's on my mind?": 'О чём думаю?',
      'My thoughts': 'Мои мысли',
      'My thoughts:': 'Мои мысли:',
      Heavier: 'Сильнее',
      Lighter: 'Слабее',
      'High energy': 'Высокая энергия',
      'Low energy': 'Низкая энергия',
      'Negative mood': 'Негативное настроение',
      'Positive mood': 'Позитивное настроение',
      Today: 'Сегодня',
      Tomorrow: 'Завтра',
      Yesterday: 'Вчера',
      Menstrual: 'Менструальная',
      Follicular: 'Фолликулярная',
      Ovulation: 'Овуляция',
      Luteal: 'Лютеиновая',
      'Menstrual phase': 'Менструальная фаза',
      'Follicular phase': 'Фолликулярная фаза',
      'Ovulation phase': 'Фаза овуляции',
      'Luteal phase': 'Лютеиновая фаза',
      Checklist: 'Чек-лист',
      Note: 'Заметка',
      'AI insights': 'ИИ-инсайты',
      home_ring_day_phase: 'День %d · %@',
      home_period_last_day: 'Последний день',
      home_next_period_window: 'Следующие: %@'
    }
  };

  /* Plural forms, verbatim from Localizable.stringsdict. Russian has four
     categories and the verb agrees — never append a suffix by hand. */
  var PLURALS = {
    home_period_days_left: {
      en: { one: '%d day left', other: '%d days left' },
      ru: {
        one: 'Остался %d день',
        few: 'Осталось %d дня',
        many: 'Осталось %d дней',
        other: 'Осталось %d дня'
      }
    },
    home_title_in_days: {
      en: { one: 'In %d day', other: 'In %d days' },
      ru: { one: 'Через %d день', few: 'Через %d дня', many: 'Через %d дней', other: 'Через %d дня' }
    },
    home_title_days_ago: {
      en: { one: '%d day ago', other: '%d days ago' },
      ru: { one: '%d день назад', few: '%d дня назад', many: '%d дней назад', other: '%d дня назад' }
    },
    analytics_days_until_count: {
      en: { one: '%d day', other: '%d days' },
      ru: { one: '%d день', few: '%d дня', many: '%d дней', other: '%d дня' }
    },
    days_unit: {
      en: { one: 'day', other: 'days' },
      ru: { one: 'день', few: 'дня', many: 'дней', other: 'дня' }
    },
    trends_logs_count: {
      en: { one: '%d log', other: '%d logs' },
      ru: { one: '%d отметка', few: '%d отметки', many: '%d отметок', other: '%d отметки' }
    },
    cycles_count: {
      en: { one: '%d cycle', other: '%d cycles' },
      ru: { one: '%d цикл', few: '%d цикла', many: '%d циклов', other: '%d цикла' }
    },
    entries_count: {
      en: { one: '%d entry', other: '%d entries' },
      ru: { one: '%d запись', few: '%d записи', many: '%d записей', other: '%d записи' }
    }
  };

  var pluralRules = {};
  function pluralCategory(lang, n) {
    if (typeof Intl === 'undefined' || !Intl.PluralRules) return n === 1 ? 'one' : 'other';
    if (!pluralRules[lang]) pluralRules[lang] = new Intl.PluralRules(lang);
    return pluralRules[lang].select(n);
  }

  function format(template, args) {
    var list = args || [];
    var strIndex = 0;
    return String(template)
      .replace(/%(\d+)\$[d@s]/g, function (_, pos) {
        return String(list[parseInt(pos, 10) - 1]);
      })
      .replace(/%[d@s]/g, function () {
        return String(list[strIndex++]);
      })
      /* stringsdict escapes a literal percent as %% */
      .replace(/%%/g, '%');
  }

  var missingKeys = [];

  /* Components register their own harvested strings here instead of growing
     this file: Lunel.i18n.extend({ en: {...}, ru: {...} }, { plural_key: {...} }).
     Every value must come from the app's Localizable.strings — see README. */
  function extend(strings, plurals) {
    if (strings) {
      ['en', 'ru'].forEach(function (lang) {
        if (!strings[lang]) return;
        for (var key in strings[lang]) {
          if (Object.prototype.hasOwnProperty.call(strings[lang], key)) {
            STRINGS[lang][key] = strings[lang][key];
          }
        }
      });
    }
    if (plurals) {
      for (var p in plurals) {
        if (Object.prototype.hasOwnProperty.call(plurals, p)) PLURALS[p] = plurals[p];
      }
    }
  }

  function t(key, lang, args) {
    var language = lang === 'ru' ? 'ru' : 'en';
    if (PLURALS[key]) {
      var n = (args && args[0]) || 0;
      var forms = PLURALS[key][language];
      var template = forms[pluralCategory(language, n)] || forms.other;
      return format(template, args);
    }
    var table = STRINGS[language];
    if (table && Object.prototype.hasOwnProperty.call(table, key)) {
      return format(table[key], args);
    }
    if (missingKeys.indexOf(key) < 0) missingKeys.push(key);
    return format(key, args);
  }

  /* Swap every [data-i18n] inside `root`. English is whatever the markup said
     the first time this ran — that is the contract, so a component's English
     copy is readable in View Source and survives a JS failure. */
  function applyI18n(root, lang) {
    var nodes = root.querySelectorAll('[data-i18n]');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (el.hasAttribute('data-i18n-dynamic')) continue;
      if (el.dataset.lunelEn === undefined) el.dataset.lunelEn = el.textContent;
      var key = el.getAttribute('data-i18n');
      el.textContent = lang === 'ru' ? t(key, 'ru', []) : el.dataset.lunelEn;
    }
    var labelled = root.querySelectorAll('[data-i18n-label]');
    for (var j = 0; j < labelled.length; j++) {
      var node = labelled[j];
      if (node.dataset.lunelEnLabel === undefined) {
        node.dataset.lunelEnLabel = node.getAttribute('aria-label') || '';
      }
      var labelKey = node.getAttribute('data-i18n-label');
      node.setAttribute(
        'aria-label',
        lang === 'ru' ? t(labelKey, 'ru', []) : node.dataset.lunelEnLabel
      );
    }
  }

  /* The single entry point a host page calls to switch language. */
  function setLang(root, lang) {
    var language = lang === 'ru' ? 'ru' : 'en';
    root.setAttribute('lang', language);
    applyI18n(root, language);
    root.dispatchEvent(
      new CustomEvent('lunel:lang', { detail: { lang: language }, bubbles: false })
    );
    return language;
  }

  function langOf(el) {
    var node = el;
    while (node && node.getAttribute) {
      var value = node.getAttribute('lang');
      if (value) return value.toLowerCase().indexOf('ru') === 0 ? 'ru' : 'en';
      node = node.parentElement;
    }
    return 'en';
  }

  /* ----------------------------------------------------------------- color */

  function hexToRgb(hex) {
    var h = hex.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  /* HSB (= HSV), matching UIColor.getHue(saturation:brightness:) */
  function rgbToHsb(rgb) {
    var r = rgb.r / 255,
      g = rgb.g / 255,
      b = rgb.b / 255;
    var max = Math.max(r, g, b),
      min = Math.min(r, g, b);
    var d = max - min;
    var h = 0;
    if (d !== 0) {
      if (max === r) h = ((g - b) / d) % 6;
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h /= 6;
      if (h < 0) h += 1;
    }
    return { h: h, s: max === 0 ? 0 : d / max, b: max };
  }

  function hsbToCss(h, s, v) {
    var i = Math.floor(h * 6);
    var f = h * 6 - i;
    var p = v * (1 - s);
    var q = v * (1 - f * s);
    var tt = v * (1 - (1 - f) * s);
    var r, g, b;
    switch (i % 6) {
      case 0: r = v; g = tt; b = p; break;
      case 1: r = q; g = v; b = p; break;
      case 2: r = p; g = v; b = tt; break;
      case 3: r = p; g = q; b = v; break;
      case 4: r = tt; g = p; b = v; break;
      default: r = v; g = p; b = q;
    }
    return (
      'rgb(' +
      Math.round(r * 255) + ', ' + Math.round(g * 255) + ', ' + Math.round(b * 255) +
      ')'
    );
  }

  function rgba(hex, alpha) {
    var c = hexToRgb(hex);
    return 'rgba(' + c.r + ', ' + c.g + ', ' + c.b + ', ' + alpha + ')';
  }

  /* ----------------------------------------------------------------- phase */

  var PHASE = {
    menstrual: { key: 'menstrual', title: 'Menstrual', label: 'Menstrual phase', main: '#F06C86', dark: '#660004' },
    follicular: { key: 'follicular', title: 'Follicular', label: 'Follicular phase', main: '#4CD7C8', dark: '#00463F' },
    ovulation: { key: 'ovulation', title: 'Ovulation', label: 'Ovulation phase', main: '#F5BB41', dark: '#502905' },
    luteal: { key: 'luteal', title: 'Luteal', label: 'Luteal phase', main: '#CE7FEF', dark: '#2E0041' }
  };

  /* CycleRing.defaultDayData — luteal and ovulation are fixed length, the
     follicular phase absorbs the rest. 28 days → 1–5 / 6–11 / 12–14 / 15–28. */
  function phaseForDay(day, cycleLength, options) {
    var opts = options || {};
    var menstrualLength = opts.periodLength || 5;
    var lutealLength = 14;
    var ovulationLength = 3;
    var follicularLength = Math.max(
      1,
      cycleLength - menstrualLength - ovulationLength - lutealLength
    );
    var menstrualEnd = menstrualLength;
    var follicularEnd = menstrualEnd + follicularLength;
    var ovulationEnd = follicularEnd + ovulationLength;
    if (day <= menstrualEnd) return PHASE.menstrual;
    if (day <= follicularEnd) return PHASE.follicular;
    if (day <= ovulationEnd) return PHASE.ovulation;
    return PHASE.luteal;
  }

  /* ----------------------------------------------------------------- dates */

  function addDays(date, days) {
    var d = new Date(date.getTime());
    d.setDate(d.getDate() + days);
    return d;
  }

  function monthStandalone(date, lang) {
    var text;
    try {
      text = new Intl.DateTimeFormat(lang, { month: 'long' }).format(date);
    } catch (e) {
      text = String(date.getMonth() + 1);
    }
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  /* Mirrors Date.appShortRange: the system interval format, em dash replaced
     by an en dash, thin spaces normalised, tight inside one month and spaced
     across two. "Mar 29 – Apr 2" / «29 мар. – 2 апр.» / "Oct 6–9". */
  function shortRange(start, end, lang) {
    var fmt;
    try {
      fmt = new Intl.DateTimeFormat(lang, { month: 'short', day: 'numeric' });
    } catch (e) {
      return '';
    }
    if (start.getTime() === end.getTime()) return fmt.format(start);
    var text;
    if (fmt.formatRange) text = fmt.formatRange(start, end);
    else text = fmt.format(start) + '–' + fmt.format(end);
    var sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
    /* Date+Localization.swift does exactly this, but against iOS's
       DateIntervalFormatter, which pads the dash with THIN SPACEs. Browsers
       don't agree: Chrome's Intl.formatRange gives plain spaces, Safari gives
       thin ones. Matching only the thin space left "Nov 19 – 23" on Chrome
       where the app prints "Nov 19–23", so take any of them. */
    return text
      .replace(/—/g, '–')
      .replace(/[    ]*–[    ]*/g, sameMonth ? '–' : ' – ')
      .replace(/[  ]/g, ' ');
  }

  /* Any .lunel-device sitting in a .lunel-stage fits itself to the column,
     once. Components do not have to ask. */
  var fitted = [];
  function fitAllFrames(scope) {
    var root = scope || global.document;
    if (!root.querySelectorAll) return;
    var devices = root.querySelectorAll('.lunel-stage > .lunel-device');
    for (var i = 0; i < devices.length; i++) {
      if (fitted.indexOf(devices[i]) >= 0) continue;
      fitted.push(devices[i]);
      fitFrame(devices[i]);
    }
  }

  /* ------------------------------------------------------------- registry */

  var factories = {};

  function define(name, factory) {
    factories[name] = factory;
    mount(global.document);
  }



  /* ------------------------------------------------------- text motion */

  /* SwiftUI .contentTransition(.numericText): the text is kept as one span
     per character. Characters shared at the start and the end stay and slide
     to their new place; the ones that changed leave upward (blurred, fading)
     while the new ones rise from below — or the other way round when the
     value counts down (dir = -1). Frame by frame on the iPhone 17 simulator
     the swap takes ~0.3 s and the outgoing glyph is still visible, blurred,
     above the incoming one halfway through. */
  var NT_DUR = 320;
  var NT_EASE = 'cubic-bezier(.25,.1,.25,1)';

  function ntChars(text) { return Array.from(text); }

  function ntBuild(el, text) {
    el.textContent = '';
    ntChars(text).forEach(function (ch) {
      var s = global.document.createElement('span');
      s.className = 'lunel-nt';
      s.textContent = ch;
      el.appendChild(s);
    });
    el.__nt = text;
  }

  /* At rest the text is whole again, so the font keeps its kerning ("To" in
     Fraunces); it is split per character only while a change plays. */
  function ntSettle(el) {
    if (el.__ntTimer) clearTimeout(el.__ntTimer);
    el.__ntTimer = setTimeout(function () {
      el.__ntTimer = 0;
      if (!el.querySelector('.lunel-nt--out')) el.textContent = el.__nt;
    }, NT_DUR + 40);
  }

  function numericText(el, text, dir) {
    if (!el) return;
    text = String(text);
    if (el.__nt === undefined || el.__nt === null) { el.textContent = text; el.__nt = text; return; }
    if (el.__nt === text && !el.querySelector('.lunel-nt')) return;
    if (!el.querySelector('.lunel-nt')) ntBuild(el, el.__nt);
    /* finish anything in flight: drop leavers, settle the rest */
    Array.prototype.slice.call(el.querySelectorAll('.lunel-nt--out')).forEach(function (n) { n.remove(); });
    Array.prototype.slice.call(el.children).forEach(function (n) {
      if (n.getAnimations) n.getAnimations().forEach(function (a) { a.cancel(); });
    });
    if (el.__nt === text) { ntSettle(el); return; }
    if (reduced() || !el.animate) { el.textContent = text; el.__nt = text; return; }

    var oldChars = ntChars(el.__nt);
    var newChars = ntChars(text);
    var p = 0;
    while (p < oldChars.length && p < newChars.length && oldChars[p] === newChars[p]) p++;
    var sfx = 0;
    while (sfx < oldChars.length - p && sfx < newChars.length - p &&
      oldChars[oldChars.length - 1 - sfx] === newChars[newChars.length - 1 - sfx]) sfx++;

    var spans = Array.prototype.slice.call(el.querySelectorAll('.lunel-nt'));
    if (spans.length !== oldChars.length) { el.textContent = text; el.__nt = text; return; }
    if (global.getComputedStyle(el).position === 'static') el.style.position = 'relative';
    var box = el.getBoundingClientRect();
    /* every rect first: lifting one leaver out of the flow shifts the rest */
    var rects = spans.map(function (s) { return s.getBoundingClientRect(); });
    var before = rects.map(function (r) { return r.left; });

    var keepHead = spans.slice(0, p);
    var keepTail = spans.slice(spans.length - sfx);
    var leaving = spans.slice(p, spans.length - sfx);
    var tailAnchor = keepTail[0] || null;

    /* the leavers are lifted out of the flow where they stood */
    leaving.forEach(function (s, i) {
      var r = rects[p + i];
      s.className = 'lunel-nt lunel-nt--out';
      s.style.position = 'absolute';
      s.style.left = (r.left - box.left) + 'px';
      s.style.top = (r.top - box.top) + 'px';
      s.animate([
        { transform: 'translateY(0)', opacity: 1, filter: 'blur(0)' },
        { transform: 'translateY(' + (-dir * 0.55) + 'em)', opacity: 0, filter: 'blur(3px)' }
      ], { duration: NT_DUR, easing: NT_EASE, fill: 'forwards' }).onfinish = function () { s.remove(); };
    });

    var entering = newChars.slice(p, newChars.length - sfx).map(function (ch) {
      var s = global.document.createElement('span');
      s.className = 'lunel-nt';
      s.textContent = ch;
      el.insertBefore(s, tailAnchor);
      return s;
    });
    el.__nt = text;

    /* the stayers glide from where they were (FLIP) */
    keepHead.concat(keepTail).forEach(function (s) {
      var idx = spans.indexOf(s);
      var dx = before[idx] - s.getBoundingClientRect().left;
      if (Math.abs(dx) > 0.3) {
        s.animate([{ transform: 'translateX(' + dx + 'px)' }, { transform: 'translateX(0)' }],
          { duration: NT_DUR, easing: NT_EASE });
      }
    });
    entering.forEach(function (s) {
      s.animate([
        { transform: 'translateY(' + (dir * 0.55) + 'em)', opacity: 0, filter: 'blur(3px)' },
        { transform: 'translateY(0)', opacity: 1, filter: 'blur(0)' }
      ], { duration: NT_DUR, easing: NT_EASE });
    });
    ntSettle(el);
  }

  /* SwiftUI .transition(.blurReplace) on a whole word (the ring's month):
     the old word blurs out in place while the new one blurs in. */
  function blurReplace(el, text) {
    if (!el) return;
    text = String(text);
    if (el.__br === undefined) { el.textContent = text; el.__br = text; return; }
    if (el.__br === text) return;
    el.__br = text;
    if (reduced() || !el.animate) { el.textContent = text; return; }
    if (el.getAnimations) el.getAnimations().forEach(function (a) { a.cancel(); });
    el.animate([
      { opacity: 1, filter: 'blur(0)' },
      { opacity: 0, filter: 'blur(4px)' }
    ], { duration: 140, easing: 'ease-in' }).onfinish = function () {
      el.textContent = text;
      el.animate([
        { opacity: 0, filter: 'blur(4px)' },
        { opacity: 1, filter: 'blur(0)' }
      ], { duration: 180, easing: 'ease-out' });
    };
  }

  /* ------------------------------------------------------------- tab bar */

  /* Assets.xcassets/Icons/Tab{Home,Calendar,Trends,Settings}{On,Off}.svg as
     is, rendered in original colour like the app (MainTabView.imageName):
     Off is the Icons/Main outline, On the filled Brand glyph — different art,
     not one glyph tinted. Any <nav data-lunel-tabbar="calendar"> left empty
     by its host is filled on mount. */
  var TAB_ICONS = {"home": {"off": "<svg viewBox=\"0 0 24 24\" fill=\"none\" aria-hidden=\"true\" focusable=\"false\"><g opacity=\"0.8\"> <path d=\"M12 18V15\" stroke=\"#262422\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> <path d=\"M10.07 2.82L3.14 8.37C2.36 8.99 1.86 10.3 2.03 11.28L3.36 19.24C3.6 20.66 4.96 21.81 6.4 21.81H17.6C19.03 21.81 20.4 20.65 20.64 19.24L21.97 11.28C22.13 10.3 21.63 8.99 20.86 8.37L13.93 2.83C12.86 1.97 11.13 1.97 10.07 2.82Z\" stroke=\"#262422\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>  </g></svg>", "on": "<svg viewBox=\"0 0 28 28\" fill=\"none\" aria-hidden=\"true\" focusable=\"false\"><g> <path d=\"M24.3017 9.345L16.66 3.23167C15.1667 2.04167 12.8333 2.03 11.3517 3.22L3.71 9.345C2.61333 10.22 1.94833 11.97 2.18167 13.3467L3.65167 22.1433C3.99 24.115 5.82167 25.6667 7.81667 25.6667H20.1833C22.155 25.6667 24.0217 24.08 24.36 22.1317L25.83 13.335C26.04 11.97 25.375 10.22 24.3017 9.345ZM14.875 21C14.875 21.4783 14.4783 21.875 14 21.875C13.5217 21.875 13.125 21.4783 13.125 21V17.5C13.125 17.0217 13.5217 16.625 14 16.625C14.4783 16.625 14.875 17.0217 14.875 17.5V21Z\" fill=\"#E86C61\"/>  </g></svg>"}, "calendar": {"off": "<svg viewBox=\"0 0 24 24\" fill=\"none\" aria-hidden=\"true\" focusable=\"false\"><g opacity=\"0.8\"> <path d=\"M8 2V5\" stroke=\"#262422\" stroke-width=\"1.5\" stroke-miterlimit=\"10\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> <path d=\"M16 2V5\" stroke=\"#262422\" stroke-width=\"1.5\" stroke-miterlimit=\"10\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> <path d=\"M3.5 9.09H20.5\" stroke=\"#262422\" stroke-width=\"1.5\" stroke-miterlimit=\"10\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> <path d=\"M21 8.5V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V8.5C3 5.5 4.5 3.5 8 3.5H16C19.5 3.5 21 5.5 21 8.5Z\" stroke=\"#262422\" stroke-width=\"1.5\" stroke-miterlimit=\"10\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>  <path d=\"M15.6947 13.7H15.7037\" stroke=\"#262422\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> <path d=\"M15.6947 16.7H15.7037\" stroke=\"#262422\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> <path d=\"M11.9955 13.7H12.0045\" stroke=\"#262422\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> <path d=\"M11.9955 16.7H12.0045\" stroke=\"#262422\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> <path d=\"M8.29431 13.7H8.30329\" stroke=\"#262422\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> <path d=\"M8.29431 16.7H8.30329\" stroke=\"#262422\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> </g></svg>", "on": "<svg viewBox=\"0 0 28 28\" fill=\"none\" aria-hidden=\"true\" focusable=\"false\"><g>  <path d=\"M19.5416 4.15333V2.33333C19.5416 1.855 19.145 1.45833 18.6666 1.45833C18.1883 1.45833 17.7916 1.855 17.7916 2.33333V4.08333H10.2083V2.33333C10.2083 1.855 9.81165 1.45833 9.33332 1.45833C8.85498 1.45833 8.45832 1.855 8.45832 2.33333V4.15333C5.30832 4.445 3.77998 6.32333 3.54665 9.11167C3.52332 9.45 3.80332 9.73 4.12998 9.73H23.87C24.2083 9.73 24.4883 9.43833 24.4533 9.11167C24.22 6.32333 22.6916 4.445 19.5416 4.15333Z\" fill=\"#E86C61\"/> <path d=\"M23.3333 11.4798H4.66667C4.025 11.4798 3.5 12.0048 3.5 12.6465V19.8332C3.5 23.3332 5.25 25.6665 9.33333 25.6665H18.6667C22.75 25.6665 24.5 23.3332 24.5 19.8332V12.6465C24.5 12.0048 23.975 11.4798 23.3333 11.4798ZM10.745 21.2448C10.6867 21.2915 10.6283 21.3498 10.57 21.3848C10.5 21.4315 10.43 21.4665 10.36 21.4898C10.29 21.5248 10.22 21.5481 10.15 21.5598C10.0683 21.5715 9.99833 21.5832 9.91667 21.5832C9.765 21.5832 9.61333 21.5482 9.47333 21.4898C9.32167 21.4315 9.205 21.3498 9.08833 21.2448C8.87833 21.0231 8.75 20.7198 8.75 20.4165C8.75 20.1132 8.87833 19.8098 9.08833 19.5882C9.205 19.4832 9.32167 19.4015 9.47333 19.3432C9.68333 19.2498 9.91667 19.2265 10.15 19.2732C10.22 19.2848 10.29 19.3082 10.36 19.3432C10.43 19.3665 10.5 19.4015 10.57 19.4482C10.6283 19.4948 10.6867 19.5415 10.745 19.5882C10.955 19.8098 11.0833 20.1132 11.0833 20.4165C11.0833 20.7198 10.955 21.0231 10.745 21.2448ZM10.745 17.1615C10.5233 17.3715 10.22 17.4998 9.91667 17.4998C9.61333 17.4998 9.31 17.3715 9.08833 17.1615C8.87833 16.9398 8.75 16.6365 8.75 16.3332C8.75 16.0298 8.87833 15.7265 9.08833 15.5048C9.415 15.1782 9.92833 15.0732 10.36 15.2598C10.5117 15.3182 10.64 15.3998 10.745 15.5048C10.955 15.7265 11.0833 16.0298 11.0833 16.3332C11.0833 16.6365 10.955 16.9398 10.745 17.1615ZM14.8283 21.2448C14.6067 21.4548 14.3033 21.5832 14 21.5832C13.6967 21.5832 13.3933 21.4548 13.1717 21.2448C12.9617 21.0231 12.8333 20.7198 12.8333 20.4165C12.8333 20.1132 12.9617 19.8098 13.1717 19.5882C13.6033 19.1565 14.3967 19.1565 14.8283 19.5882C15.0383 19.8098 15.1667 20.1132 15.1667 20.4165C15.1667 20.7198 15.0383 21.0231 14.8283 21.2448ZM14.8283 17.1615C14.77 17.2082 14.7117 17.2548 14.6533 17.3015C14.5833 17.3482 14.5133 17.3832 14.4433 17.4065C14.3733 17.4415 14.3033 17.4648 14.2333 17.4765C14.1517 17.4881 14.0817 17.4998 14 17.4998C13.6967 17.4998 13.3933 17.3715 13.1717 17.1615C12.9617 16.9398 12.8333 16.6365 12.8333 16.3332C12.8333 16.0298 12.9617 15.7265 13.1717 15.5048C13.2767 15.3998 13.405 15.3182 13.5567 15.2598C13.9883 15.0732 14.5017 15.1782 14.8283 15.5048C15.0383 15.7265 15.1667 16.0298 15.1667 16.3332C15.1667 16.6365 15.0383 16.9398 14.8283 17.1615ZM18.9117 21.2448C18.69 21.4548 18.3867 21.5832 18.0833 21.5832C17.78 21.5832 17.4767 21.4548 17.255 21.2448C17.045 21.0231 16.9167 20.7198 16.9167 20.4165C16.9167 20.1132 17.045 19.8098 17.255 19.5882C17.6867 19.1565 18.48 19.1565 18.9117 19.5882C19.1217 19.8098 19.25 20.1132 19.25 20.4165C19.25 20.7198 19.1217 21.0231 18.9117 21.2448ZM18.9117 17.1615C18.8533 17.2082 18.795 17.2548 18.7367 17.3015C18.6667 17.3482 18.5967 17.3832 18.5267 17.4065C18.4567 17.4415 18.3867 17.4648 18.3167 17.4765C18.235 17.4881 18.1533 17.4998 18.0833 17.4998C17.78 17.4998 17.4767 17.3715 17.255 17.1615C17.045 16.9398 16.9167 16.6365 16.9167 16.3332C16.9167 16.0298 17.045 15.7265 17.255 15.5048C17.3717 15.3998 17.4883 15.3182 17.64 15.2598C17.85 15.1665 18.0833 15.1432 18.3167 15.1898C18.3867 15.2015 18.4567 15.2248 18.5267 15.2598C18.5967 15.2832 18.6667 15.3182 18.7367 15.3648C18.795 15.4115 18.8533 15.4582 18.9117 15.5048C19.1217 15.7265 19.25 16.0298 19.25 16.3332C19.25 16.6365 19.1217 16.9398 18.9117 17.1615Z\" fill=\"#E86C61\"/> </g></svg>"}, "trends": {"off": "<svg viewBox=\"0 0 24 24\" fill=\"none\" aria-hidden=\"true\" focusable=\"false\"><g opacity=\"0.8\"> <path d=\"M4.02 5.97C2.75 7.65 2 9.74 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2\" stroke=\"#262422\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> <path d=\"M5 12C5 15.87 8.13 19 12 19C15.87 19 19 15.87 19 12C19 8.13 15.87 5 12 5\" stroke=\"#262422\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> <path d=\"M12 16C14.21 16 16 14.21 16 12C16 9.79 14.21 8 12 8\" stroke=\"#262422\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>  </g></svg>", "on": "<svg viewBox=\"0 0 28 28\" fill=\"none\" aria-hidden=\"true\" focusable=\"false\"><g> <path d=\"M14 2.33333C7.56 2.33333 2.33333 7.56 2.33333 14C2.33333 20.44 7.56 25.6667 14 25.6667C20.44 25.6667 25.6667 20.44 25.6667 14C25.6667 7.56 20.44 2.33333 14 2.33333ZM14 10.2083C13.5217 10.2083 13.125 9.81167 13.125 9.33333C13.125 8.855 13.5217 8.45833 14 8.45833C17.0567 8.45833 19.5417 10.9433 19.5417 14C19.5417 17.0567 17.0567 19.5417 14 19.5417C13.5217 19.5417 13.125 19.145 13.125 18.6667C13.125 18.1883 13.5217 17.7917 14 17.7917C16.0883 17.7917 17.7917 16.0883 17.7917 14C17.7917 11.9117 16.0883 10.2083 14 10.2083ZM14 23.0417C9.01833 23.0417 4.95833 18.9817 4.95833 14C4.95833 13.5217 5.355 13.125 5.83333 13.125C6.31167 13.125 6.70833 13.5217 6.70833 14C6.70833 18.025 9.975 21.2917 14 21.2917C18.025 21.2917 21.2917 18.025 21.2917 14C21.2917 9.975 18.025 6.70833 14 6.70833C13.5217 6.70833 13.125 6.31167 13.125 5.83333C13.125 5.355 13.5217 4.95833 14 4.95833C18.9817 4.95833 23.0417 9.01833 23.0417 14C23.0417 18.9817 18.9817 23.0417 14 23.0417Z\" fill=\"#E86C61\"/>  </g></svg>"}, "settings": {"off": "<svg viewBox=\"0 0 24 24\" fill=\"none\" aria-hidden=\"true\" focusable=\"false\"><g opacity=\"0.8\"> <path d=\"M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z\" stroke=\"#262422\" stroke-width=\"1.5\" stroke-miterlimit=\"10\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> <path d=\"M2 12.88V11.12C2 10.08 2.85 9.22 3.9 9.22C5.71 9.22 6.45 7.94 5.54 6.37C5.02 5.47 5.33 4.3 6.24 3.78L7.97 2.79C8.76 2.32 9.78 2.6 10.25 3.39L10.36 3.58C11.26 5.15 12.74 5.15 13.65 3.58L13.76 3.39C14.23 2.6 15.25 2.32 16.04 2.79L17.77 3.78C18.68 4.3 18.99 5.47 18.47 6.37C17.56 7.94 18.3 9.22 20.11 9.22C21.15 9.22 22.01 10.07 22.01 11.12V12.88C22.01 13.92 21.16 14.78 20.11 14.78C18.3 14.78 17.56 16.06 18.47 17.63C18.99 18.54 18.68 19.7 17.77 20.22L16.04 21.21C15.25 21.68 14.23 21.4 13.76 20.61L13.65 20.42C12.75 18.85 11.27 18.85 10.36 20.42L10.25 20.61C9.78 21.4 8.76 21.68 7.97 21.21L6.24 20.22C5.33 19.7 5.02 18.53 5.54 17.63C6.45 16.06 5.71 14.78 3.9 14.78C2.85 14.78 2 13.92 2 12.88Z\" stroke=\"#262422\" stroke-width=\"1.5\" stroke-miterlimit=\"10\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>  </g></svg>", "on": "<svg viewBox=\"0 0 28 28\" fill=\"none\" aria-hidden=\"true\" focusable=\"false\"><g> <path d=\"M23.45 10.7567C21.3383 10.7567 20.475 9.26333 21.525 7.43167C22.1317 6.37 21.77 5.01667 20.7083 4.41L18.69 3.255C17.7683 2.70667 16.5783 3.03333 16.03 3.955L15.9017 4.17667C14.8517 6.00833 13.125 6.00833 12.0633 4.17667L11.935 3.955C11.41 3.03333 10.22 2.70667 9.29833 3.255L7.28 4.41C6.21833 5.01667 5.85667 6.38167 6.46333 7.44333C7.525 9.26333 6.66167 10.7567 4.55 10.7567C3.33667 10.7567 2.33333 11.7483 2.33333 12.9733V15.0267C2.33333 16.24 3.325 17.2433 4.55 17.2433C6.66167 17.2433 7.525 18.7367 6.46333 20.5683C5.85667 21.63 6.21833 22.9833 7.28 23.59L9.29833 24.745C10.22 25.2933 11.41 24.9667 11.9583 24.045L12.0867 23.8233C13.1367 21.9917 14.8633 21.9917 15.925 23.8233L16.0533 24.045C16.6017 24.9667 17.7917 25.2933 18.7133 24.745L20.7317 23.59C21.7933 22.9833 22.155 21.6183 21.5483 20.5683C20.4867 18.7367 21.35 17.2433 23.4617 17.2433C24.675 17.2433 25.6783 16.2517 25.6783 15.0267V12.9733C25.6667 11.76 24.675 10.7567 23.45 10.7567ZM14 17.7917C11.9117 17.7917 10.2083 16.0883 10.2083 14C10.2083 11.9117 11.9117 10.2083 14 10.2083C16.0883 10.2083 17.7917 11.9117 17.7917 14C17.7917 16.0883 16.0883 17.7917 14 17.7917Z\" fill=\"#E86C61\"/>  </g></svg>"}};
  var TABS = [['home', 'Home'], ['calendar', 'Calendar'], ['trends', 'Trends'], ['settings', 'Settings']];

  function tabbarItems(active) {
    return TABS.map(function (t) {
      var on = t[0] === active;
      return '<span class="lunel-tabbar__item"' + (on ? ' data-active' : '') + '>' +
        '<span class="lunel-tabbar__icon">' + TAB_ICONS[t[0]][on ? 'on' : 'off'] + '</span>' +
        '<span class="lunel-tabbar__label" data-i18n="' + t[1] + '">' + t[1] + '</span></span>';
    }).join('');
  }

  function tabbarHTML(active) {
    return '<nav class="lunel-tabbar" aria-hidden="true">' + tabbarItems(active) + '</nav>';
  }

  function fillTabbars(root) {
    var navs = root.querySelectorAll('nav[data-lunel-tabbar]');
    for (var i = 0; i < navs.length; i++) {
      if (!navs[i].children.length) {
        navs[i].innerHTML = tabbarItems(navs[i].getAttribute('data-lunel-tabbar'));
        applyI18n(navs[i], langOf(navs[i]));
      }
    }
  }

  function mount(scope) {
    var root = scope || global.document;
    if (!root.querySelectorAll) return;
    fillTabbars(root);
    var nodes = root.querySelectorAll('[data-lunel-component]');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var name = el.getAttribute('data-lunel-component');
      if (el.__lunel || !factories[name]) continue;
      try {
        el.__lunel = factories[name](el) || {};
        el.setAttribute('data-lunel-ready', '');
      } catch (err) {
        /* A component that fails to boot leaves its honest static markup in
           place rather than taking the page down. */
        el.setAttribute('data-lunel-failed', '');
        if (global.console && global.console.error) global.console.error(err);
      }
    }
    fitAllFrames(root);
  }

  global.Lunel = {
    version: '1.0.0',
    define: define,
    mount: mount,
    tabbar: tabbarHTML,
    text: { numeric: numericText, blurReplace: blurReplace },
    icons: {
      /* Assets.xcassets/Icons/CalendarEdit.svg as is: 20-unit glyph drawn at
         24pt in the ⌀44 Liquid Glass header button (HeaderGlassIconButton). */
      calendarEdit:
      '<svg viewBox="0 0 20 20" aria-hidden="true">' +
      '<path d="M15.5835 13.5667C15.8335 14.4667 16.5335 15.1667 17.4335 15.4167M16.0085 13.1417L13.0585 16.0917C12.9419 16.2084 12.8335 16.425 12.8085 16.5834L12.6502 17.7084C12.5919 18.1167 12.8752 18.4 13.2835 18.3417L14.4085 18.1834C14.5669 18.1584 14.7919 18.05 14.9002 17.9334L17.8502 14.9834C18.3585 14.475 18.6002 13.8834 17.8502 13.1334C17.1085 12.3917 16.5169 12.6334 16.0085 13.1417Z"/>' +
      '<path d="M6.66667 1.66669V4.16669M13.3333 1.66669V4.16669M2.91667 7.57499H17.0833M10 18.3334H6.66667C3.75 18.3334 2.5 16.6667 2.5 14.1667V7.08335C2.5 4.58335 3.75 2.91669 6.66667 2.91669H13.3333C16.25 2.91669 17.5 4.58335 17.5 7.08335V10"/>' +
      '<path class="dot" d="M9.99607 11.4166H10.0036M6.91209 11.4166H6.91957M6.91209 13.9166H6.91957"/></svg>'
    },
    motion: {
      reduced: reduced,
      onChange: function (cb) {
        reduceListeners.push(cb);
        return function () {
          var i = reduceListeners.indexOf(cb);
          if (i >= 0) reduceListeners.splice(i, 1);
        };
      },
      springEasing: springEasing,
      springValue: springValue,
      override: overrideReduced
    },
    ticker: { add: addTask },
    inView: inView,
    fitFrame: fitFrame,
    fitFrames: fitAllFrames,
    i18n: {
      strings: STRINGS,
      plurals: PLURALS,
      t: t,
      extend: extend,
      apply: applyI18n,
      setLang: setLang,
      langOf: langOf,
      format: format,
      missing: missingKeys
    },
    color: { hexToRgb: hexToRgb, rgbToHsb: rgbToHsb, hsbToCss: hsbToCss, rgba: rgba },
    phase: { all: PHASE, forDay: phaseForDay },
    dates: { addDays: addDays, monthStandalone: monthStandalone, shortRange: shortRange },
    util: {
      clamp: function (v, lo, hi) { return Math.min(Math.max(v, lo), hi); },
      smoothstep: function (t) { var x = Math.min(Math.max(t, 0), 1); return x * x * (3 - 2 * x); },
      lerp: function (a, b, t) { return a + (b - a) * t; }
    }
  };

  if (global.document.readyState === 'loading') {
    global.document.addEventListener('DOMContentLoaded', function () { mount(global.document); });
  } else {
    mount(global.document);
  }
})(window);
