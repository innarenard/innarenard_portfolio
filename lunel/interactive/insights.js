/* ==========================================================================
   Lunel interactive replicas — AI insights
   --------------------------------------------------------------------------
   The six-card grid (AIInsightStoriesSectionView) and the "Your week" modal
   (WeeklySummarySheet), both with their honest low-data states.

   Product rule carried over (§6.1): "not enough data" is always about ONE
   card, never about the app — a device without the on-device model simply
   has no deck. So four of the six cards here are still collecting, and that
   is the truthful picture of an account two cycles in.
   ========================================================================== */

(function () {
  'use strict';

  var L = window.Lunel;
  if (!L) return;

  L.i18n.extend(
    {
      en: {
        'AI insights': 'AI insights',
        Mood: 'Mood',
        Symptoms: 'Symptoms',
        Phase: 'Phase',
        Notes: 'Notes',
        Intimacy: 'Intimacy',
        Changes: 'Changes',
        insight_status_collecting: 'Collecting data',
        insight_status_ready: 'Analysis ready',
        insight_caption_no_data: 'No data yet',
        insight_caption_unread: 'Unread',
        insight_caption_updated: 'Updated %@',
        weekly_title: 'Your week',
        weekly_section_usual: 'Usually on these days',
        weekly_section_next: 'Next cycle',
        weekly_lead_often: 'On these days you most often logged %@',
        weekly_basis_each: 'Each one showed up in at least %d of your %d cycles',
        weekly_not_enough_title: 'Not enough data yet',
        weekly_no_repeats_basis: 'Based on your %d cycles',
        weekly_cycle_spread: 'Your cycle length varies from %1$d to %2$d %3$@',
        weekly_list_and: ' and ',
        weekly_tag_headache: 'headaches',
        weekly_tag_rest: 'rest days',
        weekly_tag_irritable: 'irritability'
      },
      ru: {
        'AI insights': 'ИИ-инсайты',
        Mood: 'Настроение',
        Symptoms: 'Симптомы',
        Phase: 'Фаза',
        Notes: 'Заметки',
        Intimacy: 'Близость',
        Changes: 'Изменения',
        insight_status_collecting: 'Собираем данные',
        insight_status_ready: 'Разбор готов',
        insight_caption_no_data: 'Пока нет данных',
        insight_caption_unread: 'Не прочитано',
        insight_caption_updated: 'Обновлён %@',
        weekly_title: 'Ваша неделя',
        weekly_section_usual: 'Обычно в эти дни',
        weekly_section_next: 'Следующий цикл',
        weekly_lead_often: 'В эти дни вы чаще всего отмечали: %@',
        weekly_basis_each: 'Каждая отметка — минимум в %d из %d ваших циклов',
        weekly_not_enough_title: 'Пока недостаточно данных',
        weekly_no_repeats_basis: 'Проверили %d ваших цикла',
        weekly_cycle_spread: 'Длина цикла у вас меняется от %1$d до %2$d %3$@',
        weekly_list_and: ' и ',
        weekly_tag_headache: 'головная боль',
        weekly_tag_rest: 'отдых',
        weekly_tag_irritable: 'раздражённое настроение'
      }
    },
    {
      /* weekly_days_until_range: the plural word only (it follows the upper
         bound); the numbers are put in front by renderWeekly. */
      weekly_days_until_range_word: {
        en: { one: 'day until your next cycle', other: 'days until your next cycle' },
        ru: { one: 'день', few: 'дня', many: 'дней', other: 'дня' }
      },
      weekly_days_until_single: {
        en: { one: '%d day until your next cycle', other: '%d days until your next cycle' },
        ru: { one: 'Через %d день', few: 'Через %d дня', many: 'Через %d дней', other: 'Через %d дня' }
      },
      weekly_no_repeats_basis_plural: {
        en: { one: 'Based on your %d cycle', other: 'Based on your %d cycles' },
        ru: {
          one: 'Проверили %d ваш цикл',
          few: 'Проверили %d ваших цикла',
          many: 'Проверили %d ваших циклов',
          other: 'Проверили %d ваших цикла'
        }
      }
    }
  );

  /* Assets.xcassets InsightStatusReady (12pt, pinned right in a 14 box) and
     InsightStatusCollecting (15 × 14,98, overhanging the box by ~1pt), as is. */
  var ICONS = {
    collecting:
      '<svg class="lunel-ipill__collecting" viewBox="0 0 15 14.9776" aria-hidden="true">' +
      '<path d="M14 7.97759C14 11.8436 10.866 14.9776 7 14.9776C3.13401 14.9776 0 11.8436 0 7.97759C0 4.1116 3.13401 0.97759 7 0.97759C10.866 0.97759 14 4.1116 14 7.97759ZM1.59237 7.97759C1.59237 10.9641 4.01345 13.3852 7 13.3852C9.98655 13.3852 12.4076 10.9641 12.4076 7.97759C12.4076 4.99104 9.98655 2.56996 7 2.56996C4.01345 2.56996 1.59237 4.99104 1.59237 7.97759Z" fill="#fff"/>' +
      '<path d="M7 1.56092C7 1.23876 7.26163 0.975064 7.58268 1.00188C8.68566 1.09401 9.75407 1.44671 10.6985 2.03443C11.8084 2.72517 12.7028 3.71293 13.2802 4.88583C13.8576 6.05873 14.0951 7.3699 13.9656 8.6708C13.8554 9.7777 13.4834 10.8395 12.8838 11.7699C12.7092 12.0406 12.3407 12.0872 12.0854 11.8907L11.7564 11.6375C11.501 11.4411 11.4564 11.0762 11.6243 10.8013C12.0473 10.1084 12.3107 9.32696 12.3916 8.51415C12.4918 7.50722 12.308 6.49234 11.8611 5.58449C11.4141 4.67663 10.7219 3.91207 9.86273 3.37742C9.16924 2.94585 8.38937 2.67801 7.58222 2.59077C7.26192 2.55615 7 2.29824 7 1.97607L7 1.56092Z" fill="#E86C61" style="filter: drop-shadow(0 0 .5px rgba(38,36,34,.3))"/></svg>',
    ready:
      '<svg class="lunel-ipill__ready" viewBox="0 0 12 12" aria-hidden="true">' +
      '<path d="M2.1 9.00029C2.59706 9.00029 3 9.40325 3 9.90029C2.99984 10.3972 2.59696 10.8003 2.1 10.8003C1.60304 10.8003 1.20016 10.3972 1.2 9.90029C1.2 9.40325 1.60294 9.00029 2.1 9.00029Z"/>' +
      '<path d="M6 1.20029C6.11191 1.20029 6.22033 1.23903 6.30645 1.31045C6.39258 1.38199 6.45114 1.48165 6.47168 1.5917L6.97617 4.25889C7.01197 4.44841 7.10411 4.62285 7.24043 4.75928C7.37687 4.89574 7.55175 4.9883 7.74141 5.02412L10.4086 5.52861C10.5185 5.5492 10.6178 5.60728 10.6893 5.69326C10.7608 5.77942 10.8 5.8883 10.8 6.00029C10.7999 6.11219 10.7608 6.22064 10.6893 6.30674C10.6178 6.39279 10.5186 6.45137 10.4086 6.47197L7.74141 6.97588C7.55175 7.0117 7.37687 7.10428 7.24043 7.24072C7.10408 7.3772 7.01198 7.55159 6.97617 7.74111L6.47168 10.4083C6.45116 10.5184 6.39261 10.618 6.30645 10.6896C6.22031 10.761 6.11194 10.8003 6 10.8003C5.88809 10.8003 5.77967 10.761 5.69355 10.6896C5.6074 10.618 5.54888 10.5184 5.52832 10.4083L5.02383 7.74111C4.98801 7.55156 4.89598 7.37721 4.75957 7.24072C4.62314 7.10431 4.44877 7.01171 4.25918 6.97588L1.59199 6.47197C1.48192 6.4514 1.38229 6.39287 1.31074 6.30674C1.23924 6.22064 1.20005 6.11219 1.2 6.00029C1.2 5.8883 1.23919 5.77942 1.31074 5.69326C1.38228 5.60718 1.48196 5.54916 1.59199 5.52861L4.25918 5.02412C4.44876 4.98828 4.62314 4.89571 4.75957 4.75928C4.89595 4.62284 4.98802 4.44845 5.02383 4.25889L5.52832 1.5917C5.54889 1.48165 5.60742 1.38199 5.69355 1.31045C5.77966 1.23901 5.88812 1.20031 6 1.20029Z"/>' +
      '<path d="M9.83906 0.841113C10.0377 0.841271 10.1988 1.0022 10.1988 1.20088V1.80088H10.7988C10.9976 1.80088 11.1586 1.96187 11.1586 2.16064C11.1586 2.35942 10.9976 2.52041 10.7988 2.52041H10.1988V3.12041C10.1988 3.31909 10.0377 3.48002 9.83906 3.48018C9.64029 3.48018 9.4793 3.31919 9.4793 3.12041V2.52041H8.8793C8.68052 2.52041 8.51953 2.35942 8.51953 2.16064C8.51953 1.96187 8.68052 1.80088 8.8793 1.80088H9.4793V1.20088C9.4793 1.0021 9.64029 0.841113 9.83906 0.841113Z"/></svg>'
  };

  /* The six cards and their tints (§6.1). */
  var CARDS = [
    { key: 'Mood', hex: '#47A747', state: 'ready', caption: 'updated', date: '2026-03-12' },
    { key: 'Symptoms', hex: '#FE9F5D', state: 'collecting' },
    { key: 'Phase', hex: '#AF7BD6', state: 'ready', caption: 'unread' },
    { key: 'Notes', hex: '#8C87E7', state: 'collecting' },
    { key: 'Intimacy', hex: '#DD608C', state: 'collecting' },
    { key: 'Changes', hex: '#0EAC9B', state: 'collecting' }
  ];

  var DARK = {
    '#47A747': '#16590C',
    '#FE9F5D': '#8F4100',
    '#AF7BD6': '#6F4392',
    '#8C87E7': '#4E4FA1',
    '#DD608C': '#933454',
    '#0EAC9B': '#0C5349'
  };

  function shortDate(iso) {
    var p = iso.split('-');
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }

  L.define('insights', function (root) {
    var lang = L.i18n.langOf(root);
    var gridEl = root.querySelector('[data-icards]');
    /* The modal must position against the SCREEN, so a host may place it
       outside the component root (the scenario does). Look there too. */
    var weekly = root.querySelector('[data-weekly]') ||
      (root.closest('.lunel-screen') || document).querySelector('[data-weekly]');
    var weeklyState = root.getAttribute('data-weekly-state') === 'thin' ? 'thin' : 'rich';
    var cardNodes = [];
    var lastFocus = null;
    var screenEl = root.closest('.lunel-screen');
    /* The sheet is a screen-level layer, like the checklist's: left inside a
       scrolling column it would fade with the page behind it and position
       itself against the column. */
    if (weekly && screenEl && weekly.parentNode !== screenEl) screenEl.appendChild(weekly);
    var dimTarget = (screenEl || root).querySelector('[data-dimmable]');

    /* How full the account is decides which cards have an analysis. The
       default six are the "two cycles in" picture; `data-cards` overrides it
       with the ready ones, e.g. data-cards="ready:mood,phase,intimacy". */
    var cardList = CARDS;
    var cardsAttr = root.getAttribute('data-cards');
    if (cardsAttr && cardsAttr.indexOf('ready:') === 0) {
      var ready = cardsAttr.slice(6).toLowerCase().split(',');
      cardList = CARDS.map(function (card) {
        var isReady = ready.indexOf(card.key.toLowerCase()) >= 0;
        if (isReady === (card.state === 'ready')) return card;
        var copy = {};
        for (var k in card) if (Object.prototype.hasOwnProperty.call(card, k)) copy[k] = card[k];
        copy.state = isReady ? 'ready' : 'collecting';
        if (isReady && !copy.caption) copy.caption = 'unread';
        return copy;
      });
    }

    function buildCards() {
      cardList.forEach(function (card) {
        var el = document.createElement('button');
        el.type = 'button';
        el.className = 'lunel-icard';
        el.style.setProperty('--card-light', L.color.rgba(card.hex, 0.1));
        el.style.setProperty('--card-medium', L.color.rgba(card.hex, 0.55));
        el.style.setProperty('--card-dark-20', L.color.rgba(DARK[card.hex], 0.2));
        if (card.state === 'ready') el.setAttribute('data-ready', '');
        else el.setAttribute('aria-disabled', 'true');

        var pill = document.createElement('span');
        pill.className = 'lunel-ipill';
        pill.innerHTML = card.state === 'ready' ? ICONS.ready : ICONS.collecting;
        var pillText = document.createElement('span');
        pill.appendChild(pillText);

        var name = document.createElement('span');
        name.className = 'lunel-icard__name';

        var caption = document.createElement('span');
        caption.className = 'lunel-icard__caption';

        el.appendChild(pill);
        el.appendChild(name);
        el.appendChild(caption);
        gridEl.appendChild(el);

        var node = { card: card, el: el, pill: pillText, name: name, caption: caption };
        cardNodes.push(node);

        el.addEventListener('click', function () {
          if (card.state !== 'ready') return;
          openWeekly();
          root.dispatchEvent(
            new CustomEvent('lunel:insight-open', { bubbles: true, detail: { card: card.key } })
          );
        });
      });
    }

    function renderCards() {
      cardNodes.forEach(function (node) {
        var card = node.card;
        node.pill.textContent = L.i18n.t(
          card.state === 'ready' ? 'insight_status_ready' : 'insight_status_collecting', lang, []
        );
        node.name.textContent = L.i18n.t(card.key, lang, []);
        if (card.state !== 'ready') {
          node.caption.textContent = L.i18n.t('insight_caption_no_data', lang, []);
        } else if (card.caption === 'unread') {
          node.caption.textContent = L.i18n.t('insight_caption_unread', lang, []);
        } else {
          node.caption.textContent =
            L.i18n.t('insight_caption_updated', lang, [formatShort(shortDate(card.date))]);
        }
        node.caption.toggleAttribute('data-updated',
          card.state === 'ready' && card.caption !== 'unread');
        node.el.setAttribute(
          'aria-label',
          node.name.textContent + '. ' + node.pill.textContent + '. ' + node.caption.textContent
        );
      });
    }

    /* ---------------------------------------------------- weekly modal */

    var weeklyNodes = {
      title: weekly.querySelector('[data-weekly-title]'),
      subtitle: weekly.querySelector('[data-weekly-subtitle]'),
      subUsual: weekly.querySelector('[data-weekly-sub-usual]'),
      subNext: weekly.querySelector('[data-weekly-sub-next]'),
      usualLead: weekly.querySelector('[data-weekly-usual-lead]'),
      usualBasis: weekly.querySelector('[data-weekly-usual-basis]'),
      nextLead: weekly.querySelector('[data-weekly-next-lead]'),
      nextBasis: weekly.querySelector('[data-weekly-next-basis]'),
      dismiss: weekly.querySelector('[data-weekly-dismiss]')
    };

    function formatShort(date) {
      try {
        return new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'short' }).format(date);
      } catch (e) {
        return '';
      }
    }

    function longRange(start, end) {
      try {
        if (/^ru/.test(lang)) {
          return new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'long' })
            .formatRange(start, end).replace(/\s*[–-]\s*/, '–');
        }
        var month = function (d) { return new Intl.DateTimeFormat(lang, { month: 'long' }).format(d); };
        if (start.getMonth() === end.getMonth()) return month(start) + ' ' + start.getDate() + '–' + end.getDate();
        return month(start) + ' ' + start.getDate() + ' – ' + month(end) + ' ' + end.getDate();
      } catch (e) {
        return '';
      }
    }

    function weekRange() {
      var start = new Date(2026, 2, 2);
      var end = new Date(2026, 2, 8);
      try {
        var fmt = new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'long' });
        return fmt.formatRange
          ? fmt.formatRange(start, end).replace(/—/g, '–').replace(/ /g, ' ')
          : fmt.format(start) + ' – ' + fmt.format(end);
      } catch (e) {
        return '';
      }
    }

    function renderWeekly() {
      weeklyNodes.title.textContent = L.i18n.t('weekly_title', lang, []);
      weeklyNodes.subtitle.textContent = weekRange();
      weeklyNodes.subUsual.textContent = L.i18n.t('weekly_section_usual', lang, []);
      weeklyNodes.subNext.textContent = L.i18n.t('weekly_section_next', lang, []);

      if (weeklyState === 'rich') {
        /* patternsSentence: the lead with the tags in Body 1 bold. */
        var tagNames = [
          L.i18n.t('weekly_tag_headache', lang, []),
          L.i18n.t('weekly_tag_irritable', lang, []),
          L.i18n.t('weekly_tag_rest', lang, [])
        ];
        var parts = L.i18n.t('weekly_lead_often', lang, ['\u0000']).split('\u0000');
        var lead = weeklyNodes.usualLead;
        lead.textContent = parts[0];
        tagNames.forEach(function (name, i) {
          var b = document.createElement('b');
          b.textContent = name;
          lead.appendChild(b);
          if (i < tagNames.length - 2) lead.appendChild(document.createTextNode(', '));
          else if (i === tagNames.length - 2) lead.appendChild(document.createTextNode(L.i18n.t('weekly_list_and', lang, [])));
        });
        if (parts[1]) lead.appendChild(document.createTextNode(parts[1]));
        weeklyNodes.usualBasis.textContent = L.i18n.t('weekly_basis_each', lang, [2, 3]);
      } else {
        /* the honest state: the product says it does not know yet */
        weeklyNodes.usualLead.textContent = L.i18n.t('weekly_not_enough_title', lang, []);
        weeklyNodes.usualBasis.textContent =
          L.i18n.t('weekly_no_repeats_basis_plural', lang, [1]);
      }

      /* NextCycle block: the window as the Body 1 lead ("March 29 – April 2",
         Date.appRange MMMMd), the days until it as a grey line. */
      weeklyNodes.nextLead.textContent = longRange(new Date(2026, 2, 29), new Date(2026, 3, 2));
      var word = L.i18n.t('weekly_days_until_range_word', lang, [31]).replace(/^\d+\s*/, '');
      var range = '27\u2060–\u206031';
      var when = /^ru/.test(lang) ? 'Через ' + range + ' ' + word : range + ' ' + word;
      weeklyNodes.nextBasis.textContent = when;
      if (!weeklyNodes.spread) {
        weeklyNodes.spread = document.createElement('p');
        weeklyNodes.spread.className = 'lunel-weekly__basis';
        weeklyNodes.nextBasis.parentNode.appendChild(weeklyNodes.spread);
      }
      weeklyNodes.spread.textContent = L.i18n.t('weekly_cycle_spread', lang, [
        26, 30, L.i18n.t('days_unit', lang, [30])
      ]);
    }

    function openWeekly() {
      lastFocus = document.activeElement;
      weekly.hidden = false;
      weekly.setAttribute('data-closed', '');
      if (dimTarget) dimTarget.setAttribute('data-faded', '');
      renderWeekly();
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          weekly.removeAttribute('data-closed');
          weeklyNodes.dismiss.focus({ preventScroll: true });
        });
      });
    }

    function closeWeekly() {
      if (weekly.hidden) return;
      weekly.setAttribute('data-closed', '');
      if (dimTarget) dimTarget.removeAttribute('data-faded');
      var done = function () { weekly.hidden = true; };
      if (L.motion.reduced()) done();
      else setTimeout(done, 420);
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    }

    weeklyNodes.dismiss.addEventListener('click', closeWeekly);
    weekly.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        closeWeekly();
        event.preventDefault();
      }
    });

    root.addEventListener('lunel:lang', function () {
      lang = L.i18n.langOf(root);
      renderCards();
      if (!weekly.hidden) renderWeekly();
    });

    buildCards();
    renderCards();
    renderWeekly();

    return {
      openWeekly: openWeekly,
      closeWeekly: closeWeekly,
      setWeeklyState: function (next) {
        weeklyState = next === 'thin' ? 'thin' : 'rich';
        renderWeekly();
      },
      get weeklyState() { return weeklyState; }
    };
  });
})();
