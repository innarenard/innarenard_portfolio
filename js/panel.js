(function () {
  var panel = document.getElementById('projectPanel');
  var panelScroll = document.getElementById('panelScroll') || (panel ? panel.querySelector('.project-panel__scroll') : null);
  var panelBody = document.getElementById('panelBody');
  var panelClose = document.getElementById('panelClose');
  var overlay = document.getElementById('panelOverlay');
  var scrollIndicator = document.getElementById('panelScrollIndicator');
  var scrollIndicatorFill = document.getElementById('panelScrollIndicatorFill');
  var MOBILE_BP = 700;
  var currentCard = null;

  // Capture the root path once at startup to ensure relative paths work regardless of pushState
  var initialPath = window.location.pathname;
  var SITE_ROOT = initialPath.endsWith('/') ? initialPath : initialPath.replace(/\/[^/]*$/, '/');

  if (!panel || !panelBody) return;

  function isMobile() {
    return window.innerWidth <= MOBILE_BP;
  }

  // Язык, выбранный человеком, живёт в адресе (см. js/i18n.js) и должен
  // переезжать вместе с ним в адрес кейса — иначе скопированная из шторки
  // ссылка потеряет язык
  function langQuery() {
    var m = /[?&]lang=(en|ru)(?:&|$)/.exec(window.location.search);
    return m ? '?lang=' + m[1] : '';
  }

  function fixImagePaths(html, href) {
    // Use SITE_ROOT to ensure images match the actual location on the server
    var imageBase = SITE_ROOT + 'images/';
    html = html.replace(/src="\.\.\/images\//g, 'src="' + imageBase);
    html = html.replace(/data-i18n-src="\.\.\/images\//g, 'data-i18n-src="' + imageBase);
    html = html.replace(/poster="\.\.\/images\//g, 'poster="' + imageBase);
    html = html.replace(/data-i18n-poster="\.\.\/images\//g, 'data-i18n-poster="' + imageBase);
    return html;
  }

  function stripHeaderFooter(doc) {
    var header = doc.querySelector('header');
    if (header) header.remove();
    var footer = doc.querySelector('footer');
    if (footer) footer.remove();
    var navbars = doc.querySelectorAll('.section_navbar, .lang-switcher');
    navbars.forEach(function (el) { el.remove(); });
  }

  function removeScrollRevealHidden(container) {
    container.querySelectorAll('.scroll-reveal').forEach(function (el) {
      el.classList.remove('scroll-reveal');
      el.classList.add('is-visible');
    });
  }

  function removeEmptySpacers(container) {
    container.querySelectorAll('.spacer-56, .spacer-40, .content-spacer').forEach(function (el) {
      if (!el.textContent.trim() && !el.querySelector('img')) {
        el.remove();
      }
    });
  }

  function removeEmptyContentBlocks(container) {
    container.querySelectorAll('.content-block').forEach(function (el) {
      if (!el.textContent.trim() && !el.querySelector('img') && !el.querySelector('video')) {
        el.remove();
      }
    });
  }

  // Перевод вставленного кейса делает js/i18n.js: там же запоминается
  // английский оригинал, иначе возврат на английский достать будет неоткуда
  function applyI18n(container) {
    if (typeof window.i18nApply === 'function') window.i18nApply(container);
  }

  function loadCaseContent(href) {
    // Ensure we use the absolute site path for fetch to avoid 404 when URL changes
    var fetchUrl = SITE_ROOT + href + 'index.html?t=' + Date.now();
    return fetch(fetchUrl)
      .then(function (res) {
        if (!res.ok) throw new Error('Not found');
        return res.text();
      })
      .then(function (html) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(html, 'text/html');
        stripHeaderFooter(doc);
        var main = doc.querySelector('.section_content') || doc.querySelector('main');
        if (!main) return '';
        removeScrollRevealHidden(main);
        removeEmptySpacers(main);
        removeEmptyContentBlocks(main);
        var result = main.innerHTML;
        result = fixImagePaths(result, href);
        return result;
      });
  }

  function showLoading() {
    panelBody.innerHTML = '<div class="panel-loading"><div class="panel-spinner"></div></div>';
  }

  var scrollIndicatorRaf = null;
  var scrollIndicatorLastScrollTop = 0;
  var scrollIndicatorLastPct = 0;
  function updateScrollIndicator() {
    if (!panelScroll || !scrollIndicator || !scrollIndicatorFill) return;
    if (scrollIndicatorRaf) return;
    scrollIndicatorRaf = requestAnimationFrame(function () {
      scrollIndicatorRaf = null;
      var scrollTop = panelScroll.scrollTop;
      var scrollHeight = panelScroll.scrollHeight;
      var clientHeight = panelScroll.clientHeight;
      var maxScroll = scrollHeight - clientHeight;
      if (maxScroll <= 0) {
        scrollIndicator.classList.remove('is-visible');
        return;
      }
      scrollIndicator.classList.add('is-visible');
      var pct = Math.min(100, (scrollTop / maxScroll) * 100);
      if (pct >= scrollIndicatorLastPct) {
        scrollIndicatorLastPct = pct;
      } else if (scrollTop < scrollIndicatorLastScrollTop) {
        scrollIndicatorLastPct = pct;
      }
      scrollIndicatorLastScrollTop = scrollTop;
      scrollIndicatorFill.style.width = scrollIndicatorLastPct + '%';
    });
  }
  function resetScrollIndicatorState() {
    scrollIndicatorLastScrollTop = 0;
    scrollIndicatorLastPct = 0;
  }

  // GoatCounter считает только настоящие загрузки страниц и не видит history.pushState,
  // поэтому открытия кейсов в шторке раньше вообще не попадали в статистику
  function trackPanelView(path, card) {
    if (!window.goatcounter || typeof window.goatcounter.count !== 'function') return;
    var titleEl = card.querySelector('.project-card__caption-title');
    window.goatcounter.count({
      path: path,
      title: titleEl ? titleEl.textContent.trim() : document.title,
      event: false
    });
  }

  function openPanel(card, options) {
    var track = !(options && options.track === false);
    currentCard = card;
    var href = card.getAttribute('data-href') || '';
    // Start loading BEFORE changing the URL to ensure correct relative path resolution
    var contentPromise = loadCaseContent(href);

    showLoading();
    if (panelScroll) panelScroll.scrollTop = 0;
    if (scrollIndicator && scrollIndicatorFill) {
      scrollIndicator.classList.remove('is-visible');
      scrollIndicatorFill.style.width = '0%';
      resetScrollIndicatorState();
    }
    panel.setAttribute('aria-hidden', 'false');
    document.body.classList.add('panel-open');
    if (card.closest('#samokat')) {
      document.body.classList.add('panel-open--samokat');
    } else if (card.closest('#mes')) {
      document.body.classList.add('panel-open--mes');
    }
    document.documentElement.style.overflow = 'hidden';

    // Update URL without trailing slash for a clean aesthetic
    var pushUrl = (SITE_ROOT + href).replace(/\/$/, '') + langQuery();
    history.pushState({ panel: true }, '', pushUrl);
    // В адресной строке слеш в конце не нужен, а счётчику отдаём путь со слешем:
    // так заход в шторку и заход по прямой ссылке сходятся в одну строку статистики
    if (track) trackPanelView(SITE_ROOT + href, card);

    contentPromise
      .then(function (html) {
        if (currentCard !== card) return;
        panelBody.innerHTML = '<div class="panel-case">' + html + '</div>';
        applyI18n(panelBody);
        if (panelScroll) panelScroll.scrollTop = 0;
        updateScrollIndicator();
      })
      .catch(function (err) {
        console.error('Failed to load project:', err);
        if (currentCard !== card) return;
        panelBody.innerHTML = '<div class="panel-error">Could not load case</div>';
      });
  }

  function closePanel() {
    document.body.classList.remove('panel-open', 'panel-open--samokat', 'panel-open--mes');
    document.documentElement.style.overflow = '';
    panel.setAttribute('aria-hidden', 'true');
    if (currentCard) {
      currentCard.blur();
    }
    currentCard = null;
    resetScrollIndicatorState();
  }

  function handleCardClick(e) {
    var card = e.target.closest('.project-card');
    if (!card) return;
    e.preventDefault();
    e.stopPropagation();

    if (isMobile()) {
      var href = card.getAttribute('data-href');
      // на телефоне шторки нет, уходим на страницу кейса — язык берём с собой
      if (href) window.location.href = href + langQuery();
      return;
    }
    openPanel(card);
  }

  // Отдельная страница кейса показывает ту же панель, но содержимое в ней
  // уже лежит в разметке: карточек нет, openPanel никто не зовёт, закрывать нечего
  var isStandaloneCase = !document.querySelector('.project-card');

  if (panelScroll && scrollIndicator) {
    panelScroll.addEventListener('scroll', updateScrollIndicator);
    window.addEventListener('resize', updateScrollIndicator);
  }

  if (isStandaloneCase) {
    updateScrollIndicator();
    return;
  }

  document.querySelectorAll('.project-card').forEach(function (card) {
    card.addEventListener('click', handleCardClick);
  });

  // Обложки и названия кейсов в стопке — обычные ссылки на страницу кейса.
  // Без перехвата клик уводил на отдельную страницу, а её крестик грузил главную
  // заново, с первого экрана. Теперь на десктопе они открывают ту же шторку,
  // что и карточка кейса, и после закрытия человек остаётся там, откуда нажал
  // В карточке проекта ссылка только на стрелке: тап по названию никуда не ведёт
  document.querySelectorAll('.case-door, .case-project__arrow').forEach(function (link) {
    var card = document.querySelector('.project-card[data-href="' + link.getAttribute('href') + '"]');
    if (!card) return;
    link.addEventListener('click', function (e) {
      if (isMobile()) return; // на телефоне шторки нет — обычный переход по ссылке
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return; // во вкладку — как у ссылки
      e.preventDefault();
      openPanel(card);
    });
  });

  if (panelClose) {
    panelClose.addEventListener('click', function () {
      closePanel();
      if (history.state && history.state.panel) history.back();
    });
  }
  if (overlay) {
    overlay.addEventListener('click', function () {
      closePanel();
      if (history.state && history.state.panel) history.back();
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && document.body.classList.contains('panel-open')) {
      closePanel();
      if (history.state && history.state.panel) history.back();
    }
  });

  window.addEventListener('popstate', function () {
    if (document.body.classList.contains('panel-open')) {
      closePanel();
    }
  });

  // Open project panel from URL (e.g. /?project=order-picking)
  (function () {
    var match = /[?&]project=([^&]+)/.exec(location.search);
    if (match) {
      var id = match[1].replace(/\/$/, '');
      var card = document.querySelector('.project-card[data-project="' + id + '"]');
      if (card) {
        // Clean URL to plain site root before opening panel to ensure clean state.
        // Язык из адреса при этом сохраняем
        history.replaceState(null, '', SITE_ROOT.replace(/\/$/, '/') + langQuery());
        // Эту загрузку уже посчитал count.js — второй раз не считаем
        openPanel(card, { track: false });
      }
    }
  })();
})();
