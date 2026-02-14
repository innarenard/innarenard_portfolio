(function () {
  const STORAGE_KEY = 'portfolio-lang';

  const translations = {
    en: {
      name: "Inna Ivanova",
      intro: "Product designer with\u00A05 years of\u00A0experience working in\u00A0product teams. I design apps and web services, and conduct qualitative and quantitative research",
      body1: "• I specialize in\u00A0creating solutions that focus on\u00A0improving user experience while achieving business goals. I manage the entire product development process – <strong>from\u00A0research to\u00A0final implementation</strong>.<br>",
      body2: "• Redesigned the legacy Samokat Darkstore Android application, enabling expansion to\u00A0both iOS and Android platforms, <strong>revisiting outdated solutions, formulating new hypotheses, and enriching the product backlog</strong>.<br>",
      body3: "• Reduced company costs by\u00A0<strong>16\u00A0M per year</strong>, decreased employee workload by\u00A0<strong>10\u00A0%</strong>, and lowered the number of\u00A0canceled orders by\u00A0<strong>5\u00A0%</strong> by\u00A0conducting research and designing a label-printing interface for\u00A0ready-to-eat meals in\u00A0the mobile application (iOS and Android).<br>",
      samokat_title: "Samokat",
      samokat_date: "June\u00A02023 – December\u00A02025",
      samokat_desc: "Russian rapid grocery and ready-to-eat food delivery service operating in\u00A0127 cities and handling up to\u00A0827\u00A0000 orders per\u00A0day",
      view_order_picking: "View order picking",
      order_picking_alt: "Order picking",
      stat_order_1: "-2,3\u00A0% Time to\u00A0Task",
      stat_order_2: "-2 errors",
      stat_order_3: "UX 4,7\u00A0/ 5",
      stat_order_4: "B2B",
      stat_order_5: "2025",
      view_transfers: "View transfers of\u00A0goods",
      transfers_alt: "Transfers of goods",
      stat_transfers_1: "Savings of\u00A04\u00A0M RUB",
      stat_transfers_2: "-5\u00A0% overdue shipments",
      stat_transfers_3: "UX 4,8\u00A0/ 5",
      stat_transfers_4: "B2B",
      stat_transfers_5: "2024",
      view_dark_kitchen: "View dark store kitchen",
      dark_kitchen_alt: "Dark store kitchen",
      stat_kitchen_1: "Savings of\u00A012\u00A0M RUB",
      stat_kitchen_2: "-10\u00A0% workload",
      stat_kitchen_3: "-5\u00A0% canceled orders",
      stat_kitchen_4: "B2B",
      stat_kitchen_5: "2024",
      mes_title: "MES",
      mes_date: "October\u00A02020 – April\u00A02023",
      mes_desc: "Moscow Electronic School is a project for\u00A0teachers aimed at\u00A0creating a high-tech educational environment in\u00A0Moscow schools",
      view_teachers_journal: "View teacher's journal",
      teachers_journal_alt: "Teacher's journal",
      stat_journal_1: "Designed from\u00A0scratch",
      stat_journal_2: "UX 8,1\u00A0/ 10",
      stat_journal_3: "B2B",
      stat_journal_4: "2023",
      view_colleges: "View colleges",
      colleges_alt: "Colleges",
      stat_colleges_1: "Redesign and update",
      stat_colleges_2: "UX 8,9\u00A0/ 10",
      stat_colleges_3: "B2B",
      stat_colleges_4: "2023"
    },
    ru: {
      name: "Инна Иванова",
      intro: "Продуктовый дизайнер с\u00A05-летним опытом работы в\u00A0продуктовых командах. Проектирую приложения и\u00A0веб-сервисы, провожу качественные и\u00A0количественные исследования",
      body1: "• Специализируюсь на\u00A0решениях, которые улучшают пользовательский опыт и\u00A0достигают бизнес-целей. Веду полный цикл разработки продукта — <strong>от\u00A0исследования до\u00A0внедрения</strong>.<br>",
      body2: "• Переработала устаревшее Android-приложение Samokat Darkstore для\u00A0выхода на\u00A0iOS и\u00A0Android, <strong>пересмотрела устаревшие решения, сформулировала гипотезы и\u00A0пополнила бэклог</strong>.<br>",
      body3: "• Снизила расходы компании на\u00A0<strong>16\u00A0млн в\u00A0год</strong>, нагрузку сотрудников на\u00A0<strong>10\u00A0%</strong> и\u00A0долю отменённых заказов на\u00A0<strong>5\u00A0%</strong> за\u00A0счёт исследований и\u00A0дизайна интерфейса печати этикеток для\u00A0готовых блюд в\u00A0мобильном приложении (iOS и\u00A0Android).<br>",
      samokat_title: "Самокат",
      samokat_date: "Июнь\u00A02023 – декабрь\u00A02025",
      samokat_desc: "Сервис быстрой доставки продуктов и\u00A0готовой еды в\u00A0127 городах, до\u00A0827\u00A0000 заказов в\u00A0день",
      view_order_picking: "Сбор заказов",
      order_picking_alt: "Сбор заказов",
      stat_order_1: "-2,3\u00A0% время на\u00A0задачу",
      stat_order_2: "-2 ошибки",
      stat_order_3: "UX 4,7\u00A0/ 5",
      stat_order_4: "B2B",
      stat_order_5: "2025",
      view_transfers: "Перемещения товаров",
      transfers_alt: "Перемещения товаров",
      stat_transfers_1: "Экономия 4\u00A0млн\u00A0₽",
      stat_transfers_2: "-5\u00A0% просроченных отправок",
      stat_transfers_3: "UX 4,8\u00A0/ 5",
      stat_transfers_4: "B2B",
      stat_transfers_5: "2024",
      view_dark_kitchen: "Тёмная кухня",
      dark_kitchen_alt: "Тёмная кухня",
      stat_kitchen_1: "Экономия 12\u00A0млн\u00A0₽",
      stat_kitchen_2: "-10\u00A0% нагрузка",
      stat_kitchen_3: "-5\u00A0% отменённых заказов",
      stat_kitchen_4: "B2B",
      stat_kitchen_5: "2024",
      mes_title: "МЭШ",
      mes_date: "Октябрь\u00A02020 – апрель\u00A02023",
      mes_desc: "Московская электронная школа — проект для\u00A0учителей, создание высокотехнологичной образовательной среды в\u00A0школах Москвы",
      view_teachers_journal: "Журнал учителя",
      teachers_journal_alt: "Журнал учителя",
      stat_journal_1: "Спроектировано с\u00A0нуля",
      stat_journal_2: "UX 8,1\u00A0/ 10",
      stat_journal_3: "B2B",
      stat_journal_4: "2023",
      view_colleges: "Колледжи",
      colleges_alt: "Колледжи",
      stat_colleges_1: "Редизайн и\u00A0обновление",
      stat_colleges_2: "UX 8,9\u00A0/ 10",
      stat_colleges_3: "B2B",
      stat_colleges_4: "2023"
    }
  };

  function getLang() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && (saved === 'en' || saved === 'ru')) return saved;
    return 'en';
  }

  function setLang(lang) {
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang === 'ru' ? 'ru' : 'en';
    applyTranslations(lang);
    enableSwitcherAnimation();
    updateSwitcher(lang);
  }

  function applyTranslations(lang) {
    const t = translations[lang];
    if (!t) return;
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      const key = el.getAttribute('data-i18n');
      const value = t[key];
      if (value != null) {
        if (value.indexOf('<') !== -1) {
          el.innerHTML = value;
        } else {
          el.textContent = value;
        }
      }
    });
    document.querySelectorAll('[data-i18n-alt]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-alt');
      var val = t[key];
      if (val != null) el.setAttribute('alt', val);
    });
  }

  function updateSwitcher(lang) {
    document.querySelectorAll('.lang-switcher').forEach(function (switcher) {
      var track = switcher.querySelector('.lang-switcher__track');
      var activeBtn = switcher.querySelector('.lang-switcher__btn[data-lang="' + lang + '"]');
      switcher.querySelectorAll('.lang-switcher__btn[data-lang]').forEach(function (btn) {
        btn.classList.toggle('lang-switcher__active', btn.getAttribute('data-lang') === lang);
        btn.setAttribute('aria-current', btn.getAttribute('data-lang') === lang ? 'true' : 'false');
      });
      if (track && activeBtn) {
        var trackPaddingLeft = parseFloat(window.getComputedStyle(track).paddingLeft) || 0;
        track.style.setProperty('--thumb-width', activeBtn.offsetWidth + 'px');
        track.style.setProperty('--thumb-left', (activeBtn.offsetLeft - trackPaddingLeft) + 'px');
      }
    });
  }

  function enableSwitcherAnimation() {
    document.querySelectorAll('.lang-switcher').forEach(function (switcher) {
      switcher.classList.add('lang-switcher--animated');
    });
  }

  function init() {
    var lang = getLang();
    document.documentElement.lang = lang === 'ru' ? 'ru' : 'en';
    applyTranslations(lang);
    updateSwitcher(lang);
    requestAnimationFrame(function () {
      updateSwitcher(lang);
    });

    window.addEventListener('resize', function () { updateSwitcher(getLang()); });
    window.addEventListener('lang-switcher-update', function () { updateSwitcher(getLang()); });

    document.querySelectorAll('.lang-switcher [data-lang]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var l = this.getAttribute('data-lang');
        if (l && (l === 'en' || l === 'ru')) setLang(l);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
