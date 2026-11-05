/* ==========================================================================
   Модалка кейса Lunel на главной
   --------------------------------------------------------------------------
   Обложка Lunel в стопке (.case-door / .case-project) — обычная ссылка на
   lunel/, а шторку js/panel.js открывает только по старой .project-card.
   Поэтому тап по обложке передаётся старой карточке Lunel: открытие, адрес
   /lunel, крестик, прогресс-бар и закрытие остаются общими, ничего не
   переписано. Общие файлы не тронуты.

   Класс panel-open--lunel включает цвета Lunel из lunel/modal.css. Снимается он не на
   закрытии, а при открытии другого кейса — иначе фон перекрашивается в белый
   прямо во время затухания.
   ========================================================================== */

(function () {
  'use strict';

  var MOBILE_BP = 700; // как в js/panel.js: на телефоне шторки нет, идёт переход на страницу
  var card = document.querySelector('.project-card[data-project="lunel"]');
  if (!card) return;

  document.querySelectorAll('#case-lunel .case-door, #case-lunel .case-project').forEach(function (link) {
    link.addEventListener('click', function (e) {
      if (window.innerWidth <= MOBILE_BP) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return; // открыть во вкладке — как у ссылки
      e.preventDefault();
      card.click();
    });
  });

  var body = document.body;
  var wasOpen = body.classList.contains('panel-open');
  // Прямая ссылка /?project=lunel: panel.js открыл шторку раньше, чем подключился этот файл
  if (wasOpen && /\/lunel\/?$/.test(location.pathname)) body.classList.add('panel-open--lunel');
  new MutationObserver(function () {
    var open = body.classList.contains('panel-open');
    if (open && !wasOpen) {
      // panel.js к этому моменту уже сменил адрес на /lunel
      body.classList.toggle('panel-open--lunel', /\/lunel\/?$/.test(location.pathname));
    }
    wasOpen = open;
  }).observe(body, { attributes: true, attributeFilter: ['class'] });
})();
