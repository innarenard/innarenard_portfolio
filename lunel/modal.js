/* ==========================================================================
   Модалка кейса Lunel на главной
   --------------------------------------------------------------------------
   Открытие по обложке в стопке, адрес /lunel, крестик, прогресс-бар и закрытие —
   общие, из js/panel.js, как у всех кейсов.

   Класс panel-open--lunel включает цвета Lunel из lunel/modal.css. Снимается он не на
   закрытии, а при открытии другого кейса — иначе фон перекрашивается в белый
   прямо во время затухания.
   ========================================================================== */

(function () {
  'use strict';

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
