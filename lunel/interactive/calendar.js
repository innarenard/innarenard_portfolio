/* ==========================================================================
   Lunel interactive replicas — Calendar (month list)
   --------------------------------------------------------------------------
   Canned cycle: day 1 = 2026-03-01, length 28, period 5, today = 2026-03-02.
   Past periods are stepped back by the cycle length, future ones forward;
   "predicted" days are the forward ones.

   Four day states only, exactly as CycleMonthCalendarView draws them. There
   is no ovulation colouring in the month grid and none is invented here.
   ========================================================================== */

(function () {
  'use strict';

  var L = window.Lunel;
  if (!L) return;
  var U = L.util;

  L.i18n.extend({
    en: { calendar_cycle_day_phase: 'Cycle day %d of %d · %@', 'Edit period': 'Edit period' },
    ru: { calendar_cycle_day_phase: 'День цикла %d из %d · %@', 'Edit period': 'Edit period' }
  });

  function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function dayDiff(a, b) {
    return Math.round((startOfDay(a) - startOfDay(b)) / 86400000);
  }

  L.define('calendar', function (root) {
    var lang = L.i18n.langOf(root);

    var anchorISO = root.getAttribute('data-anchor') || '2026-03-01';
    var parts = anchorISO.split('-');
    var anchor = new Date(+parts[0], +parts[1] - 1, +parts[2]); /* cycle day 1 */
    var cycleLength = parseInt(root.getAttribute('data-cycle-length'), 10) || 28;
    var periodLength = parseInt(root.getAttribute('data-period-length'), 10) || 5;
    var currentDay = parseInt(root.getAttribute('data-current-day'), 10) || 2;
    var today = L.dates.addDays(anchor, currentDay - 1);

    var titleEl = root.querySelector('[data-cal-title]');
    var weekdaysEl = root.querySelector('[data-weekdays]');
    var scrollEl = root.querySelector('[data-cal-scroll]');
    var todayBtn = root.querySelector('[data-cal-today]');

    var selected = startOfDay(today);
    var cells = [];

    /* Logged entries — canned, only on days that are not in the future. */
    var logged = {};
    (root.getAttribute('data-logged') || '-1,-2,-3,-5,-8,-9,-12,-16,-20,-27,-28,-29,-33,0')
      .split(',')
      .forEach(function (offset) {
        logged[dayKey(L.dates.addDays(today, parseInt(offset, 10)))] = true;
      });

    function dayKey(date) {
      return date.getFullYear() + '-' + date.getMonth() + '-' + date.getDate();
    }

    /* Which cycle day a date falls on, counting whole cycles in either
       direction from the anchor. */
    function cycleDayOf(date) {
      var diff = dayDiff(date, anchor);
      var mod = ((diff % cycleLength) + cycleLength) % cycleLength;
      return mod + 1;
    }

    function isPeriodDay(date) {
      return cycleDayOf(date) <= periodLength;
    }

    function stateOf(date) {
      var delta = dayDiff(date, today);
      if (delta > 0) return isPeriodDay(date) ? 'predicted' : 'future';
      return 'past';
    }

    /* ----------------------------------------------------------- render */

    function firstWeekdayIndex(date) {
      /* Monday-first, as the app's rotated weekday symbols are in both
         shipped locales. */
      return (date.getDay() + 6) % 7;
    }

    function buildWeekdays() {
      weekdaysEl.textContent = '';
      var base = new Date(2026, 2, 2); /* a Monday */
      for (var i = 0; i < 7; i++) {
        var span = document.createElement('span');
        var d = L.dates.addDays(base, i);
        var text;
        try {
          text = new Intl.DateTimeFormat(lang, { weekday: 'narrow' }).format(d);
        } catch (e) {
          text = ['M', 'T', 'W', 'T', 'F', 'S', 'S'][i];
        }
        span.textContent = text.toUpperCase();
        weekdaysEl.appendChild(span);
      }
    }

    function monthLabel(date) {
      var text;
      try {
        text = new Intl.DateTimeFormat(lang, { month: 'long', year: 'numeric' }).format(date);
      } catch (e) {
        text = String(date.getMonth() + 1);
      }
      // Русская локаль даёт «январь 2026 г.» — в заголовке месяца так не пишут
      text = text.replace(/\s*г\.$/, '');
      return text.toLocaleUpperCase(lang);
    }

    function buildMonths() {
      scrollEl.textContent = '';
      cells = [];
      var first = new Date(today.getFullYear(), today.getMonth() - 2, 1);
      for (var m = 0; m < 6; m++) {
        var monthDate = new Date(first.getFullYear(), first.getMonth() + m, 1);
        var section = document.createElement('section');
        section.className = 'lunel-cal__month';
        section.setAttribute('data-month', monthDate.getFullYear() + '-' + monthDate.getMonth());

        var sub = document.createElement('h3');
        sub.className = 'lunel-cal__sub';
        sub.setAttribute('data-month-label', '');
        sub.textContent = monthLabel(monthDate);
        section.appendChild(sub);

        var grid = document.createElement('div');
        grid.className = 'lunel-cal__grid';
        grid.setAttribute('role', 'grid');
        grid.setAttribute('aria-labelledby', '');

        var lead = firstWeekdayIndex(monthDate);
        for (var pad = 0; pad < lead; pad++) {
          var spacer = document.createElement('span');
          spacer.setAttribute('aria-hidden', 'true');
          grid.appendChild(spacer);
        }
        var days = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
        for (var d = 1; d <= days; d++) {
          grid.appendChild(makeCell(new Date(monthDate.getFullYear(), monthDate.getMonth(), d)));
        }
        section.appendChild(grid);
        scrollEl.appendChild(section);
      }
    }

    function makeCell(date) {
      var state = stateOf(date);
      var selectable = state === 'past';
      var el = document.createElement(selectable ? 'button' : 'span');
      el.className = 'lunel-cal__day';
      if (selectable) {
        el.type = 'button';
        el.tabIndex = -1;
      }
      el.setAttribute('role', 'gridcell');
      var disc = document.createElement('b');
      var num = document.createElement('i');
      num.textContent = String(date.getDate());
      el.appendChild(disc);
      el.appendChild(num);
      var entry = { el: el, date: date, state: state, selectable: selectable };
      cells.push(entry);
      paint(entry);
      if (selectable) {
        el.addEventListener('click', function () { select(date); });
        el.addEventListener('keydown', function (event) { onCellKey(event, entry); });
      }
      return el;
    }

    function paint(entry) {
      var el = entry.el;
      var date = entry.date;
      el.setAttribute('data-state', entry.state);
      if (isPeriodDay(date) && entry.state !== 'future') el.setAttribute('data-period', '');
      else el.removeAttribute('data-period');
      if (dayDiff(date, today) === 0) el.setAttribute('data-today', '');
      else el.removeAttribute('data-today');
      if (logged[dayKey(date)] && entry.state === 'past') el.setAttribute('data-logged', '');
      else el.removeAttribute('data-logged');

      var isSelected = dayDiff(date, selected) === 0 && entry.selectable;
      if (isSelected) el.setAttribute('data-selected', '');
      else el.removeAttribute('data-selected');
      if (entry.selectable) el.tabIndex = isSelected ? 0 : -1;

      if (entry.selectable) {
        var day = cycleDayOf(date);
        var phase = L.phase.forDay(day, cycleLength, { periodLength: periodLength });
        el.setAttribute('aria-selected', String(isSelected));
        el.setAttribute(
          'aria-label',
          formatDate(date) + '. ' +
            L.i18n.t('calendar_cycle_day_phase', lang, [
              day, cycleLength, L.i18n.t(phase.title, lang, [])
            ])
        );
      } else {
        el.setAttribute('aria-disabled', 'true');
        el.setAttribute('aria-label', formatDate(date));
      }
    }

    function formatDate(date) {
      try {
        return new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'long' }).format(date);
      } catch (e) {
        return String(date.getDate());
      }
    }

    function repaintAll() {
      for (var i = 0; i < cells.length; i++) paint(cells[i]);
      titleEl.textContent = headerTitle();
      todayBtn.hidden = dayDiff(selected, today) === 0;
    }

    function headerTitle() {
      try {
        var text = new Intl.DateTimeFormat(lang, { month: 'long' }).format(selected);
        return text.charAt(0).toUpperCase() + text.slice(1);
      } catch (e) {
        return '';
      }
    }

    function select(date, options) {
      var next = startOfDay(date);
      if (dayDiff(next, today) > 0) return; /* future days are not tappable */
      selected = next;
      repaintAll();
      var day = cycleDayOf(selected);
      root.dispatchEvent(
        new CustomEvent('lunel:day-select', {
          bubbles: true,
          detail: { date: new Date(selected), cycleDay: day, isPeriod: isPeriodDay(selected) }
        })
      );
      if (!options || options.focus !== false) {
        var hit = findCell(selected);
        if (hit && document.activeElement !== hit.el && options && options.focus) hit.el.focus({ preventScroll: true });
      }
    }

    function findCell(date) {
      for (var i = 0; i < cells.length; i++) {
        if (dayDiff(cells[i].date, date) === 0) return cells[i];
      }
      return null;
    }

    function onCellKey(event, entry) {
      var delta = 0;
      if (event.key === 'ArrowRight') delta = 1;
      else if (event.key === 'ArrowLeft') delta = -1;
      else if (event.key === 'ArrowDown') delta = 7;
      else if (event.key === 'ArrowUp') delta = -7;
      else if (event.key === 'Home') delta = -((entry.date.getDate() - 1));
      else if (event.key === 'End') {
        var last = new Date(entry.date.getFullYear(), entry.date.getMonth() + 1, 0).getDate();
        delta = last - entry.date.getDate();
      } else return;
      event.preventDefault();
      var target = L.dates.addDays(entry.date, delta);
      if (dayDiff(target, today) > 0) return;
      var hit = findCell(target);
      if (!hit || !hit.selectable) return;
      select(target, { focus: false });
      hit.el.focus({ preventScroll: true });
      hit.el.scrollIntoView({ block: 'nearest' });
    }

    todayBtn.addEventListener('click', function () {
      select(today, { focus: false });
      scrollToDate(today);
    });

    function scrollToDate(date) {
      var section = scrollEl.querySelector(
        '[data-month="' + date.getFullYear() + '-' + date.getMonth() + '"]'
      );
      if (section) {
        scrollEl.scrollTo({
          top: section.offsetTop - scrollEl.offsetTop,
          behavior: L.motion.reduced() ? 'auto' : 'smooth'
        });
      }
    }

    root.addEventListener('lunel:lang', function () {
      lang = L.i18n.langOf(root);
      buildWeekdays();
      var labels = scrollEl.querySelectorAll('[data-month-label]');
      var first = new Date(today.getFullYear(), today.getMonth() - 2, 1);
      for (var i = 0; i < labels.length; i++) {
        labels[i].textContent = monthLabel(new Date(first.getFullYear(), first.getMonth() + i, 1));
      }
      repaintAll();
    });

    buildWeekdays();
    buildMonths();
    repaintAll();
    /* open on the current month, as the app does */
    requestAnimationFrame(function () { scrollToDate(today); });

    return {
      select: function (date) { select(date, { focus: false }); scrollToDate(date); },
      selectCycleDay: function (day) {
        var date = L.dates.addDays(anchor, U.clamp(day, 1, cycleLength) - 1);
        select(date, { focus: false });
        scrollToDate(date);
      },
      scrollToToday: function () { scrollToDate(today); },
      get selected() { return new Date(selected); }
    };
  });
})();
