(function () {
  const STORAGE_KEY = 'portfolio-lang';

  const translations = {
    en: {
      name: "Inna Ivanova",
      intro: "Product designer with 5 years of experience working in product teams. I design apps and web services, and conduct qualitative and quantitative research",
      body1: "• I specialize in creating solutions that focus on improving user experience while achieving business goals. I manage the entire product development process – <strong>from research to final implementation</strong>.<br>",
      body2: "• Redesigned the legacy Samokat Darkstore Android application, enabling expansion to both iOS and Android platforms, <strong>revisiting outdated solutions, formulating new hypotheses, and enriching the product backlog</strong>.<br>",
      body3: "• Reduced company costs by <strong>16M per year</strong>, decreased employee workload by <strong>10%</strong>, and lowered the number of canceled orders by <strong>5%</strong> by conducting research and designing a label-printing interface for ready-to-eat meals in the mobile application (iOS and Android).<br>",
      samokat_title: "Samokat",
      samokat_date: "June 2023 – December 2025",
      samokat_desc: "Russian rapid grocery and ready-to-eat food delivery service operating in 127 cities and handling up to 827 000 orders per day",
      view_order_picking: "View order picking",
      order_picking_alt: "Order picking",
      stat_order_1: "-2,3% Time to Task",
      stat_order_2: "-2 errors",
      stat_order_3: "UX 4,7 / 5",
      stat_order_4: "B2B",
      stat_order_5: "2025",
      view_transfers: "View transfers of goods",
      transfers_alt: "Transfers of goods",
      stat_transfers_1: "Savings of 4M RUB",
      stat_transfers_2: "-5% overdue shipments",
      stat_transfers_3: "UX 4,8 / 5",
      stat_transfers_4: "B2B",
      stat_transfers_5: "2024",
      view_dark_kitchen: "View dark store kitchen",
      dark_kitchen_alt: "Dark store kitchen",
      stat_kitchen_1: "Savings of 12M RUB",
      stat_kitchen_2: "-10% workload",
      stat_kitchen_3: "-5% canceled orders",
      stat_kitchen_4: "B2B",
      stat_kitchen_5: "2024",
      mes_title: "MES",
      mes_date: "October 2020 – April 2023",
      mes_desc: "Moscow Electronic School is a project for teachers aimed at creating a high-tech educational environment in Moscow schools",
      view_teachers_journal: "View teacher's journal",
      teachers_journal_alt: "Teacher's journal",
      stat_journal_1: "Designed from scratch",
      stat_journal_2: "UX 8,1 / 10",
      stat_journal_3: "B2B",
      stat_journal_4: "2023",
      view_colleges: "View colleges",
      colleges_alt: "Colleges",
      stat_colleges_1: "Redesign and update",
      stat_colleges_2: "UX 8,9 / 10",
      stat_colleges_3: "B2B",
      stat_colleges_4: "2023"
    },
    ru: {
      name: "Инна Иванова",
      intro: "Продуктовый дизайнер с 5-летним опытом работы в продуктовых командах. Проектирую приложения и веб-сервисы, провожу качественные и количественные исследования",
      body1: "• Специализируюсь на решениях, которые улучшают пользовательский опыт и достигают бизнес-целей. Веду полный цикл разработки продукта — <strong>от исследования до внедрения</strong>.<br>",
      body2: "• Переработала устаревшее Android-приложение Samokat Darkstore для выхода на iOS и Android, <strong>пересмотрела устаревшие решения, сформулировала гипотезы и пополнила бэклог</strong>.<br>",
      body3: "• Снизила расходы компании на <strong>16 млн в год</strong>, нагрузку сотрудников на <strong>10%</strong> и долю отменённых заказов на <strong>5%</strong> за счёт исследований и дизайна интерфейса печати этикеток для готовых блюд в мобильном приложении (iOS и Android).<br>",
      samokat_title: "Самокат",
      samokat_date: "Июнь 2023 – декабрь 2025",
      samokat_desc: "Сервис быстрой доставки продуктов и готовой еды в 127 городах, до 827 000 заказов в день",
      view_order_picking: "Сбор заказов",
      order_picking_alt: "Сбор заказов",
      stat_order_1: "-2,3% время на задачу",
      stat_order_2: "-2 ошибки",
      stat_order_3: "UX 4,7 / 5",
      stat_order_4: "B2B",
      stat_order_5: "2025",
      view_transfers: "Перемещения товаров",
      transfers_alt: "Перемещения товаров",
      stat_transfers_1: "Экономия 4 млн ₽",
      stat_transfers_2: "-5% просроченных отправок",
      stat_transfers_3: "UX 4,8 / 5",
      stat_transfers_4: "B2B",
      stat_transfers_5: "2024",
      view_dark_kitchen: "Тёмная кухня",
      dark_kitchen_alt: "Тёмная кухня",
      stat_kitchen_1: "Экономия 12 млн ₽",
      stat_kitchen_2: "-10% нагрузка",
      stat_kitchen_3: "-5% отменённых заказов",
      stat_kitchen_4: "B2B",
      stat_kitchen_5: "2024",
      mes_title: "МЭШ",
      mes_date: "Октябрь 2020 – апрель 2023",
      mes_desc: "Московская электронная школа — проект для учителей, создание высокотехнологичной образовательной среды в школах Москвы",
      view_teachers_journal: "Журнал учителя",
      teachers_journal_alt: "Журнал учителя",
      stat_journal_1: "Спроектировано с нуля",
      stat_journal_2: "UX 8,1 / 10",
      stat_journal_3: "B2B",
      stat_journal_4: "2023",
      view_colleges: "Колледжи",
      colleges_alt: "Колледжи",
      stat_colleges_1: "Редизайн и обновление",
      stat_colleges_2: "UX 8,9 / 10",
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
    document.querySelectorAll('.lang-switcher [data-lang]').forEach(function (btn) {
      btn.classList.toggle('lang-switcher__active', btn.getAttribute('data-lang') === lang);
      btn.setAttribute('aria-current', btn.getAttribute('data-lang') === lang ? 'true' : 'false');
    });
  }

  function init() {
    var lang = getLang();
    document.documentElement.lang = lang === 'ru' ? 'ru' : 'en';
    applyTranslations(lang);
    updateSwitcher(lang);

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
