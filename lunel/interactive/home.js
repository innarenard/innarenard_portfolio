/* ==========================================================================
   Lunel interactive replicas — Home screen shell
   --------------------------------------------------------------------------
   Ported from HomeScreenView, HomeScreenPrimaryContent, HomeScreenHeader,
   DayTrackingNoteBlockView and AwaitingFirstPeriodView.

   This component owns the scrolling column and the chrome around the ring.
   The ring, the checklist and the AI-insight grid are separate components
   mounted inside it, so nothing in here duplicates their markup or geometry.

   Like `calendar`, `trends` and `insights`, the body is JS-built: the host
   writes an empty, correctly-sized `.lunel-screen__content` and this fills it.

   Every string is read from the app's own Localizable.strings — see the key
   next to each value. Nothing here is translated.
   ========================================================================== */

(function () {
  'use strict';

  var L = window.Lunel;
  if (!L) return;

  /* ------------------------------------------------------------- strings */

  L.i18n.extend({
    en: {
      Checklist: 'Checklist',
      Note: 'Note',
      'AI insights': 'AI insights',
      'Learn for this phase': 'Learn about this phase',
      learn_card_body: 'Body',
      learn_card_food: 'Food',
      learn_card_energy: 'Energy',
      "What's on my mind?": "What's on my mind?",
      'My thoughts:': 'My thoughts:',
      'Let’s start with day one': 'Let’s start with day one',
      'Mark the date': 'Mark the date',
      first_period_hint:
        'Remember when your last period started and mark the date. ' +
        'From there, we’ll help you understand your cycle better.'
    },
    ru: {
      Checklist: 'Чек-лист',
      Note: 'Заметка',
      'AI insights': 'ИИ-инсайты',
      'Learn for this phase': 'Узнать про эту фазу',
      learn_card_body: 'Тело',
      learn_card_food: 'Питание',
      learn_card_energy: 'Энергия',
      "What's on my mind?": 'О чём думаю?',
      'My thoughts:': 'Мои мысли:',
      'Let’s start with day one':
        'Начнём с первого дня',
      'Mark the date': 'Отметить дату',
      first_period_hint:
        'Вспомните, когда начались ' +
        'последние месячные, и ' +
        'отметьте дату. От неё мы ' +
        'поможем лучше понять ' +
        'ваш цикл.'
    }
  });

  /* ------------------------------------------------------------- markup */

  /* The glyphs are plain geometry, not the app's drawn assets: the designer
     icons (CalendarEdit, LearnBodyIcon, LearnFoodIcon, LearnEnergyIcon,
     NoteExpand) are artwork, and the brief says not to redraw artwork. Shape,
     box and stroke weight follow the asset sizes in spec §1.6. */
  var ICON = {
    calendarEdit:
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
      '<rect x="3.2" y="4.8" width="17.6" height="16" rx="4"/>' +
      '<path d="M3.2 9.4h17.6M8 3v3.4M16 3v3.4"/>' +
      '<path d="M15.4 13.2 11 17.6l-2.4.5.5-2.4 4.4-4.4z"/></svg>',
    noteExpand:
      '<svg viewBox="0 0 20 20" aria-hidden="true">' +
      '<path d="M11.5 3.5h5v5M8.5 16.5h-5v-5M16.5 3.5 11 9M3.5 16.5 9 11"/></svg>',
    body:
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
      '<path d="M12 21c-3.9-2.6-6.6-5.4-6.6-9A4.4 4.4 0 0 1 12 8.6a4.4 4.4 0 0 1 6.6 3.4c0 3.6-2.7 6.4-6.6 9z"/>' +
      '<path d="M12 8.6c0-2.3.9-4.1 2.6-5.6-.3 2.1.1 3.6 1.2 4.6"/></svg>',
    food:
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
      '<path d="M12 20.5c-3.4 0-6-2.9-6-6.6 0-3.1 2-5.4 4.4-5.4.8 0 1.2.3 1.6.3s.8-.3 1.6-.3c2.4 0 4.4 2.3 4.4 5.4 0 3.7-2.6 6.6-6 6.6z"/>' +
      '<path d="M12.3 8.2c-.2-2 .9-3.6 2.8-4.2.2 1.9-.7 3.4-2.3 4.1"/></svg>',
    energy:
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
      '<path d="M13.4 2.8 5.6 13.3h5.2l-1 7.9 7.8-10.5h-5.2z"/></svg>',
    plus:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5.5v13M5.5 12h13"/></svg>'
  };

  var TABBAR =
    '<nav class="lunel-tabbar" aria-hidden="true">' +
    '<span class="lunel-tabbar__item" data-active><span class="lunel-tabbar__icon"><svg viewBox="0 0 28 28" aria-hidden="true" focusable="false"><path d="M24.3017 9.345L16.66 3.23167C15.1667 2.04167 12.8333 2.03 11.3517 3.22L3.71 9.345C2.61333 10.22 1.94833 11.97 2.18167 13.3467L3.65167 22.1433C3.99 24.115 5.82167 25.6667 7.81667 25.6667H20.1833C22.155 25.6667 24.0217 24.08 24.36 22.1317L25.83 13.335C26.04 11.97 25.375 10.22 24.3017 9.345ZM14.875 21C14.875 21.4783 14.4783 21.875 14 21.875C13.5217 21.875 13.125 21.4783 13.125 21V17.5C13.125 17.0217 13.5217 16.625 14 16.625C14.4783 16.625 14.875 17.0217 14.875 17.5V21Z" fill="currentColor"/></svg></span><span class="lunel-tabbar__label" data-i18n="Home">Home</span></span>' +
    '<span class="lunel-tabbar__item"><span class="lunel-tabbar__icon"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" class="lunel-tabbar__stroke"><path d="M8 2V5"/><path d="M16 2V5"/><path d="M3.5 9.09H20.5"/><path d="M21 8.5V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V8.5C3 5.5 4.5 3.5 8 3.5H16C19.5 3.5 21 5.5 21 8.5Z"/><g stroke-width="2"><path d="M15.6947 13.7H15.7037"/><path d="M15.6947 16.7H15.7037"/><path d="M11.9955 13.7H12.0045"/><path d="M11.9955 16.7H12.0045"/><path d="M8.29431 13.7H8.30329"/><path d="M8.29431 16.7H8.30329"/></g></svg></span><span class="lunel-tabbar__label" data-i18n="Calendar">Calendar</span></span>' +
    '<span class="lunel-tabbar__item"><span class="lunel-tabbar__icon"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" class="lunel-tabbar__stroke"><path d="M4.02 5.97C2.75 7.65 2 9.74 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2"/><path d="M5 12C5 15.87 8.13 19 12 19C15.87 19 19 15.87 19 12C19 8.13 15.87 5 12 5"/><path d="M12 16C14.21 16 16 14.21 16 12C16 9.79 14.21 8 12 8"/></svg></span><span class="lunel-tabbar__label" data-i18n="Trends">Trends</span></span>' +
    '<span class="lunel-tabbar__item"><span class="lunel-tabbar__icon"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" class="lunel-tabbar__stroke"><path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"/><path d="M2 12.88V11.12C2 10.08 2.85 9.22 3.9 9.22C5.71 9.22 6.45 7.94 5.54 6.37C5.02 5.47 5.33 4.3 6.24 3.78L7.97 2.79C8.76 2.32 9.78 2.6 10.25 3.39L10.36 3.58C11.26 5.15 12.74 5.15 13.65 3.58L13.76 3.39C14.23 2.6 15.25 2.32 16.04 2.79L17.77 3.78C18.68 4.3 18.99 5.47 18.47 6.37C17.56 7.94 18.3 9.22 20.11 9.22C21.15 9.22 22.01 10.07 22.01 11.12V12.88C22.01 13.92 21.16 14.78 20.11 14.78C18.3 14.78 17.56 16.06 18.47 17.63C18.99 18.54 18.68 19.7 17.77 20.22L16.04 21.21C15.25 21.68 14.23 21.4 13.76 20.61L13.65 20.42C12.75 18.85 11.27 18.85 10.36 20.42L10.25 20.61C9.78 21.4 8.76 21.68 7.97 21.21L6.24 20.22C5.33 19.7 5.02 18.53 5.54 17.63C6.45 16.06 5.71 14.78 3.9 14.78C2.85 14.78 2 13.92 2 12.88Z"/></svg></span><span class="lunel-tabbar__label" data-i18n="Settings">Settings</span></span>' +
    '</nav>';

  /* The ring host, exactly the skeleton cycle-ring.js queries for. The static
     SVG fallback the standalone replica ships is deliberately not repeated:
     this whole screen is JS-built, so there is no no-JS state to protect. */
  function ringHost(attrs, idSuffix) {
    return (
      '<div data-lunel-component="cycle-ring"' + attrs + '>' +
      '<div class="lunel-home">' +
      '<header class="lunel-home__header">' +
      '<div class="lunel-home__blur" aria-hidden="true"><span></span><span></span><span></span><span></span></div>' +
      '<h2 class="lunel-h2 lunel-home__title" data-title>Today</h2>' +
      '<button type="button" class="lunel-ghost-btn lunel-home__today" data-today data-i18n="Today" hidden>Today</button>' +
      '<button type="button" class="lunel-home__action" data-i18n-label="Calendar" aria-label="Calendar">' +
      ICON.calendarEdit +
      '</button>' +
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
      '<p class="lunel-caption1 lunel-ring__phase" id="lunel-ring-phase-' + idSuffix + '" data-phase></p>' +
      '<p class="lunel-caption2 lunel-ring__tag lunel-tnum" data-tag></p>' +
      '</div>' +
      '<div class="lunel-ring__noise" aria-hidden="true"></div>' +
      '<div class="lunel-ring__input" data-input role="slider" tabindex="0"' +
      ' aria-labelledby="lunel-ring-phase-' + idSuffix + '"></div>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '</div>'
    );
  }

  function noteBlock(text) {
    var filled = !!text;
    return (
      '<section class="lunel-home__block">' +
      '<h3 class="lunel-subheader" data-i18n="Note">Note</h3>' +
      '<button type="button" class="lunel-note"' + (filled ? '' : ' data-empty') + '>' +
      '<span class="lunel-note__body">' +
      (filled
        ? '<span class="lunel-caption2 lunel-note__label" data-i18n="My thoughts:">My thoughts:</span>' +
          '<span class="lunel-body2 lunel-note__text">' + text + '</span>'
        /* The app writes this one with an ASCII apostrophe and the next with a
           typographic one. Spec §13: reproduce both exactly, do not normalise —
           the key has to match the app's character for character. */
        : '<span class="lunel-body2 lunel-note__label" data-i18n="What\'s on my mind?"' +
          ' data-note-placeholder>What\'s on my mind?</span>') +
      '</span>' +
      ICON.noteExpand.replace('<svg', '<svg class="lunel-note__expand"') +
      '</button>' +
      '</section>'
    );
  }

  function learnBlock() {
    var cards = [
      ['learn_card_body', 'Body', ICON.body],
      ['learn_card_food', 'Food', ICON.food],
      ['learn_card_energy', 'Energy', ICON.energy]
    ];
    var html =
      '<section class="lunel-home__block lunel-learn">' +
      '<h3 class="lunel-subheader" data-i18n="Learn for this phase">Learn about this phase</h3>' +
      '<div class="lunel-learn__row">';
    for (var i = 0; i < cards.length; i++) {
      html +=
        '<button type="button" class="lunel-learn__card">' +
        '<span class="lunel-learn__icon">' + cards[i][2] + '</span>' +
        '<span class="lunel-body1 lunel-learn__name" data-i18n="' + cards[i][0] + '">' + cards[i][1] + '</span>' +
        '</button>';
    }
    return html + '</div></section>';
  }

  /* The insight host carries the weekly-modal skeleton too, because
     insights.js queries for it on mount. */
  function insightHost(cards, idSuffix) {
    return (
      '<section class="lunel-home__block" data-lunel-component="insights"' +
      (cards ? ' data-cards="' + cards + '"' : '') + ' data-weekly-state="rich">' +
      '<div class="lunel-dimmable" data-dimmable>' +
      '<div class="lunel-insights">' +
      '<h3 class="lunel-subheader" data-i18n="AI insights">AI insights</h3>' +
      '<div class="lunel-insights__grid" data-icards></div>' +
      '</div></div>' +
      '<div class="lunel-weekly" data-weekly hidden>' +
      '<button type="button" class="lunel-weekly__dismiss" data-weekly-dismiss aria-label="Close"></button>' +
      '<div class="lunel-weekly__panel" role="dialog" aria-modal="true" aria-labelledby="lunel-weekly-title-' + idSuffix + '">' +
      '<div class="lunel-weekly__grabber" aria-hidden="true"></div>' +
      '<h2 class="lunel-h2 lunel-weekly__title" id="lunel-weekly-title-' + idSuffix + '" data-weekly-title>Your week</h2>' +
      '<p class="lunel-weekly__subtitle" data-weekly-subtitle></p>' +
      '<div class="lunel-weekly__sections">' +
      '<section><h3 class="lunel-weekly__sub" data-weekly-sub-usual>Usually on these days</h3>' +
      '<div class="lunel-weekly__block"><p class="lunel-weekly__lead" data-weekly-usual-lead></p>' +
      '<p class="lunel-weekly__basis" data-weekly-usual-basis></p></div></section>' +
      '<section><h3 class="lunel-weekly__sub" data-weekly-sub-next>Next cycle</h3>' +
      '<div class="lunel-weekly__block"><p class="lunel-weekly__lead" data-weekly-next-lead></p>' +
      '<p class="lunel-weekly__basis" data-weekly-next-basis></p></div></section>' +
      '</div></div></div>' +
      '</section>'
    );
  }

  function awaitingBody() {
    return (
      '<div class="lunel-home">' +
      '<header class="lunel-home__header">' +
      '<h2 class="lunel-h2 lunel-home__title" data-i18n="Let’s start with day one">Let’s start with day one</h2>' +
      '<button type="button" class="lunel-home__action" data-i18n-label="Calendar" aria-label="Calendar">' +
      ICON.calendarEdit + '</button>' +
      '</header>' +
      '<div class="lunel-awaiting">' +
      '<p class="lunel-body4 lunel-awaiting__hint" data-i18n="first_period_hint">' +
      'Remember when your last period started and mark the date. ' +
      'From there, we’ll help you understand your cycle better.</p>' +
      '<div class="lunel-awaiting__block">' +
      '<svg class="lunel-awaiting__arc" viewBox="0 0 194 194" aria-hidden="true">' +
      '<circle cx="97" cy="97" r="87"/>' +
      '<circle class="lunel-awaiting__sweep" cx="97" cy="97" r="87"' +
      ' stroke-dasharray="155 392" />' +
      '</svg>' +
      '<div style="display:flex;flex-direction:column;align-items:center">' +
      '<button type="button" class="lunel-awaiting__plus" data-i18n-label="Mark the date" aria-label="Mark the date">' +
      ICON.plus + '</button>' +
      '<p class="lunel-caption1 lunel-awaiting__caption" data-i18n="Mark the date">Mark the date</p>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '</div>'
    );
  }

  /* --------------------------------------------------------- the factory */

  var seq = 0;

  L.define('home', function (root) {
    var content = root.querySelector('.lunel-screen__content');
    if (!content) throw new Error('home: no .lunel-screen__content in the host');
    var screenEl = content.parentNode;
    if (screenEl && screenEl.setAttribute) screenEl.setAttribute('data-under-status', '');

    var id = 'h' + ++seq;
    var lang = L.i18n.langOf(root);
    var state = root.getAttribute('data-state') || 'normal';

    if (state === 'awaiting') {
      content.innerHTML =
        '<div class="lunel-home__scroll">' + awaitingBody() + '</div>' + TABBAR;
      L.i18n.apply(root, lang);
      root.addEventListener('lunel:lang', function (e) { L.i18n.apply(root, e.detail.lang); });
      L.fitFrames(root.parentNode || root);
      return { kind: 'awaiting' };
    }

    /* Pass the cycle attributes straight through to the ring. */
    var pass = ['cycle-length', 'period-length', 'current-day', 'anchor', 'notes'];
    var attrs = '';
    for (var i = 0; i < pass.length; i++) {
      var v = root.getAttribute('data-' + pass[i]);
      if (v !== null) attrs += ' data-' + pass[i] + '="' + v + '" ';
    }

    var fill = root.getAttribute('data-fill') || 'empty';
    var noteText = root.getAttribute('data-note') || '';
    /* lunel-page + data-page: чек-лист притеняет страницу, когда поднимает
       шторку. Без этого якоря модалка открывалась над неприглушённым экраном. */
    var html = '<div class="lunel-home__scroll lunel-page" data-page>' + ringHost(attrs, id);

    html += '<div class="lunel-home__sections">';

    if (fill !== 'none') {
      html +=
        '<section class="lunel-home__block" data-lunel-component="checklist"' +
        ' data-fill="' + fill + '"' +
        (root.hasAttribute('data-period') ? ' data-period' : '') +
        (root.hasAttribute('data-past') ? ' data-past' : '') +
        (root.hasAttribute('data-toast')
          ? ' data-toast-kind="' + (root.getAttribute('data-toast') || 'stats') + '"' +
            (root.hasAttribute('data-toast-dwell')
              ? ' data-toast-dwell="' + root.getAttribute('data-toast-dwell') + '"' : '')
          : '') +
        '></section>';
    }

    html += noteBlock(noteText);
    if (root.hasAttribute('data-learn')) html += learnBlock();
    if (root.hasAttribute('data-insights')) {
      html += insightHost(root.getAttribute('data-insights'), id);
    }

    html += '</div></div>' + TABBAR;
    content.innerHTML = html;

    /* The learn cards take the phase colour of the day on show. */
    var day = parseInt(root.getAttribute('data-current-day') || '1', 10);
    var cycle = parseInt(root.getAttribute('data-cycle-length') || '28', 10);
    var period = parseInt(root.getAttribute('data-period-length') || '5', 10);
    var phase = L.phase.forDay(day, cycle, period);
    var learnRow = content.querySelector('.lunel-learn__row');
    if (learnRow && phase) {
      var rgb = L.color.hexToRgb(phase.main);
      learnRow.style.setProperty('--lunel-learn-rgb', rgb.r + ',' + rgb.g + ',' + rgb.b);
      learnRow.style.setProperty('--lunel-learn-dark', phase.dark);
    }

    root.addEventListener('lunel:lang', function (e) { L.i18n.apply(root, e.detail.lang); });

    /* Children mount now; querySelectorAll never returns the root itself, so
       this cannot re-enter the factory. */
    L.mount(root);

    /* After the children have written their own markup, so their English is
       remembered and a Russian host starts out Russian. */
    L.i18n.apply(root, lang);

    return {
      kind: 'home',
      scroll: content.querySelector('.lunel-home__scroll'),
      ring: function () {
        var el = content.querySelector('[data-lunel-component="cycle-ring"]');
        return el && el.__lunel;
      }
    };
  });
})();
