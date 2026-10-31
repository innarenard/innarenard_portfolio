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

  var ICONS = {
    collecting: '<svg viewBox="0 0 14 14" aria-hidden="true"><circle cx="7" cy="7" r="5"/><path d="M7 3.4V7l2.3 1.6"/></svg>',
    ready: '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M2.6 7.4 5.6 10.4 11.4 3.8"/></svg>'
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
        var tags =
          L.i18n.t('weekly_tag_headache', lang, []) + ', ' +
          L.i18n.t('weekly_tag_irritable', lang, []) +
          L.i18n.t('weekly_list_and', lang, []) +
          L.i18n.t('weekly_tag_rest', lang, []);
        weeklyNodes.usualLead.textContent = L.i18n.t('weekly_lead_often', lang, [tags]);
        weeklyNodes.usualBasis.textContent = L.i18n.t('weekly_basis_each', lang, [2, 3]);
      } else {
        /* the honest state: the product says it does not know yet */
        weeklyNodes.usualLead.textContent = L.i18n.t('weekly_not_enough_title', lang, []);
        weeklyNodes.usualBasis.textContent =
          L.i18n.t('weekly_no_repeats_basis_plural', lang, [1]);
      }

      weeklyNodes.nextLead.textContent = L.i18n.t('weekly_days_until_single', lang, [27]);
      weeklyNodes.nextBasis.textContent = L.i18n.t('weekly_cycle_spread', lang, [
        26, 30, L.i18n.t('days_unit', lang, [30])
      ]);
    }

    function openWeekly() {
      lastFocus = document.activeElement;
      weekly.hidden = false;
      weekly.setAttribute('data-closed', '');
      if (dimTarget) dimTarget.setAttribute('data-dimmed', '');
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
      if (dimTarget) dimTarget.removeAttribute('data-dimmed');
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
