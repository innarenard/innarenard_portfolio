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

  function mount(scope) {
    var root = scope || global.document;
    if (!root.querySelectorAll) return;
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
