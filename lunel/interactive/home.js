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
    /* Shared with the calendar header: Lunel.icons in lunel-core.js. */
    calendarEdit: L.icons.calendarEdit,
    noteExpand:
      '<svg viewBox="0 0 20 20" aria-hidden="true">' +
      '<path d="M11.6665 8.33333L17.4998 2.5M13.3335 2.5H17.4998L17.5002 6.66667M6.66667 17.5H2.5V13.3333M2.5 17.5L8.33333 11.6667"/></svg>',
    /* Assets.xcassets/Icons/Learn{Body,Food,Energy}Icon.svg as is, 20-unit fills. */
    body:
      '<svg viewBox="0 0 20 20" aria-hidden="true">' +
      '<path d="M7.50016 14.1667C7.50016 13.7064 7.87326 13.3333 8.3335 13.3333H11.6668C12.1271 13.3333 12.5002 13.7064 12.5002 14.1667V15C12.5002 15.4602 12.1271 15.8333 11.6668 15.8333H8.3335C7.87326 15.8333 7.50016 15.4602 7.50016 15V14.1667Z"/>' +
      '<path d="M7.50016 17.2222C7.50016 16.9154 7.74889 16.6667 8.05572 16.6667H11.9446C12.2514 16.6667 12.5002 16.9154 12.5002 17.2222C12.5002 17.8359 12.0027 18.3333 11.3891 18.3333H8.61127C7.99762 18.3333 7.50016 17.8359 7.50016 17.2222Z"/>' +
      '<path d="M10.0002 1.66666C11.3551 1.66666 12.615 2.0717 13.6672 2.7661L13.5573 3.06477C13.4729 3.29287 13.293 3.47271 13.0649 3.55712L11.2786 4.21874C10.5536 4.48735 10.5536 5.51263 11.2786 5.78124L13.0649 6.44286C13.293 6.52727 13.4729 6.70711 13.5573 6.93521L14.2189 8.72151C14.4875 9.44658 15.5128 9.44658 15.7814 8.72151L16.443 6.93521C16.4572 6.89692 16.4742 6.85989 16.4935 6.82453C16.6057 7.30947 16.6668 7.81426 16.6668 8.33332C16.6668 12.0152 13.6821 15 10.0002 15C6.31826 15 3.3335 12.0152 3.3335 8.33332C3.3335 4.65142 6.31826 1.66666 10.0002 1.66666Z"/>' +
      '<path d="M14.6151 1.93476C14.7474 1.57729 15.253 1.57729 15.3852 1.93475L16.0436 3.71397C16.0852 3.82636 16.1738 3.91496 16.2862 3.95655L18.0654 4.61492C18.4229 4.74719 18.4229 5.25279 18.0654 5.38506L16.2862 6.04343C16.1738 6.08501 16.0852 6.17362 16.0436 6.28601L15.3852 8.06522C15.253 8.42269 14.7474 8.42269 14.6151 8.06523L13.9567 6.28601C13.9151 6.17362 13.8265 6.08501 13.7141 6.04343L11.9349 5.38506C11.5775 5.25279 11.5775 4.74719 11.9349 4.61492L13.7141 3.95655C13.8265 3.91496 13.9151 3.82636 13.9567 3.71397L14.6151 1.93476Z"/>' +
      '</svg>',
    food:
      '<svg viewBox="0 0 20 20" aria-hidden="true">' +
      '<path fill-rule="evenodd" clip-rule="evenodd" d="M10.0005 1.1665C12.5167 1.16661 14.7089 2.19499 16.2681 3.46826C17.0481 4.10536 17.6806 4.81262 18.1216 5.49951C18.5552 6.17501 18.8334 6.878 18.8335 7.49951C18.8335 7.77553 18.6095 7.99931 18.3335 7.99951C16.4447 7.99946 14.8533 7.48283 13.4263 6.44678C13.266 6.33038 13.1085 6.20667 12.9526 6.07764C12.9816 6.1419 13.0119 6.20561 13.0405 6.27002C13.4767 7.25086 13.8735 8.25489 14.1655 9.17725C14.3478 9.75289 14.4921 10.3109 14.5786 10.8188C14.9412 10.6445 15.3089 10.5492 15.6733 10.5317C16.2827 10.5026 16.8461 10.6904 17.3179 11.02C18.2512 11.6724 18.8335 12.8784 18.8335 14.1675C18.8333 15.4048 18.3423 16.5923 17.4673 17.4673C16.5923 18.3423 15.4048 18.8333 14.1675 18.8335C12.9302 18.8335 11.7428 18.3419 10.8677 17.4673C10.5125 17.1122 10.2212 16.7046 9.99951 16.2642C9.77805 16.7044 9.48831 17.1123 9.1333 17.4673C8.25824 18.3422 7.07094 18.8334 5.8335 18.8335C4.59609 18.8335 3.4088 18.3421 2.53369 17.4673C1.6587 16.5923 1.1667 15.4048 1.1665 14.1675C1.1665 12.8784 1.74866 11.6724 2.68213 11.02C3.15412 10.6903 3.718 10.5025 4.32764 10.5317C4.81348 10.5551 5.30371 10.7172 5.78174 11.02C6.87656 9.89753 7.65375 8.29961 8.22803 6.61182C8.84876 4.78737 9.21235 2.92814 9.51123 1.56006C9.52199 1.51098 9.54005 1.46478 9.56396 1.42236C9.63442 1.29671 9.75464 1.2097 9.89209 1.1792C9.89562 1.17841 9.89927 1.17698 9.90283 1.17627C9.90704 1.17544 9.91132 1.17504 9.91553 1.17432C9.9297 1.17188 9.94404 1.17064 9.9585 1.16943C9.96699 1.16872 9.97542 1.16776 9.98389 1.16748C9.98929 1.1673 9.99506 1.1665 10.0005 1.1665ZM10.23 2.96533C9.97288 4.14415 9.64543 5.54937 9.17432 6.93408C8.74978 8.18175 8.19791 9.44332 7.4585 10.5308C8.02225 10.5297 8.54287 10.7119 8.98389 11.02C9.39873 11.3099 9.74376 11.7091 9.99951 12.1763C10.2553 11.7089 10.6012 11.31 11.0161 11.02C11.4881 10.6903 12.052 10.5025 12.6616 10.5317C12.9556 10.546 13.2507 10.612 13.5444 10.728C13.4671 10.352 13.3557 9.93169 13.2124 9.479C12.9348 8.60231 12.5526 7.6345 12.1265 6.67627C11.5145 5.30007 10.8195 3.96436 10.23 2.96533Z"/>' +
      '</svg>',
    energy:
      '<svg viewBox="0 0 20 20" aria-hidden="true">' +
      '<path d="M11.0804 1.17997C11.2336 1.15162 11.3912 1.16255 11.5374 1.21122L11.68 1.27275L11.8099 1.35673C11.891 1.41975 11.961 1.49611 12.0169 1.58232L12.0901 1.71904L12.139 1.8665C12.175 2.0163 12.1726 2.17413 12.1311 2.32451C12.1294 2.33067 12.1272 2.33696 12.1253 2.34306L10.5257 7.35966C10.5232 7.36728 10.5207 7.37561 10.5179 7.3831C10.4991 7.43331 10.4926 7.48783 10.4993 7.5413C10.5061 7.5948 10.5254 7.64581 10.5559 7.68974C10.5867 7.73386 10.6284 7.77036 10.6761 7.79521C10.7239 7.82007 10.7777 7.83342 10.8313 7.83329H16.6663C16.9177 7.83283 17.1642 7.90372 17.3772 8.0374C17.5909 8.17146 17.7625 8.3633 17.8714 8.59111L17.9407 8.76591C17.9971 8.945 18.0146 9.13476 17.9925 9.32255C17.9628 9.57304 17.863 9.8104 17.7044 10.0061C17.6952 10.0175 17.6852 10.0289 17.6751 10.0393L9.42509 18.5393L9.42314 18.5374C9.32406 18.645 9.20314 18.7296 9.06669 18.7796L8.91728 18.8196C8.76433 18.8478 8.60729 18.837 8.46122 18.7884L8.31864 18.7268C8.13529 18.6288 7.99044 18.4714 7.90849 18.2806C7.82645 18.0896 7.81256 17.8763 7.86747 17.6761L7.87333 17.6565L9.47294 12.6399L9.48075 12.6165C9.49016 12.5913 9.4962 12.5649 9.49931 12.5384V12.4583C9.49259 12.405 9.47322 12.3539 9.44267 12.3099C9.41187 12.2656 9.37026 12.2292 9.32255 12.2044C9.27466 12.1795 9.22088 12.1661 9.16728 12.1663H3.33231C3.08085 12.1667 2.83361 12.0961 2.6204 11.9622C2.40717 11.8281 2.23598 11.6358 2.12724 11.4085C2.01841 11.1811 1.9757 10.9273 2.00517 10.677C2.03476 10.4266 2.13554 10.1893 2.29423 9.99345L2.32353 9.96025L10.5735 1.46025L10.5745 1.46122C10.7086 1.31563 10.8855 1.21619 11.0804 1.17997Z"/>' +
      '</svg>',
    plus:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5.5v13M5.5 12h13"/></svg>'
  };

  /* Shared with every screen: Lunel.tabbar in lunel-core.js. */
  var TABBAR = L.tabbar('home');

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
      '<div class="lunel-home__stage" data-dim-scale>' +
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
        '<span class="lunel-learn__glow" aria-hidden="true"></span>' +
        '<span class="lunel-learn__icon">' + cards[i][2] + '</span>' +
        '<span class="lunel-body3 lunel-learn__name" data-i18n="' + cards[i][0] + '">' + cards[i][1] + '</span>' +
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
    /* The whole column is what fades behind «Your week» (insights.js dims the
       first [data-dimmable] on the screen). */
    var html = '<div class="lunel-home__scroll lunel-page lunel-dimmable" data-page data-dimmable>' + ringHost(attrs, id);

    html += '<div class="lunel-home__sections" data-dim-scale>';

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
      learnRow.style.setProperty('--lunel-learn-main', phase.main);
    }

    /* HomeScreenPrimaryContent.ringFadeStops: only the ring fades as the
       column scrolls — 0.6 / 0.25 / 0.05 at 80 / 150 / 220 pt, gone by 280.
       The opacity sits on the stage, outside the ring's isolated blend. */
    var FADE = [[0, 1], [80, 0.6], [150, 0.25], [220, 0.05], [280, 0]];
    var scrollEl = content.querySelector('.lunel-home__scroll');
    var stageEl = content.querySelector('.lunel-home__stage');
    function ringFade() {
      var y = scrollEl.scrollTop;
      var o = y >= 280 ? 0 : 1;
      for (var f = 1; f < FADE.length && y > 0; f++) {
        if (y <= FADE[f][0]) {
          var t = (y - FADE[f - 1][0]) / (FADE[f][0] - FADE[f - 1][0]);
          o = FADE[f - 1][1] + (FADE[f][1] - FADE[f - 1][1]) * t;
          break;
        }
      }
      stageEl.style.opacity = String(o);
    }
    if (scrollEl && stageEl) {
      scrollEl.addEventListener('scroll', ringFade, { passive: true });
      ringFade();
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
