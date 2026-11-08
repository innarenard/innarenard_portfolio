/* ==========================================================================
   Lunel interactive replicas — Bilingual Checklist
   --------------------------------------------------------------------------
   Ported from DayTrackingChecklistView, TrackingChecklistSheetView,
   BleedingVerticalScale, DailyLogEditorView, MoodField and ChecklistDoneToast.

   Canned data, no storage: the three rows start empty, the sheet walks
   Flow → Daily log → Mood without closing, filled rows sink below unfilled
   ones, and the toast fires only when the whole checklist is closed.

   Every string below is harvested from the app's Localizable.strings via
   lunel-spec.md §5 and §13. Nothing is translated here.
   ========================================================================== */

(function () {
  'use strict';

  var L = window.Lunel;
  if (!L) return;
  var U = L.util;

  /* ------------------------------------------------------------- strings */

  L.i18n.extend({
    en: {
      checklist_q_flow: 'What is my flow today?',
      checklist_q_log: 'How is my day going?',
      checklist_q_mood: 'What is my mood today?',
      Period: 'Period',
      'Period started': 'Period started',
      'Vaginal discharge': 'Vaginal discharge',
      'No discharge': 'No discharge',
      'Clear/whitish': 'Clear/whitish',
      Bloody: 'Bloody',
      Unusual: 'Unusual',
      Odor: 'Odor',
      'Yellow/green': 'Yellow/green',
      'White lumpy': 'White lumpy',
      'What was my flow?': 'What was my flow?',
      'How was my day?': 'How was my day?',
      'What was my mood?': 'What was my mood?',
      'Flow:': 'Flow:',
      'Daily log:': 'Daily log:',
      'Mood:': 'Mood:',
      flow_mild: 'Mild',
      flow_moderate: 'Moderate',
      flow_heavy: 'Heavy',
      flow_intense: 'Intense',
      flow_mild_desc: 'Spotting, a liner is enough',
      flow_moderate_desc: 'Regular days, changing every 4–6 hours',
      flow_heavy_desc: 'Changing every 2–3 hours',
      flow_intense_desc: 'Changing more often than every 2 hours, with leaks and at night',
      Symptoms: 'Symptoms',
      'Pain and discomfort': 'Pain and discomfort',
      'Physical activity': 'Physical activity',
      Sex: 'Sex',
      Other: 'Other',
      'Body pain': 'Body pain',
      'Vaginal discomfort': 'Vaginal discomfort',
      'No symptoms': 'No symptoms',
      Bloating: 'Bloating',
      Constipation: 'Constipation',
      Diarrhea: 'Diarrhea',
      Nausea: 'Nausea',
      Insomnia: 'Insomnia',
      Sleepiness: 'Sleepiness',
      Breakouts: 'Breakouts',
      'No pain': 'No pain',
      Headache: 'Headache',
      'Abdominal pain': 'Abdominal pain',
      'Lower back pain': 'Lower back pain',
      'Pelvic pain': 'Pelvic pain',
      'Breast tenderness': 'Breast tenderness',
      'Pain during sex': 'Pain during sex',
      'Vaginal itching': 'Vaginal itching',
      'Vaginal burning': 'Vaginal burning',
      'Vaginal dryness': 'Vaginal dryness',
      activity_level_rest: 'Rest',
      activity_level_light: 'Light',
      activity_level_moderate: 'Moderate',
      activity_level_intense: 'Intense',
      Protected: 'Protected',
      Unprotected: 'Unprotected',
      Travel: 'Travel',
      Stress: 'Stress',
      Alcohol: 'Alcohol',
      Smoking: 'Smoking',
      mood_level_1: 'Hard',
      mood_level_2: 'Low',
      mood_level_3: 'Neutral',
      mood_level_4: 'Good',
      mood_level_5: 'Great',
      energy_inline_1: 'Very low energy',
      energy_inline_2: 'Low energy',
      energy_inline_3: 'Enough energy',
      energy_inline_4: 'High energy',
      energy_inline_5: 'Full of energy',
      'Great job!': 'Great job!',
      'New in Trends: Insights': 'New in Trends: Insights',
      'Added to your statistics. The more you log, the better Lunel understands you':
        'Added to your statistics. The more you log, the better Lunel understands you'
    },
    ru: {
      checklist_q_flow: 'Какие сегодня выделения?',
      checklist_q_log: 'Как проходит мой день?',
      checklist_q_mood: 'Какое сегодня настроение?',
      Period: 'Месячные',
      'Period started': 'Месячные начались',
      'Vaginal discharge': 'Выделения',
      'No discharge': 'Нет выделений',
      'Clear/whitish': 'Прозрачные/белые',
      Bloody: 'С кровью',
      Unusual: 'Нетипичные',
      Odor: 'Запах',
      'Yellow/green': 'Жёлтые/зелёные',
      'White lumpy': 'Белые творожистые',
      'What was my flow?': 'Какие были выделения?',
      'How was my day?': 'Как прошёл мой день?',
      'What was my mood?': 'Какое было настроение?',
      'Flow:': 'Выделения:',
      'Daily log:': 'Мой день:',
      'Mood:': 'Настроение:',
      flow_mild: 'Скудные',
      flow_moderate: 'Умеренные',
      flow_heavy: 'Обильные',
      flow_intense: 'Очень обильные',
      flow_mild_desc: 'Мажущие, хватает ежедневки',
      flow_moderate_desc: 'Обычные дни, смена каждые 4–6 часов',
      flow_heavy_desc: 'Смена каждые 2–3 часа',
      flow_intense_desc: 'Смена чаще чем раз в 2 часа, протечки и ночью',
      Symptoms: 'Симптомы',
      'Pain and discomfort': 'Боль и дискомфорт',
      'Physical activity': 'Физическая активность',
      Sex: 'Секс',
      Other: 'Другое',
      'Body pain': 'Боль в теле',
      'Vaginal discomfort': 'Дискомфорт во влагалище',
      'No symptoms': 'Нет симптомов',
      Bloating: 'Вздутие',
      Constipation: 'Запор',
      Diarrhea: 'Диарея',
      Nausea: 'Тошнота',
      Insomnia: 'Бессонница',
      Sleepiness: 'Сонливость',
      Breakouts: 'Высыпания',
      'No pain': 'Нет боли',
      Headache: 'Головная боль',
      'Abdominal pain': 'Боль в животе',
      'Lower back pain': 'Боль в пояснице',
      'Pelvic pain': 'Тазовая боль',
      'Breast tenderness': 'Болезненность груди',
      'Pain during sex': 'Боль во время секса',
      'Vaginal itching': 'Зуд во влагалище',
      'Vaginal burning': 'Жжение во влагалище',
      'Vaginal dryness': 'Сухость влагалища',
      activity_level_rest: 'Отдых',
      activity_level_light: 'Лёгкая',
      activity_level_moderate: 'Умеренная',
      activity_level_intense: 'Интенсивная',
      Protected: 'Защищённый',
      Unprotected: 'Незащищённый',
      Travel: 'Путешествие',
      Stress: 'Стресс',
      Alcohol: 'Алкоголь',
      Smoking: 'Курение',
      mood_level_1: 'Тяжёлое',
      mood_level_2: 'Непростое',
      mood_level_3: 'Ровное',
      mood_level_4: 'Хорошее',
      mood_level_5: 'Отличное',
      energy_inline_1: 'почти нет энергии',
      energy_inline_2: 'мало энергии',
      energy_inline_3: 'достаточно энергии',
      energy_inline_4: 'много энергии',
      energy_inline_5: 'полна энергии',
      'Great job!': 'Отличная работа!',
      'New in Trends: Insights': 'Есть обновление в трендах — в инсайтах',
      'Added to your statistics. The more you log, the better Lunel understands you':
        'Добавлено в вашу статистику. Чем чаще отмечаете, тем лучше Lunel вас понимает'
    }
  });

  /* ------------------------------------------------------------- the data */

  var FLOW = [
    { key: 'mild', color: '#FA5A64' },
    { key: 'moderate', color: '#DB2B2B' },
    { key: 'heavy', color: '#900D15' },
    { key: 'intense', color: '#710002' }
  ]; /* index 0 = bottom row = lightest */

  var PALETTE = {
    symptoms: { tint: 'rgba(140,135,231,.10)', dark: '#4E4FA1' },
    period: { tint: 'rgba(221,96,140,.10)', dark: '#933454' },
    discharge: { tint: 'rgba(175,123,214,.10)', dark: '#6F4392' },
    pain: { tint: 'rgba(14,172,155,.10)', dark: '#0C5349' },
    activity: { tint: 'rgba(138,161,46,.10)', dark: '#48540A' },
    sex: { tint: 'rgba(71,167,71,.10)', dark: '#48540A' },
    sexUnprotected: { tint: 'rgba(221,96,140,.10)', dark: '#933454' },
    other: { tint: 'rgba(254,159,93,.10)', dark: '#8F4100' }
  };

  /* Порядок и состав — один в один из DailyLogEditorView.swift. «Месячные»
     показываются только ВНЕ месячных, «Выделения» прячутся в дни месячных. */
  var GROUPS = [
    {
      key: 'period', title: 'Period', mode: 'multi', palette: 'period',
      outsidePeriodOnly: true,
      tags: [{ key: 'Period started', emoji: '\uD83D\uDE80' }]
    },
    {
      key: 'discharge', title: 'Vaginal discharge', mode: 'multi', palette: 'discharge',
      hiddenOnPeriod: true,
      tags: [
        { key: 'No discharge', emoji: '\uD83E\uDD0D', none: true },
        { key: 'Clear/whitish', emoji: '\uD83D\uDCA6' },
        { key: 'Bloody', emoji: '\uD83E\uDE78' },
        {
          expander: 'Unusual',
          leaves: [
            { key: 'Odor', emoji: '\uD83D\uDE37' },
            { key: 'Yellow/green', emoji: '\uD83E\uDDEA' },
            { key: 'White lumpy', emoji: '\uD83E\uDD5A' }
          ]
        }
      ]
    },
    {
      key: 'symptoms', title: 'Symptoms', mode: 'multi', palette: 'symptoms',
      tags: [
        { key: 'No symptoms', emoji: '✨', none: true },
        { key: 'Bloating', emoji: '🎈' },
        { key: 'Constipation', emoji: '🧱' },
        { key: 'Diarrhea', emoji: '💩' },
        { key: 'Nausea', emoji: '🤢' },
        { key: 'Insomnia', emoji: '🦉' },
        { key: 'Sleepiness', emoji: '🥱' },
        { key: 'Breakouts', emoji: '🙈' }
      ]
    },
    {
      key: 'pain', title: 'Pain and discomfort', mode: 'multi', palette: 'pain',
      tags: [
        { key: 'No pain', emoji: '😌', none: true },
        { key: 'Headache', emoji: '🤕' },
        {
          expander: 'Body pain',
          leaves: [
            { key: 'Abdominal pain', emoji: '😖' },
            { key: 'Lower back pain', emoji: '😵' },
            { key: 'Pelvic pain', emoji: '😩' },
            { key: 'Breast tenderness', emoji: '😞' }
          ]
        },
        { key: 'Pain during sex', emoji: '💥' },
        {
          expander: 'Vaginal discomfort',
          leaves: [
            { key: 'Vaginal itching', emoji: '🪶' },
            { key: 'Vaginal burning', emoji: '🌶️' },
            { key: 'Vaginal dryness', emoji: '🌵' }
          ]
        }
      ]
    },
    {
      key: 'activity', title: 'Physical activity', mode: 'single', palette: 'activity',
      tags: [
        { key: 'activity_level_rest', emoji: '🦥' },
        { key: 'activity_level_light', emoji: '🧘‍♀️' },
        { key: 'activity_level_moderate', emoji: '🚴‍♀️' },
        { key: 'activity_level_intense', emoji: '🏋️‍♀️' }
      ]
    },
    {
      key: 'sex', title: 'Sex', mode: 'single', palette: 'sex',
      tags: [
        { key: 'Protected', emoji: '💚' },
        { key: 'Unprotected', emoji: '🚫', palette: 'sexUnprotected' }
      ]
    },
    {
      key: 'other', title: 'Other', mode: 'multi', palette: 'other',
      tags: [
        { key: 'Travel', emoji: '✈️' },
        { key: 'Stress', emoji: '😵‍💫' },
        { key: 'Alcohol', emoji: '🍷' },
        { key: 'Smoking', emoji: '🚬' }
      ]
    }
  ];

  /* 25 mood cells, row 0 = top (most energy), col 0 = hardest mood.
     [EN name, RU name, EN description, RU description] */
  var MOOD = [
    ['Enraged', 'В ярости', 'Anger is bursting out, impossible to sit still.', 'Злость рвётся наружу, сидеть на месте невозможно.'],
    ['Stressed', 'В стрессе', 'Everything presses at once, can’t stop inside.', 'Всё давит сразу, внутри не получается остановиться.'],
    ['Alert', 'Собранное', 'Clear head, energy to spare.', 'Голова ясная, сил в избытке.'],
    ['Excited', 'Воодушевлённое', 'Eager to act, energy overflowing.', 'Хочется действовать, энергия бьёт через край.'],
    ['Elated', 'Окрылённое', 'A lift, wanting everything at once.', 'Подъём, хочется всего сразу.'],
    ['Frustrated', 'Раздосадованное', 'Everything goes wrong, and it’s maddening.', 'Всё идёт не так, и это злит.'],
    ['Anxious', 'Тревожное', 'Uneasy inside, thoughts won’t let go.', 'Внутри неспокойно, мысли не отпускают.'],
    ['Focused', 'Сосредоточенное', 'Attention holds, energy for your tasks.', 'Внимание держится, на дела сил хватает.'],
    ['Motivated', 'Мотивированное', 'In the mood, with energy to spare for more.', 'Есть настрой и запас сил на большее.'],
    ['Inspired', 'Вдохновлённое', 'Ideas come on their own, easy to act on.', 'Идеи приходят сами, делать их легко.'],
    ['Irritable', 'Раздражённое', 'Every little thing gets to you.', 'Задевает любая мелочь.'],
    ['Worried', 'Обеспокоенное', 'Something’s bothering you, but the day goes on.', 'Что-то беспокоит, но день идёт своим ходом.'],
    ['Calm', 'Спокойное', 'Neither good nor bad — enough for your plans.', 'Ни плохо, ни хорошо — на дела хватает.'],
    ['Hopeful', 'С надеждой', 'Good things ahead, and the energy for them.', 'Впереди видится хорошее, и силы на это есть.'],
    ['Content', 'Довольное', 'Everything’s in place, and that’s enough.', 'Всё на своих местах, и этого достаточно.'],
    ['Restless', 'Беспокойное', 'Unsettled, but no energy either.', 'Не на месте, но и сил нет.'],
    ['Melancholy', 'Меланхоличное', 'Sad and quiet, everything at half strength.', 'Грустно и тихо, всё вполсилы.'],
    ['Relaxed', 'Расслабленное', 'No rush, energy for the essentials only.', 'Спешить некуда, хватает только на необходимое.'],
    ['Serene', 'Безмятежное', 'Calm and good, no extra effort.', 'Спокойно и хорошо, без лишних движений.'],
    ['Peaceful', 'Умиротворённое', 'Quiet joy, no pull anywhere.', 'Тихая радость, никуда не тянет.'],
    ['Despair', 'В отчаянии', 'Everything is hard at once, no energy for anything.', 'Всё разом тяжело, ни на что нет сил.'],
    ['Depressed', 'Подавленное', 'Nothing brings joy, everything is a struggle.', 'Ничего не радует, всё даётся с трудом.'],
    ['Drowsy', 'Сонное', 'Want to lie down, head in a fog.', 'Тянет лечь, голова в тумане.'],
    ['Tranquil', 'Невозмутимое', 'Nothing gets to you, everything passes by.', 'Ничто не задевает, всё проходит мимо.'],
    ['Blissful', 'Блаженное', 'Good and completely calm, no wish to move.', 'Хорошо и совсем спокойно, двигаться не хочется.']
  ];

  function moodColor(row, col) {
    var band = col <= 1 ? 0 : col === 2 ? 1 : 2;
    if (row <= 1) return ['#DD608C', '#FE9F5D', '#FFBF25'][band];
    if (row === 2) return ['#0EAC9B', '#47A747', '#8AA12E'][band];
    return ['#D16CC0', '#AF7BD6', '#8C87E7'][band];
  }

  var CONFETTI_COLORS = ['#E86C61', '#F5BB41', '#4CD7C8', '#CE7FEF', '#8AA12E', '#DD608C'];

  /* -------------------------------------------------------------- factory */

  /* ------------------------------------------------------------ skeleton

     A host can either write the markup itself (the standalone replica does)
     or hand over an empty root and let the component build it, the way
     `calendar`, `trends` and `insights` do. `home` takes the second path. */

  /* English lives in the markup and the key swaps it to Russian — the same
     contract the hand-written replica follows. These are the "today" wordings;
     a past day asks them in the past tense (§5.1). */
  var ROW_Q = {
    flow: ['checklist_q_flow', 'What is my flow today?'],
    log: ['checklist_q_log', 'How is my day going?'],
    mood: ['checklist_q_mood', 'What is my mood today?']
  };
  var ROW_Q_PAST = {
    flow: ['What was my flow?', 'What was my flow?'],
    log: ['How was my day?', 'How was my day?'],
    mood: ['What was my mood?', 'What was my mood?']
  };

  function rowMarkup(key, past) {
    var q = (past ? ROW_Q_PAST : ROW_Q)[key];
    return (
      '<div class="lunel-row" data-item="' + key + '">' +
      '<button type="button" class="lunel-row__btn">' +
      '<span class="lunel-row__check" aria-hidden="true"></span>' +
      '<span class="lunel-body2 lunel-row__q" data-q data-i18n="' + q[0] + '">' +
      q[1] + '</span>' +
      '<span class="lunel-row__label" data-label hidden></span>' +
      '<span class="lunel-row__value" data-value hidden></span>' +
      '<span class="lunel-row__chips" data-chips hidden></span>' +
      '</button>' +
      '</div>'
    );
  }

  function buildSkeleton(root, items, past) {
    var rows = '';
    for (var i = 0; i < items.length; i++) rows += rowMarkup(items[i], past);

    root.innerHTML =
      '<h3 class="lunel-subheader" data-i18n="Checklist">Checklist</h3>' +
      '<div class="lunel-rows" data-rows style="height:' +
      (items.length * 56 + (items.length - 1) * 4) + 'px">' + rows + '</div>' +

      '<div class="lunel-sheet" data-sheet hidden>' +
      '<button type="button" class="lunel-sheet__dismiss" data-sheet-dismiss aria-label="Close"></button>' +
      '<div class="lunel-sheet__panel" data-sheet-panel role="dialog" aria-modal="true">' +
      '<div class="lunel-sheet__grabber" aria-hidden="true"></div>' +
      '<h2 class="lunel-h2 lunel-sheet__title" data-sheet-title></h2>' +
      '<div class="lunel-sheet__body" data-sheet-body>' +

      '<div class="lunel-step lunel-flow" data-step="flow">' +
      '<div class="lunel-result">' +
      '<p class="lunel-body1 lunel-result__title" data-result-title></p>' +
      '<p class="lunel-body4 lunel-result__desc" data-result-desc></p>' +
      '</div>' +
      '<div class="lunel-scale" data-scale role="slider" tabindex="0"' +
      ' aria-valuemin="1" aria-valuemax="4">' +
      '<p class="lunel-scale__cap" data-i18n="Heavier">Heavier</p>' +
      '<div class="lunel-scale__col" data-scale-col>' +
      '<span class="lunel-scale__thumb" data-scale-thumb></span>' +
      '</div>' +
      '<p class="lunel-scale__cap" data-i18n="Lighter">Lighter</p>' +
      '</div>' +
      '</div>' +

      '<div class="lunel-step lunel-log" data-step="log"><div data-log></div></div>' +

      '<div class="lunel-step lunel-mood" data-step="mood">' +
      '<div class="lunel-result lunel-mood__result">' +
      '<p class="lunel-body1 lunel-result__title" data-mood-title></p>' +
      '<p class="lunel-caption2 lunel-result__levels" data-mood-levels></p>' +
      '<p class="lunel-body4 lunel-result__desc" data-mood-desc></p>' +
      '</div>' +
      '<div class="lunel-grid-block">' +
      '<p class="lunel-grid-cap" data-i18n="High energy">High energy</p>' +
      '<div class="lunel-grid-row">' +
      '<p class="lunel-grid-cap lunel-grid-cap--left" data-i18n="Negative mood">Negative mood</p>' +
      '<div class="lunel-grid" data-grid tabindex="0" role="application">' +
      '<span class="lunel-grid__sel" data-grid-sel></span>' +
      '</div>' +
      '<p class="lunel-grid-cap lunel-grid-cap--right" data-i18n="Positive mood">Positive mood</p>' +
      '</div>' +
      '<p class="lunel-grid-cap" data-i18n="Low energy">Low energy</p>' +
      '</div>' +
      '</div>' +

      '</div>' +
      '<div class="lunel-sheet__bar">' +
      '<button type="button" class="lunel-cta" data-sheet-next></button>' +
      '<button type="button" class="lunel-ghost-large" data-sheet-ghost></button>' +
      '</div>' +
      '</div>' +
      '</div>' +

      '<div class="lunel-toast" data-toast hidden>' +
      '<p class="lunel-toast__title" data-toast-title></p>' +
      '<p class="lunel-toast__msg" data-toast-msg></p>' +
      '</div>' +
      '<div class="lunel-confetti" data-confetti aria-hidden="true"></div>';
  }

  L.define('checklist', function (root) {
    var screen = root.closest ? root.closest('.lunel-screen') : null;
    var host = screen || root;
    var lang = L.i18n.langOf(root);

    /* Flow only exists during the period; outside it the checklist has two
       items (§5.1). The host says which day it is showing. */
    var ITEMS = root.hasAttribute('data-period')
      ? ['flow', 'log', 'mood']
      : ['log', 'mood'];

    if (!root.querySelector('[data-rows]')) {
      buildSkeleton(root, ITEMS, root.hasAttribute('data-past'));
    }

    /* Шторка, тост и конфетти — слои ЭКРАНА, а не блока в колонке. Когда
       чек-лист стоит внутри прокручиваемой главной, его собственный блок
       уезжает вместе с контентом, и шторка с `inset: 0` считает себя от
       колонки: она оказывалась на 1200 pt выше кадра. Поэтому переносим их
       к экрану, если он есть. */
    if (screen) {
      ['[data-sheet]', '[data-toast]', '[data-confetti]'].forEach(function (sel) {
        var node = root.querySelector(sel);
        if (node && node.parentNode !== screen) screen.appendChild(node);
      });
    }

    var rowsEl = root.querySelector('[data-rows]');
    var rowEls = {};
    ITEMS.forEach(function (key) {
      rowEls[key] = rowsEl.querySelector('[data-item="' + key + '"]');
    });

    var state = {
      flow: null,       /* index into FLOW */
      log: null,        /* array of {key, emoji} */
      mood: null,       /* {row, col} */
      visited: {},
      step: null,
      open: false,
      draftFlow: 1,     /* the scale starts on Moderate */
      draftLog: {},
      draftMood: { row: 2, col: 2 } /* Calm — pressing Done without touching records Calm */
    };

    /* ------------------------------------------------------------ sheet */

    /* Слои экрана ищем и в своём корне, и в экране: выше они могли уехать
       туда, чтобы не зависеть от прокрутки колонки. */
    function layer(sel) { return root.querySelector(sel) || (screen && screen.querySelector(sel)); }

    var sheet = layer('[data-sheet]');
    var panel = sheet.querySelector('[data-sheet-panel]');
    var titleEl = sheet.querySelector('[data-sheet-title]');
    var bodyEl = sheet.querySelector('[data-sheet-body]');
    var nextBtn = sheet.querySelector('[data-sheet-next]');
    var ghostBtn = sheet.querySelector('[data-sheet-ghost]');
    var barEl = sheet.querySelector('.lunel-sheet__bar');
    var dismissEl = sheet.querySelector('[data-sheet-dismiss]');
    var page = host.querySelector('[data-page]');
    var toast = layer('[data-toast]');
    var confetti = layer('[data-confetti]');
    var lastFocus = null;

    /* STEPS is the order the sheet walks — it follows ITEMS, so outside the
       period it skips Flow. The flow *markup* is always present, so the step
       wiring below can stay unconditional. */
    var STEPS = ITEMS;
    var stepEls = {};
    ['flow', 'log', 'mood'].forEach(function (key) {
      stepEls[key] = bodyEl.querySelector('[data-step="' + key + '"]');
    });

    /* --------------------------------------------------- step 1: flow */

    var scaleEl = stepEls.flow.querySelector('[data-scale]');
    var scaleCol = scaleEl.querySelector('[data-scale-col]');
    var scaleThumb = scaleEl.querySelector('[data-scale-thumb]');
    var scaleDots = [];
    var flowResult = {
      title: stepEls.flow.querySelector('[data-result-title]'),
      desc: stepEls.flow.querySelector('[data-result-desc]')
    };

    function scaleY(index) {
      /* BleedingVerticalScale: a 204pt column, stops 60 apart, the lightest 12
         above its bottom edge (58 apart on the simulator under the sheet's
         0.958 scale). Index 0 = bottom. */
      return 192 - index * 60;
    }

    function buildScale() {
      for (var i = 0; i < 4; i++) {
        var dot = document.createElement('span');
        dot.className = 'lunel-scale__dot';
        dot.style.top = scaleY(i) + 'px';
        scaleCol.insertBefore(dot, scaleThumb);
        scaleDots.push(dot);
      }
    }

    function renderFlow() {
      var level = FLOW[state.draftFlow];
      scaleEl.style.setProperty('--scale-color', level.color);
      scaleThumb.style.transform = 'translateY(' + scaleY(state.draftFlow) + 'px)';
      for (var i = 0; i < scaleDots.length; i++) {
        scaleDots[i].style.opacity = i === state.draftFlow ? '0' : '0.5';
      }
      flowResult.title.textContent = L.i18n.t('flow_' + level.key, lang, []);
      flowResult.title.style.setProperty('--result-color', level.color);
      flowResult.desc.textContent = L.i18n.t('flow_' + level.key + '_desc', lang, []);
      scaleEl.setAttribute('aria-valuenow', String(state.draftFlow + 1));
      scaleEl.setAttribute(
        'aria-valuetext',
        flowResult.title.textContent + '. ' + flowResult.desc.textContent
      );
    }

    function flowFromPointer(event) {
      var rect = scaleCol.getBoundingClientRect();
      var scale = rect.height / 204 || 1;
      var y = (event.clientY - rect.top) / scale;
      var index = Math.round((204 - 12 - y) / 60);
      var next = U.clamp(index, 0, 3);
      if (next !== state.draftFlow) {
        state.draftFlow = next;
        renderFlow();
      }
    }

    var scaleDragging = false;
    scaleEl.addEventListener('pointerdown', function (event) {
      scaleDragging = true;
      scaleEl.setPointerCapture(event.pointerId);
      scaleEl.focus({ preventScroll: true });
      flowFromPointer(event);
    });
    scaleEl.addEventListener('pointermove', function (event) {
      if (scaleDragging) flowFromPointer(event);
    });
    scaleEl.addEventListener('pointerup', function () { scaleDragging = false; });
    scaleEl.addEventListener('pointercancel', function () { scaleDragging = false; });
    scaleEl.addEventListener('keydown', function (event) {
      var delta = 0;
      if (event.key === 'ArrowUp' || event.key === 'ArrowRight') delta = 1;
      else if (event.key === 'ArrowDown' || event.key === 'ArrowLeft') delta = -1;
      else if (event.key === 'Home') delta = -4;
      else if (event.key === 'End') delta = 4;
      else return;
      state.draftFlow = U.clamp(state.draftFlow + delta, 0, 3);
      renderFlow();
      event.preventDefault();
    });

    /* ----------------------------------------------- step 2: daily log */

    var logEl = stepEls.log.querySelector('[data-log]');

    function tagPalette(group, tag) {
      return PALETTE[tag.palette || group.palette];
    }

    function makePill(group, tag) {
      var pill = document.createElement('button');
      pill.type = 'button';
      pill.className = 'lunel-pill';
      pill.setAttribute('aria-pressed', 'false');
      pill.setAttribute('data-tag', tag.key);
      var palette = tagPalette(group, tag);
      pill.style.setProperty('--tag-tint', palette.tint);
      pill.style.setProperty('--tag-dark', palette.dark);
      var emoji = document.createElement('span');
      emoji.className = 'lunel-pill__emoji';
      emoji.setAttribute('aria-hidden', 'true');
      emoji.textContent = tag.emoji;
      var label = document.createElement('span');
      label.setAttribute('data-pill-label', tag.key);
      label.textContent = L.i18n.t(tag.key, lang, []);
      pill.appendChild(emoji);
      pill.appendChild(label);
      pill.addEventListener('click', function () { toggleTag(group, tag, pill); });
      return pill;
    }

    function makeExpander(group, entry, container) {
      var pill = document.createElement('button');
      pill.type = 'button';
      pill.className = 'lunel-pill lunel-pill--more';
      var label = document.createElement('span');
      label.setAttribute('data-pill-label', entry.expander);
      label.textContent = L.i18n.t(entry.expander, lang, []);
      pill.appendChild(label);
      pill.insertAdjacentHTML(
        'beforeend',
        '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.4 8 H13.6 M8 1 V15"/></svg>'
      );
      pill.addEventListener('click', function () {
        /* the expander is replaced in place by its leaves and disappears */
        var frag = document.createDocumentFragment();
        entry.leaves.forEach(function (leaf) { frag.appendChild(makePill(group, leaf)); });
        container.replaceChild(frag, pill);
      });
      return pill;
    }

    function buildLog() {
      var inPeriod = root.hasAttribute('data-period');
      GROUPS.forEach(function (group) {
        /* «Месячные» — только вне месячных, «Выделения» прячутся в дни
           месячных: ровно так расставлены условия в DailyLogEditorView. */
        if (group.outsidePeriodOnly && inPeriod) return;
        if (group.hiddenOnPeriod && inPeriod) return;
        var wrap = document.createElement('div');
        wrap.className = 'lunel-log__group';
        var sub = document.createElement('div');
        sub.className = 'lunel-log__sub';
        sub.setAttribute('data-group-title', group.title);
        sub.textContent = L.i18n.t(group.title, lang, []);
        var pills = document.createElement('div');
        pills.className = 'lunel-pills';
        pills.setAttribute('role', 'group');
        group.tags.forEach(function (entry) {
          if (entry.expander) pills.appendChild(makeExpander(group, entry, pills));
          else pills.appendChild(makePill(group, entry));
        });
        wrap.appendChild(sub);
        wrap.appendChild(pills);
        logEl.appendChild(wrap);
      });
      /* DailyLogEditorView: «I don't want to log» is the list's last row, not
         a bottom-bar button — the bar only appears once a tag is picked. */
      var decline = document.createElement('button');
      decline.type = 'button';
      decline.className = 'lunel-ghost-large lunel-log__decline';
      decline.setAttribute('data-group-title', "I don't want to log");
      decline.textContent = L.i18n.t("I don't want to log", lang, []);
      decline.addEventListener('click', function () {
        commitStep('log', true);
        var next = nextStep('log');
        if (next) showStep(next);
        else closeSheet(true);
      });
      logEl.appendChild(decline);
    }

    function toggleTag(group, tag, pill) {
      var on = pill.getAttribute('aria-pressed') === 'true';
      var siblings = pill.parentNode.querySelectorAll('[data-tag]');
      if (!on) {
        if (group.mode === 'single' || tag.none) {
          /* single-choice groups, and "No …" which is exclusive both ways */
          for (var i = 0; i < siblings.length; i++) {
            siblings[i].setAttribute('aria-pressed', 'false');
            delete state.draftLog[siblings[i].getAttribute('data-tag')];
          }
        } else {
          for (var j = 0; j < siblings.length; j++) {
            var key = siblings[j].getAttribute('data-tag');
            var meta = findTag(group, key);
            if (meta && meta.none) {
              siblings[j].setAttribute('aria-pressed', 'false');
              delete state.draftLog[key];
            }
          }
        }
      }
      pill.setAttribute('aria-pressed', String(!on));
      if (on) delete state.draftLog[tag.key];
      else state.draftLog[tag.key] = tag.emoji;
      updateSheetButtons();
    }

    function findTag(group, key) {
      var found = null;
      group.tags.forEach(function (entry) {
        if (entry.expander) {
          entry.leaves.forEach(function (leaf) { if (leaf.key === key) found = leaf; });
        } else if (entry.key === key) {
          found = entry;
        }
      });
      return found;
    }

    /* ---------------------------------------------------- step 3: mood */

    var gridEl = stepEls.mood.querySelector('[data-grid]');
    var gridSel = gridEl.querySelector('[data-grid-sel]');
    var gridDots = [];
    var moodResult = {
      title: stepEls.mood.querySelector('[data-mood-title]'),
      levels: stepEls.mood.querySelector('[data-mood-levels]'),
      desc: stepEls.mood.querySelector('[data-mood-desc]')
    };
    var CELL = 24;
    var GAP = 36;
    var PITCH = CELL + GAP; /* 60 */

    function cellXY(row, col) {
      return { x: CELL / 2 + col * PITCH, y: CELL / 2 + row * PITCH };
    }

    function buildGrid() {
      for (var row = 0; row < 5; row++) {
        for (var col = 0; col < 5; col++) {
          var dot = document.createElement('span');
          dot.className = 'lunel-grid__dot';
          var p = cellXY(row, col);
          dot.style.left = p.x + 'px';
          dot.style.top = p.y + 'px';
          gridEl.insertBefore(dot, gridSel);
          gridDots.push({ el: dot, row: row, col: col });
        }
      }
    }

    function moodIndex(row, col) { return row * 5 + col; }

    /* MoodField's selection circle rides a DisplayLinkSpringState (response
       0.45, damping 0.65): every frame it is pulled toward its target, which
       while dragging is the active cell's centre plus a rubber band toward
       the finger, and on release the centre itself. */
    var SEL_W = 2 * Math.PI / 0.45;
    var SEL_Z = 0.65;
    var selPos = null;
    var selVel = { x: 0, y: 0 };
    var selTarget = null;
    var selRaf = 0;
    var selLast = 0;

    function paintSel() {
      gridSel.style.transform = 'translate(' + selPos.x + 'px, ' + selPos.y + 'px)';
    }

    function selSnap(p) {
      selPos = { x: p.x, y: p.y };
      selVel = { x: 0, y: 0 };
      selTarget = { x: p.x, y: p.y };
      if (selRaf) { cancelAnimationFrame(selRaf); selRaf = 0; }
      paintSel();
    }

    function selTick(t) {
      var dt = selLast ? Math.min((t - selLast) / 1000, 1 / 30) : 1 / 60;
      selLast = t;
      ['x', 'y'].forEach(function (k) {
        var d = selPos[k] - selTarget[k];
        var a = -2 * SEL_Z * SEL_W * selVel[k] - SEL_W * SEL_W * d;
        selVel[k] += a * dt;
        selPos[k] += selVel[k] * dt;
      });
      paintSel();
      var dist = Math.abs(selPos.x - selTarget.x) + Math.abs(selPos.y - selTarget.y);
      if (dist < 0.2 && Math.abs(selVel.x) + Math.abs(selVel.y) < 1) {
        selSnap(selTarget);
        return;
      }
      selRaf = requestAnimationFrame(selTick);
    }

    function selTo(p) {
      if (!selPos || L.motion.reduced() || !sheet || sheet.hidden) { selSnap(p); return; }
      selTarget = { x: p.x, y: p.y };
      if (!selRaf) { selLast = 0; selRaf = requestAnimationFrame(selTick); }
    }

    /* MoodField.rubberBand: the circle leans toward the finger but never
       more than about half a cell away from the centre. */
    function rubber(d) {
      return d * 0.45 / (1 + Math.abs(d) / PITCH * 0.9);
    }

    function renderMood(keepSel) {
      var row = state.draftMood.row;
      var col = state.draftMood.col;
      var color = moodColor(row, col);
      var cell = MOOD[moodIndex(row, col)];
      var p = cellXY(row, col);
      gridEl.style.setProperty('--mood-color', color);
      if (!keepSel) selTo(p);
      for (var i = 0; i < gridDots.length; i++) {
        var d = gridDots[i];
        if (d.row === row || d.col === col) d.el.setAttribute('data-lit', '');
        else d.el.removeAttribute('data-lit');
      }
      moodResult.title.textContent = lang === 'ru' ? cell[1] : cell[0];
      moodResult.title.style.setProperty('--mood-color', color);
      moodResult.levels.textContent =
        L.i18n.t('mood_level_' + (col + 1), lang, []) + ' · ' +
        L.i18n.t('energy_inline_' + (5 - row), lang, []);
      moodResult.desc.textContent = lang === 'ru' ? cell[3] : cell[2];
      gridEl.setAttribute('aria-valuetext',
        moodResult.title.textContent + '. ' + moodResult.levels.textContent);
    }

    function fingerIn(event) {
      var rect = gridEl.getBoundingClientRect();
      var scale = rect.width / 264 || 1;
      return { x: (event.clientX - rect.left) / scale, y: (event.clientY - rect.top) / scale };
    }

    function nearestCell(f) {
      return {
        col: U.clamp(Math.round((f.x - CELL / 2) / PITCH), 0, 4),
        row: U.clamp(Math.round((f.y - CELL / 2) / PITCH), 0, 4)
      };
    }

    function setCell(row, col) {
      if (row === state.draftMood.row && col === state.draftMood.col) return;
      state.draftMood = { row: row, col: col };
      renderMood(true);
    }

    /* MoodField's DragGesture: the touch lands on the cell under the finger;
       from there the active cell steps by one whenever the finger is more
       than half a pitch from its centre; the circle follows with the rubber
       band and grows to 1.25 while held. */
    function moodDrag(event) {
      var f = fingerIn(event);
      var c = cellXY(state.draftMood.row, state.draftMood.col);
      var row = state.draftMood.row;
      var col = state.draftMood.col;
      var cdy = (f.y - c.y) / PITCH;
      var cdx = (f.x - c.x) / PITCH;
      if (cdy > 0.5 && row < 4) row += 1; else if (cdy < -0.5 && row > 0) row -= 1;
      if (cdx > 0.5 && col < 4) col += 1; else if (cdx < -0.5 && col > 0) col -= 1;
      setCell(row, col);
      var centre = cellXY(state.draftMood.row, state.draftMood.col);
      selTo({ x: centre.x + rubber(f.x - centre.x), y: centre.y + rubber(f.y - centre.y) });
    }

    var gridDragging = false;
    gridEl.addEventListener('pointerdown', function (event) {
      gridDragging = true;
      gridEl.setPointerCapture(event.pointerId);
      gridEl.focus({ preventScroll: true });
      gridSel.setAttribute('data-drag', '');
      var n = nearestCell(fingerIn(event));
      setCell(n.row, n.col);
      moodDrag(event);
    });
    gridEl.addEventListener('pointermove', function (event) {
      if (gridDragging) moodDrag(event);
    });
    function gridRelease() {
      if (!gridDragging) return;
      gridDragging = false;
      gridSel.removeAttribute('data-drag');
      selTo(cellXY(state.draftMood.row, state.draftMood.col));
    }
    gridEl.addEventListener('pointerup', gridRelease);
    gridEl.addEventListener('pointercancel', gridRelease);
    gridEl.addEventListener('keydown', function (event) {
      var row = state.draftMood.row;
      var col = state.draftMood.col;
      if (event.key === 'ArrowUp') row -= 1;
      else if (event.key === 'ArrowDown') row += 1;
      else if (event.key === 'ArrowLeft') col -= 1;
      else if (event.key === 'ArrowRight') col += 1;
      else return;
      state.draftMood = { row: U.clamp(row, 0, 4), col: U.clamp(col, 0, 4) };
      renderMood();
      event.preventDefault();
    });

    /* ------------------------------------------------------ sheet flow */

    function stepTitleKey(step) {
      return step === 'flow' ? 'Flow' : step === 'log' ? 'Daily log' : 'Mood';
    }

    function measurePanel() {
      /* The panel is a fixed, over-tall surface; the visible top edge is set
         by translateY, so "morphing the height" is a transform. */
      var max = 0;
      STEPS.forEach(function (key) {
        var el = stepEls[key];
        var prev = el.style.cssText;
        el.style.cssText = prev + ';position:static;opacity:0;pointer-events:none;display:block;';
        max = Math.max(max, el.scrollHeight);
        el.style.cssText = prev;
      });
      return max;
    }

    var stepHeights = {};

    function panelHeightFor(step) {
      /* The daily log is a fixed detent, symptomsFraction 0.82 of the
         largest: on the simulator it stands from 222 to 865, i.e. 671 here. */
      if (step === 'log') return 671;
      if (stepHeights[step]) return stepHeights[step];
      var el = stepEls[step];
      var prev = el.getAttribute('style') || '';
      el.setAttribute('style', prev + ';position:static;opacity:0;pointer-events:none;');
      var content = el.scrollHeight;
      el.setAttribute('style', prev);
      /* grabber 16 + title block 52 + content + bottom bar room */
      var h = 16 + 52 + content + 173;
      /* Потолок — 656 в масштабе раскладки: на симуляторе iPhone 17
         «Выделения» стоят от 236,7 до 865, то есть 628,3 видимых, а шторка
         нарисована в 0,958 (--lunel-sheet-scale). Длинное содержимое
         прокручивается внутри, панель выше не поднимается. */
      stepHeights[step] = U.clamp(h, 320, 656);
      return stepHeights[step];
    }

    function showStep(step) {
      state.step = step;
      STEPS.forEach(function (key) {
        if (key === step) stepEls[key].setAttribute('data-active', '');
        else stepEls[key].removeAttribute('data-active');
      });
      titleEl.textContent = L.i18n.t(stepTitleKey(step), lang, []);
      titleEl.setAttribute('data-sheet-title', stepTitleKey(step));
      var max = parseFloat(getComputedStyle(panel).getPropertyValue('--sheet-max')) || 620;
      var h = panelHeightFor(step);
      panel.style.setProperty('--sheet-h', h + 'px');
      void max;
      state.visited[step] = true;
      updateSheetButtons();
      /* Фокус мы ставим сами, пользователь клавиатуры его не просил —
         помечаем, чтобы не рисовать кольцо фокуса (так же делает кольцо цикла). */
      var focusable = stepEls[step].querySelector('[tabindex], button');
      if (focusable) {
        focusable.setAttribute('data-pointer-focus', '');
        focusable.focus({ preventScroll: true });
      }
    }

    /* Continue goes to the next UNFILLED, UNVISITED step, wrapping round. */
    function nextStep(from) {
      var start = STEPS.indexOf(from);
      for (var i = 1; i <= STEPS.length; i++) {
        var key = STEPS[(start + i) % STEPS.length];
        if (!isFilled(key) && !state.visited[key]) return key;
      }
      return null;
    }

    function isFilled(key) {
      if (key === 'flow') return state.flow !== null;
      if (key === 'log') return state.log !== null;
      return state.mood !== null;
    }

    function updateSheetButtons() {
      var step = state.step;
      var isLast = nextStep(step) === null;
      nextBtn.textContent = L.i18n.t(isLast ? 'Done' : 'Continue', lang, []);
      nextBtn.setAttribute('data-cta-key', isLast ? 'Done' : 'Continue');
      /* Daily log: Continue only appears once at least one tag is picked */
      barEl.hidden = false;
      if (step === 'log') {
        var any = Object.keys(state.draftLog).length > 0;
        nextBtn.hidden = !any;
        ghostBtn.hidden = true;
        barEl.hidden = !any;
      } else if (step === 'flow') {
        nextBtn.hidden = false;
        ghostBtn.hidden = false;
        ghostBtn.textContent = L.i18n.t('Period ended', lang, []);
        ghostBtn.setAttribute('data-ghost-key', 'Period ended');
      } else {
        nextBtn.hidden = false;
        ghostBtn.hidden = true;
      }
    }

    function commitStep(step, skipped) {
      if (step === 'flow') state.flow = state.draftFlow;
      else if (step === 'log') state.log = skipped ? [] : collectLog();
      else state.mood = { row: state.draftMood.row, col: state.draftMood.col };
      renderRows();
    }

    function collectLog() {
      var out = [];
      for (var key in state.draftLog) {
        if (Object.prototype.hasOwnProperty.call(state.draftLog, key)) {
          out.push({ key: key, emoji: state.draftLog[key] });
        }
      }
      return out;
    }

    nextBtn.addEventListener('click', function () {
      var step = state.step;
      commitStep(step, false);
      var next = nextStep(step);
      if (next) showStep(next);
      else closeSheet(true);
    });

    ghostBtn.addEventListener('click', function () {
      var step = state.step;
      if (step === 'log') {
        commitStep('log', true);
        var next = nextStep('log');
        if (next) showStep(next);
        else closeSheet(true);
      }
      /* "Period ended" is a real write in the app; here it just advances. */
      else if (step === 'flow') {
        commitStep('flow', false);
        var n2 = nextStep('flow');
        if (n2) showStep(n2);
        else closeSheet(true);
      }
    });

    /* Each shrinking block scales about the same screen point (the middle of
       the screen, just under the status bar), so the blocks keep their
       places relative to each other while the header stays untouched. */
    function aimDimScale() {
      var screenEl = page.closest('.lunel-screen');
      if (!screenEl) return;
      var sr = screenEl.getBoundingClientRect();
      var k = sr.width / (screenEl.offsetWidth || sr.width) || 1;
      var top = parseFloat(getComputedStyle(screenEl).getPropertyValue('--lunel-safe-top')) || 62;
      page.querySelectorAll('[data-dim-scale]').forEach(function (el) {
        var r = el.getBoundingClientRect();
        var ox = (sr.left + sr.width / 2 - r.left) / k;
        var oy = (sr.top + top * k - r.top) / k;
        el.style.transformOrigin = ox + 'px ' + oy + 'px';
      });
    }

    function openSheet(step) {
      if (state.open) { showStep(step); return; }
      lastFocus = document.activeElement;
      state.open = true;
      state.visited = {};
      sheet.hidden = false;
      sheet.setAttribute('data-entering', '');
      panel.style.setProperty('--sheet-max', '671px');
      if (page) {
        aimDimScale();
        page.setAttribute('data-dimmed', '');
      }
      /* Стартовое положение должно примениться до того, как мы его снимем,
         иначе перехода не будет. Раньше это делали через два requestAnimationFrame
         — и шторка не открывалась вовсе, когда вкладка в фоне: кадры там не
         приходят. Синхронный рефлоу надёжнее и ни от чего не зависит. */
      void panel.offsetHeight;
      sheet.removeAttribute('data-entering');
      showStep(step);
    }

    function closeSheet(completed) {
      if (!state.open) return;
      state.open = false;
      sheet.setAttribute('data-leaving', '');
      if (page) page.removeAttribute('data-dimmed');
      var done = function () {
        sheet.hidden = true;
        sheet.removeAttribute('data-leaving');
      };
      if (L.motion.reduced()) done();
      else setTimeout(done, 420);
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
      if (completed && isFilled('flow') && isFilled('log') && isFilled('mood')) {
        fireToast();
      }
    }

    dismissEl.addEventListener('click', function () { closeSheet(false); });
    sheet.addEventListener('keydown', function (event) {
      var active = document.activeElement;
      if (active && active.removeAttribute) active.removeAttribute('data-pointer-focus');
      if (event.key === 'Escape') {
        closeSheet(false);
        event.preventDefault();
        return;
      }
      if (event.key !== 'Tab') return;
      var focusables = panel.querySelectorAll(
        'button:not([hidden]):not([disabled]), [tabindex="0"]'
      );
      var list = [];
      for (var i = 0; i < focusables.length; i++) {
        if (focusables[i].offsetParent !== null) list.push(focusables[i]);
      }
      if (!list.length) return;
      var first = list[0];
      var last = list[list.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        last.focus({ preventScroll: true });
        event.preventDefault();
      } else if (!event.shiftKey && document.activeElement === last) {
        first.focus({ preventScroll: true });
        event.preventDefault();
      }
    });

    /* ------------------------------------------------------------ rows */

    function rowValue(key) {
      if (key === 'flow') return L.i18n.t('flow_' + FLOW[state.flow].key, lang, []);
      if (key === 'mood') {
        var cell = MOOD[moodIndex(state.mood.row, state.mood.col)];
        return lang === 'ru' ? cell[1] : cell[0];
      }
      return '';
    }

    function renderRows() {
      var order = [];
      ITEMS.forEach(function (key) {
        if (!isFilled(key)) order.push(key);
      });
      ITEMS.forEach(function (key) {
        if (isFilled(key)) order.push(key);
      });

      order.forEach(function (key, index) {
        var row = rowEls[key];
        row.style.transform = 'translateY(' + index * 60 + 'px)';
        var filled = isFilled(key);
        var q = row.querySelector('[data-q]');
        var label = row.querySelector('[data-label]');
        var value = row.querySelector('[data-value]');
        var chips = row.querySelector('[data-chips]');
        if (!filled) {
          row.removeAttribute('data-filled');
          q.hidden = false;
          label.hidden = true;
          value.hidden = true;
          if (chips) chips.hidden = true;
          return;
        }
        row.setAttribute('data-filled', '');
        q.hidden = true;
        label.hidden = false;
        label.textContent = L.i18n.t(
          key === 'flow' ? 'Flow:' : key === 'log' ? 'Daily log:' : 'Mood:', lang, []
        );
        if (key === 'log') {
          value.hidden = true;
          chips.hidden = false;
          renderChips(chips);
        } else {
          value.hidden = false;
          value.textContent = rowValue(key);
          if (chips) chips.hidden = true;
        }
      });
    }

    function renderChips(container) {
      container.textContent = '';
      var picks = state.log || [];
      if (!picks.length) {
        var skipped = document.createElement('span');
        skipped.className = 'lunel-row__value';
        skipped.textContent = L.i18n.t('Skipped today', lang, []);
        container.appendChild(skipped);
        return;
      }
      var shown = picks.slice(0, 4);
      shown.forEach(function (pick) {
        var chip = document.createElement('span');
        chip.className = 'lunel-chip';
        chip.textContent = pick.emoji;
        container.appendChild(chip);
      });
      if (picks.length > 4) {
        var more = document.createElement('span');
        more.className = 'lunel-chip lunel-chip--more';
        more.textContent = '+' + (picks.length - 4);
        container.appendChild(more);
      }
    }

    ITEMS.forEach(function (key) {
      rowEls[key].querySelector('.lunel-row__btn').addEventListener('click', function () {
        openSheet(key);
      });
    });

    /* ----------------------------------------------------------- toast */

    var toastTimer = null;

    /* Текст тоста отдельно от показа: он может висеть на экране (dwell 0),
       и тогда переключение языка обязано его переписать — иначе на русской
       странице остаётся английский тост. */
    function renderToastText() {
      var title = toast.querySelector('[data-toast-title]');
      title.innerHTML = '';
      title.appendChild(document.createTextNode(L.i18n.t('Great job!', lang, []) + ' '));
      var party = document.createElement('span');
      party.className = 'lunel-toast__party';
      party.textContent = '🎉';
      title.appendChild(party);
      /* Two real toasts share this slot: the everyday one confirms the save,
         and the "New in Trends" one fires when the save unlocked a block.
         `data-toast` on the host picks which this replica shows. */
      toast.querySelector('[data-toast-msg]').textContent = L.i18n.t(
        root.getAttribute('data-toast-kind') === 'trends'
          ? 'New in Trends: Insights'
          : 'Added to your statistics. The more you log, the better Lunel understands you',
        lang, []
      );
    }

    function fireToast() {
      toast.hidden = false;
      renderToastText();
      /* Тот же случай, что и со шторкой: кадр анимации в фоновой вкладке
         не приходит, и тост так и оставался невидимым. Рефлоу надёжнее. */
      void toast.offsetHeight;
      toast.setAttribute('data-on', '');
      popConfetti();
      clearTimeout(toastTimer);
      /* an update toast dwells 6 s, not 3 */
      var dwell = root.getAttribute('data-toast-dwell');
      /* 0 — тост остаётся на экране: каталог показывает состояние, а не
         проигрывает сценарий. (Заодно headless-съёмка перематывает таймеры,
         и шестисекундный тост исчезал раньше кадра.) */
      if (dwell !== '0') toastTimer = setTimeout(hideToast, dwell ? +dwell : 6000);
      root.dispatchEvent(new CustomEvent('lunel:checklist-done', { bubbles: true }));
    }

    function hideToast() {
      toast.removeAttribute('data-on');
      clearTimeout(toastTimer);
      setTimeout(function () { toast.hidden = true; }, 300);
    }

    toast.addEventListener('click', function () {
      hideToast();
      root.dispatchEvent(new CustomEvent('lunel:toast-tap', { bubbles: true }));
    });

    function popConfetti() {
      if (L.motion.reduced() || !confetti.animate) return;
      confetti.textContent = '';
      for (var i = 0; i < 50; i++) {
        var piece = document.createElement('i');
        piece.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
        confetti.appendChild(piece);
        var angle = (i / 50) * Math.PI * 2;
        var radius = 220 * (0.45 + Math.random() * 0.55);
        piece.animate(
          [
            { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
            {
              transform:
                'translate(' + Math.cos(angle) * radius + 'px, ' +
                (Math.sin(angle) * radius + 120) + 'px) rotate(' +
                (Math.random() * 720 - 360) + 'deg)',
              opacity: 0
            }
          ],
          { duration: 1200 + Math.random() * 600, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'forwards' }
        );
      }
      setTimeout(function () { confetti.textContent = ''; }, 2000);
    }

    /* ------------------------------------------------------------ i18n */

    function relabel() {
      lang = L.i18n.langOf(root);
      /* the static questions carry data-i18n and are handled by core;
         everything built by JS is relabelled here */
      logEl.querySelectorAll('[data-pill-label]').forEach(function (el) {
        el.textContent = L.i18n.t(el.getAttribute('data-pill-label'), lang, []);
      });
      logEl.querySelectorAll('[data-group-title]').forEach(function (el) {
        el.textContent = L.i18n.t(el.getAttribute('data-group-title'), lang, []);
      });
      if (state.step) {
        titleEl.textContent = L.i18n.t(stepTitleKey(state.step), lang, []);
        updateSheetButtons();
      }
      renderFlow();
      renderMood();
      renderRows();
      if (!toast.hidden) renderToastText();
    }

    root.addEventListener('lunel:lang', relabel);

    /* ------------------------------------------------------------ boot */

    buildScale();
    buildLog();
    buildGrid();
    renderFlow();
    renderMood();

    /* Canned starting state. `empty` is the live screen a user meets; the
       catalog also needs the half-filled and finished days the case shows,
       and the moment right after the last item is answered, when the toast
       and the confetti are on screen. */
    (function seed() {
      var fill = root.getAttribute('data-fill') || 'empty';
      if (fill === 'empty') return;

      /* `log-mood`: the app's newUser day — Daily log with one tag
         (Sleepiness) and Mood Calm filled, Flow still open. */
      if (fill === 'log-mood') {
        state.log = [{ key: 'Sleepiness', emoji: '🥱' }];
        state.mood = { row: 2, col: 2 };
        renderRows();
        return;
      }

      /* Melancholy — row 3, col 1 — is the value the case screenshots show. */
      state.mood = { row: 3, col: 1 };
      if (fill === 'partial') { renderRows(); return; }

      if (ITEMS.indexOf('flow') >= 0) state.flow = 3; /* Very heavy */
      state.log = [
        { key: 'Insomnia', emoji: '🦉' },
        { key: 'Breakouts', emoji: '🙈' },
        { key: 'Alcohol', emoji: '🍷' },
        { key: 'Travel', emoji: '✈️' }
      ];
      renderRows();
      if (root.hasAttribute('data-toast-kind')) fireToast();
    })();

    renderRows();
    void measurePanel;

    return {
      open: function (step) { openSheet(step || 'flow'); },
      /* state of the mood circle's spring — for tests (lunel/state.html) */
      get moodCircle() {
        return { pos: selPos, target: selTarget, running: !!selRaf, cell: state.draftMood };
      },
      close: function () { closeSheet(false); },
      advance: function () { nextBtn.click(); },
      setFlow: function (index) { state.draftFlow = U.clamp(index, 0, 3); renderFlow(); },
      setMood: function (row, col) {
        state.draftMood = { row: U.clamp(row, 0, 4), col: U.clamp(col, 0, 4) };
        renderMood();
      },
      pickTags: function (keys) {
        keys.forEach(function (key) {
          var pill = logEl.querySelector('[data-tag="' + key + '"]');
          if (pill && pill.getAttribute('aria-pressed') !== 'true') pill.click();
        });
      },
      hideToast: hideToast,
      get step() { return state.step; },
      reset: function () {
        state.flow = state.log = state.mood = null;
        state.draftLog = {};
        state.draftFlow = 1;
        state.draftMood = { row: 2, col: 2 };
        logEl.querySelectorAll('[data-tag]').forEach(function (p) {
          p.setAttribute('aria-pressed', 'false');
        });
        hideToast();
        closeSheet(false);
        renderFlow();
        renderMood();
        renderRows();
      }
    };
  });
})();
