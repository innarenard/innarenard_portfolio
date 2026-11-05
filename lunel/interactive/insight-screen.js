/* ==========================================================================
   Lunel interactive replicas — AI insight screen (state 5, Ready)
   --------------------------------------------------------------------------
   The screen a Home insight card pushes: AIInsightScreenView with the Mood
   card's content. Mood is the one card the app carries in both languages —
   `AIInsightRussianFlowDemo` holds the Russian paragraphs next to the English
   ones, so nothing in here is translated by hand. The meta, callout and
   footnote come from `AIInsightScreenContent+Demo` and
   `insight_footnote_two_cycles`.
   ========================================================================== */

(function () {
  'use strict';

  var L = window.Lunel;
  if (!L) return;

  L.i18n.extend({
    en: {
      insight_card_mood: 'Mood',
      insight_ready_meta: 'Updated March 15 · 2 cycles · 34 logs',
      insight_callout:
        'In 58 days you logged mood on 34 days across two cycles — enough to see where it moves.',
      insight_p1:
        'You logged mood on 34 of the last 58 days, spread evenly across two cycles.',
      insight_p2:
        'Calm entries fall more often in the first half of the cycle, from day 6 to day 13 — that is where two thirds of your calm days sit, in both recorded cycles.',
      insight_p3:
        'The two lowest stretches both landed in the three days before a period started, and both lasted two days.',
      insight_p4:
        'Energy dips later than mood, around the period itself, and comes back within two days.',
      insight_footnote_two_cycles:
        'For now this is a picture from two cycles — the third will show what holds and what was a one-off.'
    },
    ru: {
      insight_card_mood: 'Настроение',
      insight_ready_meta: 'Обновлено 15 марта · 2 цикла · 34 записи',
      insight_callout:
        'За 58 дней вы отметили настроение в 34 днях по двум циклам — этого хватает, чтобы увидеть, как оно движется.',
      insight_p1:
        'Настроение вы отмечали 34 дня из последних 58, ровно по 2 циклам.',
      insight_p2:
        'Спокойные дни чаще приходятся на первую половину цикла, с 6-го по 13-й день — там лежит 2 трети ваших спокойных дней, в обоих записанных циклах.',
      insight_p3:
        'Два самых низких отрезка оба пришлись на 3 дня перед началом месячных и оба длились по 2 дня.',
      insight_p4:
        'Энергия проседает позже настроения, ближе к самим месячным, и возвращается за 2 дня.',
      insight_footnote_two_cycles:
        'Пока это картина по двум циклам — третий покажет, что держится, а что было разовым.'
    }
  });

  var PARAGRAPHS = ['insight_p1', 'insight_p2', 'insight_p3', 'insight_p4'];

  L.define('insight-screen', function (root) {
    var lang = L.i18n.langOf(root);

    /* navHeader: ⌀44 back (Text/Dark grey) and copy (Text/Grey) on White/Medium
       tinted glass, 4pt under the safe area, 12 above the title. Hosts that
       only want the text (the home page collage) pass data-no-nav. */
    var nav = root.hasAttribute('data-no-nav') ? '' :
      '<div class="lunel-insight__nav">' +
      '<button type="button" class="lunel-insight__navbtn lunel-insight__navbtn--back" data-i18n-label="Back" aria-label="Back">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5698 5.93005L3.4998 12.0001L9.5698 18.0701M20.4997 12H3.66973"/></svg></button>' +
      '<button type="button" class="lunel-insight__navbtn lunel-insight__navbtn--copy" data-i18n-label="Copy" aria-label="Copy">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.9998 12.9V17.1C15.9998 20.6 14.5998 22 11.0998 22H6.89981C3.3998 22 1.9998 20.6 1.9998 17.1V12.9C1.9998 9.40002 3.3998 8.00002 6.89981 8.00002H11.0998M15.9998 12.9C15.9998 9.40002 14.5998 8.00002 11.0998 8.00002M15.9998 12.9V16H17.0998C20.5998 16 21.9998 14.6 21.9998 11.1V6.90002C21.9998 3.40002 20.5998 2.00002 17.0998 2.00002H12.8998C9.3998 2.00002 7.9998 3.40002 7.9998 6.90002V8.00002H11.0998"/></svg></button>' +
      '</div>';

    root.innerHTML = nav +
      '<article class="lunel-insight">' +
      '<div class="lunel-insight__head">' +
      '<h2 class="lunel-h2 lunel-insight__title" data-title></h2>' +
      '<p class="lunel-body4 lunel-insight__meta" data-meta></p>' +
      '</div>' +
      '<div class="lunel-insight__callout">' +
      '<span class="lunel-insight__bar" aria-hidden="true"></span>' +
      '<p class="lunel-body4" data-callout></p>' +
      '</div>' +
      '<div class="lunel-insight__text" data-text></div>' +
      '</article>';

    var title = root.querySelector('[data-title]');
    var meta = root.querySelector('[data-meta]');
    var callout = root.querySelector('[data-callout]');
    var text = root.querySelector('[data-text]');

    var paragraphs = PARAGRAPHS.map(function () {
      var p = document.createElement('p');
      p.className = 'lunel-body2';
      text.appendChild(p);
      return p;
    });

    var footnote = document.createElement('p');
    footnote.className = 'lunel-caption1 lunel-insight__footnote';
    text.appendChild(footnote);

    function render() {
      title.textContent = L.i18n.t('insight_card_mood', lang, []);
      meta.textContent = L.i18n.t('insight_ready_meta', lang, []);
      callout.textContent = L.i18n.t('insight_callout', lang, []);
      paragraphs.forEach(function (p, i) {
        p.textContent = L.i18n.t(PARAGRAPHS[i], lang, []);
      });
      footnote.textContent = L.i18n.t('insight_footnote_two_cycles', lang, []);
    }

    render();

    root.addEventListener('lunel:lang', function () {
      lang = L.i18n.langOf(root);
      render();
    });

    return { render: render };
  });
})();
