/* ==========================================================================
   Lunel interactive replicas — Trends deck
   --------------------------------------------------------------------------
   Three paged blocks with the Last 3 cycles / All time switch re-counting
   every number, ring, bar and legend on the deck.

   Canned data only. Percentages are never printed for flow — the app prints
   "N logs" and lets the ring carry the share (§7.2).
   ========================================================================== */

(function () {
  'use strict';

  var L = window.Lunel;
  if (!L) return;
  var U = L.util;

  L.i18n.extend(
    {
      en: {
        'Flow intensity': 'Flow intensity',
        'Mood and energy by phase': 'Mood and energy by phase',
        'Activity by phase': 'Activity by phase',
        'Next period': 'Next period',
        'Expected start': 'Expected start',
        'Days until': 'Days until',
        Overview: 'Overview',
        'Completed cycles': 'Completed cycles',
        Logged: 'Logged',
        'Data Summary': 'Data summary',
        'Based on data from': 'Based on data from',
        Export: 'Export',
        'Last 3 cycles': 'Last 3 cycles',
        'All time': 'All time',
        flow_mild: 'Mild',
        flow_moderate: 'Moderate',
        flow_heavy: 'Heavy',
        flow_very_heavy: 'Very heavy',
        trends_peak_day: 'Most often on day %@',
        trends_peak_days: 'Most often on days %@',
        mood_conclusion_noun: 'mood',
        energy_conclusion_noun: 'energy',
        mood_level_1: 'Hard',
        mood_level_2: 'Low',
        mood_level_3: 'Neutral',
        mood_level_4: 'Good',
        mood_level_5: 'Great',
        energy_level_1: 'Very low',
        energy_level_2: 'Low',
        energy_level_3: 'Enough',
        energy_level_4: 'High',
        energy_level_5: 'Full of',
        activity_level_rest: 'Rest',
        activity_level_light: 'Light',
        activity_level_moderate: 'Moderate',
        activity_level_intense: 'Intense',
        activity_leader_share: '%@ %d%%',
        activity_count_rest: '%d rest',
        activity_count_light: '%d light',
        activity_count_moderate: '%d moderate',
        activity_count_intense: '%d intense'
      },
      ru: {
        'Flow intensity': 'Интенсивность выделений',
        'Mood and energy by phase': 'Настроение и энергия по фазам',
        'Activity by phase': 'Активность по фазам',
        'Next period': 'Следующий цикл',
        'Expected start': 'Ожидаемый старт',
        'Days until': 'Осталось дней',
        Overview: 'Обзор',
        'Completed cycles': 'Завершено циклов',
        Logged: 'Отмечено',
        'Data Summary': 'Сводка данных',
        'Based on data from': 'На основе данных с',
        Export: 'Экспорт',
        'Last 3 cycles': '3 последних цикла',
        'All time': 'Всё время',
        flow_mild: 'Скудные',
        flow_moderate: 'Умеренные',
        flow_heavy: 'Обильные',
        flow_very_heavy: 'Очень обильные',
        trends_peak_day: 'Чаще всего в день %@',
        trends_peak_days: 'Чаще всего в дни %@',
        mood_conclusion_noun: 'настроение',
        energy_conclusion_noun: 'энергии',
        mood_level_1: 'Тяжёлое',
        mood_level_2: 'Непростое',
        mood_level_3: 'Ровное',
        mood_level_4: 'Хорошее',
        mood_level_5: 'Отличное',
        energy_level_1: 'Почти нет',
        energy_level_2: 'Мало',
        energy_level_3: 'Достаточно',
        energy_level_4: 'Много',
        energy_level_5: 'Полна',
        activity_level_rest: 'Отдых',
        activity_level_light: 'Лёгкая',
        activity_level_moderate: 'Умеренная',
        activity_level_intense: 'Интенсивная',
        activity_leader_share: '%@ %d%%',
        activity_count_rest: '%d отдых',
        activity_count_light: '%d лёгкая',
        activity_count_moderate: '%d умеренная',
        activity_count_intense: '%d интенсивная'
      }
    }
  );

  var FLOW_LEVELS = [
    { key: 'flow_very_heavy', color: '#710002' },
    { key: 'flow_heavy', color: '#900D15' },
    { key: 'flow_moderate', color: '#DB2B2B' },
    { key: 'flow_mild', color: '#FA5A64' }
  ];

  var PHASES = ['menstrual', 'follicular', 'ovulation', 'luteal'];

  var ACTIVITY = [
    { key: 'activity_level_rest', count: 'activity_count_rest', color: '#8AA12E' },
    { key: 'activity_level_light', count: 'activity_count_light', color: '#FE9F5D' },
    { key: 'activity_level_moderate', count: 'activity_count_moderate', color: '#DD608C' },
    { key: 'activity_level_intense', count: 'activity_count_intense', color: '#8C87E7' }
  ];

  /* Two canned windows. "Last 3 cycles" = the three completed cycles plus the
     current one; "All time" = the last 12 months. */
  var DATA = {
    last3: {
      window: '2026-02-01',
      flow: [
        { logs: 2, days: [1] },
        { logs: 6, days: [1, 2] },
        { logs: 9, days: [2, 3] },
        { logs: 5, days: [4, 5] }
      ],
      mood: [
        { logs: 11, mood: 2, energy: 2 },
        { logs: 14, mood: 4, energy: 4 },
        { logs: 6, mood: 5, energy: 4 },
        { logs: 16, mood: 3, energy: 3 }
      ],
      activity: [
        [7, 2, 1, 0],
        [3, 5, 4, 2],
        [1, 3, 3, 2],
        [9, 4, 1, 0]
      ]
    },
    all: {
      window: '2025-03-15',
      flow: [
        { logs: 9, days: [1] },
        { logs: 27, days: [1, 2] },
        { logs: 41, days: [2, 3] },
        { logs: 23, days: [4, 5] }
      ],
      mood: [
        { logs: 48, mood: 2, energy: 2 },
        { logs: 61, mood: 4, energy: 4 },
        { logs: 22, mood: 4, energy: 5 },
        { logs: 70, mood: 3, energy: 3 }
      ],
      activity: [
        [31, 9, 4, 1],
        [14, 22, 17, 9],
        [5, 11, 12, 7],
        [40, 18, 6, 2]
      ]
    }
  };

  /* Collapse a run of days: [2,3] → "2–3", [1,4] → "1, 4" (§7.2). */
  function collapseDays(days) {
    var out = [];
    var i = 0;
    while (i < days.length) {
      var start = days[i];
      var end = start;
      while (i + 1 < days.length && days[i + 1] === end + 1) {
        i++;
        end = days[i];
      }
      out.push(start === end ? String(start) : start + '–' + end);
      i++;
    }
    return out.join(', ');
  }

  function svgEl(name, attrs) {
    var el = document.createElementNS('http://www.w3.org/2000/svg', name);
    for (var key in attrs) {
      if (Object.prototype.hasOwnProperty.call(attrs, key)) el.setAttribute(key, attrs[key]);
    }
    return el;
  }

  /* TrendsRing: ⌀36, lineWidth = diameter/2 × 0.3, arc from 12 o'clock. */
  function makeRing(color) {
    var d = 36;
    var lw = (d / 2) * 0.3;
    var r = (d - lw) / 2;
    var svg = svgEl('svg', { class: 'lunel-ring36', width: d, height: d, viewBox: '0 0 ' + d + ' ' + d, 'aria-hidden': 'true' });
    svg.appendChild(svgEl('circle', { cx: d / 2, cy: d / 2, r: r, stroke: '#F5F1EB', 'stroke-width': lw }));
    var arc = svgEl('circle', {
      cx: d / 2, cy: d / 2, r: r, stroke: color, 'stroke-width': lw,
      'stroke-linecap': 'round', class: 'lunel-arc',
      transform: 'rotate(-90 ' + d / 2 + ' ' + d / 2 + ')'
    });
    var c = 2 * Math.PI * r;
    arc.setAttribute('stroke-dasharray', c);
    arc.setAttribute('stroke-dashoffset', c);
    arc.dataset.circumference = c;
    svg.appendChild(arc);
    return { svg: svg, arc: arc, circumference: c };
  }

  /* MoodEnergyDonut: outer ⌀64 (thickness 7.0) mood, inner ⌀41 (6.6) energy. */
  function makeDonut() {
    var size = 64;
    var svg = svgEl('svg', { class: 'lunel-donut', width: size, height: size, viewBox: '0 0 64 64', 'aria-hidden': 'true' });
    var rings = [];
    [[64, 7.0, '#8AA12E'], [41, 6.6, '#AF7BD6']].forEach(function (spec) {
      var r = (spec[0] - spec[1]) / 2;
      svg.appendChild(svgEl('circle', { cx: 32, cy: 32, r: r, stroke: '#F5F1EB', 'stroke-width': spec[1] }));
      var arc = svgEl('circle', {
        cx: 32, cy: 32, r: r, stroke: spec[2], 'stroke-width': spec[1],
        'stroke-linecap': 'round', class: 'lunel-arc', transform: 'rotate(-90 32 32)'
      });
      var c = 2 * Math.PI * r;
      arc.setAttribute('stroke-dasharray', c);
      arc.setAttribute('stroke-dashoffset', c);
      svg.appendChild(arc);
      rings.push({ arc: arc, circumference: c });
    });
    return { svg: svg, rings: rings };
  }

  function gradient(color) {
    return 'linear-gradient(to bottom, ' + hexA(color, 0.21) + ', ' + hexA(color, 0.7) + ')';
  }

  function hexA(hex, alpha) {
    return L.color.rgba(hex, alpha);
  }

  /* "Mar 15, 2025–Today" / «15 мар. 2025 г.–Сегодня» — en dash, no spaces. */
  function windowStart(iso, lang, withYear) {
    var p = iso.split('-');
    var date = new Date(+p[0], +p[1] - 1, +p[2]);
    /* The app formats these with the abbreviated month, which in Russian
       comes out spelled in full ("26 марта–Сегодня", "26 марта 2026 г."). */
    var opts = { day: 'numeric', month: /^ru/.test(lang) ? 'long' : 'short' };
    if (withYear) opts.year = 'numeric';
    try {
      return new Intl.DateTimeFormat(lang, opts).format(date);
    } catch (e) {
      return iso;
    }
  }

  L.define('trends', function (root) {
    var lang = L.i18n.langOf(root);
    var windowKey = 'last3';

    /* MainScreenHeader in its continuous Trends mode: a leading H1 «Trends»
       on the first page, cross-faded by the deck's scroll into a centred H3
       title over the Caption 1 window line, and the ⌀44 glass export button
       on the right. Hosts may still ship the old title + window markup; it is
       replaced here. */
    var headerEl = root.querySelector('.lunel-trends__header');
    if (headerEl) {
      headerEl.innerHTML =
        '<div class="lunel-trends__large" data-large>' +
        '<h2 class="lunel-h1 lunel-trends__title" data-i18n="Trends">Trends</h2></div>' +
        '<div class="lunel-trends__compact" data-compact aria-hidden="true">' +
        '<p class="lunel-h3 lunel-trends__compact-title" data-i18n="Trends">Trends</p>' +
        '<p class="lunel-caption1 lunel-trends__window" data-window></p></div>' +
        '<button type="button" class="lunel-home__action lunel-trends__export" data-i18n-label="Export" aria-label="Export">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.99951 17.0001C2.99951 17.9301 2.99951 18.3951 3.10174 18.7766C3.37914 19.8118 4.18778 20.6205 5.22306 20.8979C5.60456 21.0001 6.06954 21.0001 6.9995 21.0001H16.9995C17.9295 21.0001 18.3945 21.0001 18.776 20.8979C19.8112 20.6205 20.6199 19.8118 20.8973 18.7766C20.9995 18.3951 20.9995 17.9301 20.9995 17.0001M16.5001 11.5002C16.5001 11.5002 13.1859 16.0002 12 16.0002C10.8142 16.0002 7.5001 11.5002 7.5001 11.5002M12 15.0002V3.00012" style="stroke-width:1.5"/></svg>' +
        '</button>';
      L.i18n.apply(headerEl, lang);
    }
    var largeEl = root.querySelector('[data-large]');
    var compactEl = root.querySelector('[data-compact]');

    var pagesEl = root.querySelector('[data-pages]');
    var dotsEl = root.querySelector('[data-dots]');
    var windowEl = root.querySelector('[data-window]');

    var pages = [];
    var segs = [];

    /* ------------------------------------------------------- build */

    function makeSegment(onChange) {
      var seg = document.createElement('div');
      seg.className = 'lunel-seg';
      seg.setAttribute('role', 'tablist');
      var pill = document.createElement('span');
      pill.className = 'lunel-seg__pill';
      pill.setAttribute('aria-hidden', 'true');
      seg.appendChild(pill);
      var buttons = [];
      [['last3', 'Last 3 cycles'], ['all', 'All time']].forEach(function (spec) {
        var button = document.createElement('button');
        button.type = 'button';
        button.setAttribute('role', 'tab');
        button.setAttribute('data-window-key', spec[0]);
        button.setAttribute('data-seg-label', spec[1]);
        button.textContent = L.i18n.t(spec[1], lang, []);
        button.addEventListener('click', function () { onChange(spec[0]); });
        seg.appendChild(button);
        buttons.push(button);
      });
      var record = { el: seg, pill: pill, buttons: buttons };
      segs.push(record);
      return seg;
    }

    /* TrendsSegmentedControl: two equal halves, a flat white capsule. Its
       edge in the direction of travel springs fast (response .26), the other
       follows 70 ms later on a softer spring (.36), so the pill stretches into
       a drop and settles. Here the two edges are the pill's left and right,
       each on its own transition. */
    function placePill(record, animate) {
      var index = windowKey === 'all' ? 1 : 0;
      var pill = record.pill;
      var left = index * 50;
      var right = (1 - index) * 50;
      if (!animate || L.motion.reduced()) {
        pill.style.transition = 'none';
      } else {
        var movingRight = index === 1;
        var front = 'var(--lunel-spring-snappy-dur, 300ms) var(--lunel-spring-snappy, cubic-bezier(.3,1.25,.45,1))';
        var back = '420ms cubic-bezier(.3,1.15,.45,1) 70ms';
        pill.style.transition = movingRight
          ? 'right ' + front + ', left ' + back
          : 'left ' + front + ', right ' + back;
      }
      pill.style.left = 'calc(4px + ' + left + '% - ' + (left / 50) * 4 + 'px)';
      pill.style.right = 'calc(4px + ' + right + '% - ' + (right / 50) * 4 + 'px)';
    }

    function card() {
      var el = document.createElement('div');
      el.className = 'lunel-tcard';
      return el;
    }

    function cardBody(el) {
      var body = document.createElement('div');
      body.className = 'lunel-tcard__body';
      el.appendChild(body);
      return body;
    }

    function topRow(body) {
      var top = document.createElement('div');
      top.className = 'lunel-tcard__top';
      var name = document.createElement('span');
      name.className = 'lunel-tcard__name';
      var logs = document.createElement('span');
      logs.className = 'lunel-tcard__logs';
      top.appendChild(name);
      top.appendChild(logs);
      body.appendChild(top);
      return { name: name, logs: logs };
    }

    /* -------- page 0: summary (AnalyticsView+SummaryCards) --------
       NEXT PERIOD (expected start · days until), OVERVIEW (completed cycles ·
       logged days), DATA SUMMARY (based on data from). Not window-dependent. */

    var SUMMARY = { anchor: '2026-03-01', today: 2, cycle: 28, completed: 7, logged: 118, from: '2025-12-01' };

    function summaryValues() {
      var p = SUMMARY.anchor.split('-');
      var anchor = new Date(+p[0], +p[1] - 1, +p[2]);
      var start = L.dates.addDays(anchor, SUMMARY.cycle - 1);
      var end = L.dates.addDays(anchor, SUMMARY.cycle + 2);
      var lower = SUMMARY.cycle - SUMMARY.today;
      var upper = lower + 3;
      return {
        expected: L.dates.shortRange(start, end, lang),
        until: lower + '–' + L.i18n.t('analytics_days_until_count', lang, [upper]),
        completed: String(SUMMARY.completed),
        logged: L.i18n.t('analytics_days_until_count', lang, [SUMMARY.logged]),
        from: windowStart(SUMMARY.from, lang, true) + ' – ' + L.i18n.t('Today', lang, [])
      };
    }

    function summaryItem(labelKey, valueKey) {
      return '<div class="lunel-tsum__item">' +
        '<p class="lunel-tsum__label" data-block-title="' + labelKey + '"></p>' +
        '<p class="lunel-tsum__value" data-sum="' + valueKey + '"></p></div>';
    }

    function buildSummaryPage() {
      var page = document.createElement('section');
      page.className = 'lunel-trends__page lunel-trends__page--summary';
      page.innerHTML =
        '<h3 class="lunel-subheader" data-block-title="Next period"></h3>' +
        '<div class="lunel-tsum__pair">' +
        '<div class="lunel-tsum__card">' + summaryItem('Expected start', 'expected') + '</div>' +
        '<div class="lunel-tsum__card">' + summaryItem('Days until', 'until') + '</div></div>' +
        '<h3 class="lunel-subheader" data-block-title="Overview"></h3>' +
        '<div class="lunel-tsum__pair">' +
        '<div class="lunel-tsum__card">' + summaryItem('Completed cycles', 'completed') + '</div>' +
        '<div class="lunel-tsum__card">' + summaryItem('Logged', 'logged') + '</div></div>' +
        '<h3 class="lunel-subheader" data-block-title="Data Summary"></h3>' +
        '<div class="lunel-tsum__card lunel-tsum__card--wide">' + summaryItem('Based on data from', 'from') + '</div>';
      page.querySelectorAll('[data-block-title]').forEach(function (el) {
        el.textContent = L.i18n.t(el.getAttribute('data-block-title'), lang, []);
      });
      pages.push({ el: page, kind: 'summary', rows: [] });
      pagesEl.appendChild(page);
    }

    function renderSummary() {
      var v = summaryValues();
      root.querySelectorAll('[data-sum]').forEach(function (el) {
        el.textContent = v[el.getAttribute('data-sum')];
      });
    }

    /* -------- page 1: flow intensity -------- */

    function buildFlowPage() {
      var page = document.createElement('section');
      page.className = 'lunel-trends__page';
      var title = document.createElement('h3');
      title.className = 'lunel-h2 lunel-trends__block-title';
      title.setAttribute('data-block-title', 'Flow intensity');
      title.textContent = L.i18n.t('Flow intensity', lang, []);
      page.appendChild(title);
      page.appendChild(makeSegment(setWindow));

      var rows = FLOW_LEVELS.map(function (level) {
        var el = card();
        var ring = makeRing(level.color);
        el.appendChild(ring.svg);
        var body = cardBody(el);
        var top = topRow(body);
        var sub = document.createElement('div');
        sub.className = 'lunel-tcard__sub';
        body.appendChild(sub);
        page.appendChild(el);
        return { level: level, ring: ring, top: top, sub: sub };
      });

      pages.push({ el: page, kind: 'flow', rows: rows });
      pagesEl.appendChild(page);
    }

    /* -------- page 2: mood and energy by phase -------- */

    function buildMoodPage() {
      var page = document.createElement('section');
      page.className = 'lunel-trends__page';
      var title = document.createElement('h3');
      title.className = 'lunel-h2 lunel-trends__block-title';
      title.setAttribute('data-block-title', 'Mood and energy by phase');
      title.textContent = L.i18n.t('Mood and energy by phase', lang, []);
      page.appendChild(title);
      page.appendChild(makeSegment(setWindow));

      var rows = PHASES.map(function (phaseKey) {
        var el = card();
        var donut = makeDonut();
        el.appendChild(donut.svg);
        var body = cardBody(el);
        var top = topRow(body);
        var moodLine = document.createElement('div');
        moodLine.className = 'lunel-tcard__line';
        var energyLine = document.createElement('div');
        energyLine.className = 'lunel-tcard__line';
        body.appendChild(moodLine);
        body.appendChild(energyLine);
        page.appendChild(el);
        return { phaseKey: phaseKey, donut: donut, top: top, moodLine: moodLine, energyLine: energyLine };
      });

      pages.push({ el: page, kind: 'mood', rows: rows });
      pagesEl.appendChild(page);
    }

    /* -------- page 3: activity by phase -------- */

    function buildActivityPage() {
      var page = document.createElement('section');
      page.className = 'lunel-trends__page';
      var title = document.createElement('h3');
      title.className = 'lunel-h2 lunel-trends__block-title';
      title.setAttribute('data-block-title', 'Activity by phase');
      title.textContent = L.i18n.t('Activity by phase', lang, []);
      page.appendChild(title);
      page.appendChild(makeSegment(setWindow));

      var rows = PHASES.map(function (phaseKey) {
        var el = card();
        el.style.display = 'block';
        var top = document.createElement('div');
        top.className = 'lunel-tcard__top';
        var name = document.createElement('span');
        name.className = 'lunel-tcard__name';
        var leader = document.createElement('span');
        leader.className = 'lunel-tcard__logs';
        top.appendChild(name);
        top.appendChild(leader);
        el.appendChild(top);

        var bar = document.createElement('div');
        bar.className = 'lunel-sharebar';
        var segments = ACTIVITY.map(function (kind) {
          var s = document.createElement('span');
          s.style.background = gradient(kind.color);
          bar.appendChild(s);
          return s;
        });
        el.appendChild(bar);

        var legend = document.createElement('div');
        legend.className = 'lunel-legend';
        var legendItems = ACTIVITY.map(function (kind) {
          var item = document.createElement('span');
          var dot = document.createElement('i');
          dot.style.background = gradient(kind.color);
          var text = document.createElement('em');
          text.style.fontStyle = 'normal';
          item.appendChild(dot);
          item.appendChild(text);
          legend.appendChild(item);
          return text;
        });
        el.appendChild(legend);
        page.appendChild(el);
        return { phaseKey: phaseKey, name: name, leader: leader, segments: segments, legend: legendItems };
      });

      pages.push({ el: page, kind: 'activity', rows: rows });
      pagesEl.appendChild(page);
    }

    /* ------------------------------------------------------ rendering */

    function render(animate) {
      renderSummary();
      var data = DATA[windowKey];
      windowEl.textContent =
        windowStart(data.window, lang, windowKey === 'all') + '–' +
        L.i18n.t('Today', lang, []);

      pages.forEach(function (page) {
        if (page.kind === 'flow') {
          var total = data.flow.reduce(function (sum, row) { return sum + row.logs; }, 0) || 1;
          page.rows.forEach(function (row, index) {
            var datum = data.flow[index];
            row.top.name.textContent = L.i18n.t(row.level.key, lang, []);
            row.top.logs.textContent = L.i18n.t('trends_logs_count', lang, [datum.logs]);
            row.sub.textContent = L.i18n.t(
              datum.days.length > 1 ? 'trends_peak_days' : 'trends_peak_day',
              lang,
              [collapseDays(datum.days)]
            );
            setArc(row.ring.arc, row.ring.circumference, datum.logs / total, animate);
          });
        } else if (page.kind === 'mood') {
          page.rows.forEach(function (row, index) {
            var datum = data.mood[index];
            row.top.name.textContent = L.i18n.t(
              L.phase.all[row.phaseKey].title, lang, []
            );
            row.top.logs.textContent = L.i18n.t('trends_logs_count', lang, [datum.logs]);
            row.moodLine.textContent =
              L.i18n.t('mood_level_' + datum.mood, lang, []) + ' ' +
              L.i18n.t('mood_conclusion_noun', lang, []);
            row.energyLine.textContent =
              L.i18n.t('energy_level_' + datum.energy, lang, []) + ' ' +
              L.i18n.t('energy_conclusion_noun', lang, []);
            setArc(row.donut.rings[0].arc, row.donut.rings[0].circumference, datum.mood / 5, animate);
            setArc(row.donut.rings[1].arc, row.donut.rings[1].circumference, datum.energy / 5, animate);
          });
        } else {
          page.rows.forEach(function (row, index) {
            var counts = data.activity[index];
            var total = counts.reduce(function (a, b) { return a + b; }, 0) || 1;
            row.name.textContent = L.i18n.t(L.phase.all[row.phaseKey].title, lang, []);
            var leadIndex = counts.indexOf(Math.max.apply(null, counts));
            row.leader.textContent = L.i18n.t('activity_leader_share', lang, [
              L.i18n.t(ACTIVITY[leadIndex].key, lang, []),
              Math.round((counts[leadIndex] / total) * 100)
            ]);
            counts.forEach(function (count, i) {
              row.segments[i].style.flex = count + ' 1 0';
              row.legend[i].textContent = L.i18n.t(ACTIVITY[i].count, lang, [count]);
            });
          });
        }
      });
    }

    function setArc(arc, circumference, fraction, animate) {
      var offset = circumference * (1 - U.clamp(fraction, 0, 1));
      if (!animate) {
        var prev = arc.style.transition;
        arc.style.transition = 'none';
        arc.setAttribute('stroke-dashoffset', offset);
        void arc.getBoundingClientRect();
        arc.style.transition = prev;
        return;
      }
      arc.setAttribute('stroke-dashoffset', offset);
    }

    function setWindow(key, options) {
      if (key === windowKey) return;
      windowKey = key;
      segs.forEach(function (record) {
        record.buttons.forEach(function (button) {
          button.setAttribute(
            'aria-selected', String(button.getAttribute('data-window-key') === key)
          );
        });
        placePill(record, !(options && options.animate === false));
      });
      render(true);
      root.dispatchEvent(
        new CustomEvent('lunel:trends-window', { bubbles: true, detail: { window: key } })
      );
    }

    /* ---------------------------------------------------------- pages */

    /* deckPageControl: a sliding window of at most five dots, 8 pt with an
       8 pt gap; dots next to a window edge with hidden pages beyond taper to 6
       and 4. Current = Brand/Main, the rest Brand/Medium. */
    var currentIndex = 0;

    function buildDots() {
      dotsEl.textContent = '';
      var count = pages.length;
      if (count < 2) return;
      var visible = Math.min(5, count);
      var start = Math.max(0, Math.min(currentIndex - 2, count - visible));
      for (var i = start; i < start + visible; i++) {
        var dot = document.createElement('i');
        var fromStart = i - start;
        var fromEnd = start + visible - 1 - i;
        var size = 8;
        if (start + visible < count) { if (fromEnd === 0) size = 4; else if (fromEnd === 1) size = 6; }
        if (start > 0) { if (fromStart === 0) size = 4; else if (fromStart === 1) size = 6; }
        dot.style.width = dot.style.height = size + 'px';
        if (i === currentIndex) dot.setAttribute('data-on', '');
        dotsEl.appendChild(dot);
      }
    }

    function syncHeader() {
      /* The large title fades out over the first 40 pt of deck scroll. */
      var p = U.clamp(pagesEl.scrollTop / 40, 0, 1);
      if (largeEl) largeEl.style.opacity = String(1 - p);
      if (compactEl) compactEl.style.opacity = String(p);
    }

    function syncDots() {
      var index = Math.round(pagesEl.scrollTop / Math.max(pagesEl.clientHeight, 1));
      if (index !== currentIndex) {
        currentIndex = index;
        buildDots();
      }
      /* draw a page in the first time it is reached */
      var page = pages[index];
      if (page && !page.el.hasAttribute('data-drawn')) {
        page.el.setAttribute('data-drawn', '');
        render(true);
      }
    }

    pagesEl.addEventListener('scroll', function () {
      syncHeader();
      window.clearTimeout(pagesEl._t);
      pagesEl._t = window.setTimeout(syncDots, 60);
    });

    /* ----------------------------------------------------------- boot */

    buildSummaryPage();
    buildFlowPage();
    buildMoodPage();
    buildActivityPage();
    buildDots();
    syncHeader();
    render(false);

    segs.forEach(function (record) {
      record.buttons.forEach(function (button) {
        button.setAttribute(
          'aria-selected', String(button.getAttribute('data-window-key') === windowKey)
        );
      });
      placePill(record, false);
    });

    function drawIn() {
      pages[0].el.setAttribute('data-drawn', '');
      if (pages[1]) pages[1].el.setAttribute('data-drawn', '');
      render(true);
    }

    if (L.motion.reduced()) {
      pages.forEach(function (p) { p.el.setAttribute('data-drawn', ''); });
      render(false);
    } else {
      L.inView(root, function () {
        /* stagger the three blocks' first draw by 80 ms, as §10.4 recommends */
        setTimeout(drawIn, 80);
      }, { threshold: 0.25 });
    }

    root.addEventListener('lunel:lang', function () {
      lang = L.i18n.langOf(root);
      root.querySelectorAll('[data-block-title]').forEach(function (el) {
        el.textContent = L.i18n.t(el.getAttribute('data-block-title'), lang, []);
      });
      root.querySelectorAll('[data-seg-label]').forEach(function (el) {
        el.textContent = L.i18n.t(el.getAttribute('data-seg-label'), lang, []);
      });
      if (headerEl) L.i18n.apply(headerEl, lang);
      render(false);
      segs.forEach(function (record) { placePill(record, false); });
    });

    return {
      setWindow: function (key) { setWindow(key, { animate: true }); },
      toggleWindow: function () { setWindow(windowKey === 'last3' ? 'all' : 'last3', { animate: true }); },
      goTo: function (index) {
        pagesEl.scrollTo({
          top: U.clamp(index, 0, pages.length - 1) * pagesEl.clientHeight,
          behavior: L.motion.reduced() ? 'auto' : 'smooth'
        });
        setTimeout(syncDots, 500);
      },
      playIn: function () {
        pages.forEach(function (p) { p.el.removeAttribute('data-drawn'); });
        render(false);
        requestAnimationFrame(function () { setTimeout(drawIn, 60); });
      },
      get window() { return windowKey; }
    };
  });
})();
