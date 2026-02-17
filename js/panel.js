(function () {
  var panel = document.getElementById('projectPanel');
  var panelScroll = document.getElementById('panelScroll') || (panel ? panel.querySelector('.project-panel__scroll') : null);
  var panelBody = document.getElementById('panelBody');
  var panelClose = document.getElementById('panelClose');
  var overlay = document.getElementById('panelOverlay');
  var scrollIndicator = document.getElementById('panelScrollIndicator');
  var scrollIndicatorFill = document.getElementById('panelScrollIndicatorFill');
  var MOBILE_BP = 991;
  var currentCard = null;
  var cache = {};

  if (!panel || !panelBody) return;

  function isMobile() {
    return window.innerWidth <= MOBILE_BP;
  }

  function fixImagePaths(html, href) {
    return html.replace(/src="\.\.\/images\//g, 'src="images/');
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
    container.querySelectorAll('.block_100, .block_60, .div-block-29, .div-block-42, .div-block-43, .div-block-44, .div-block-45, .div-block-46, .div-block-47, .div-block-48, .div-block-49, .div-block-50, .div-block-51, .div-block-52, .div-block-53, .div-block-54').forEach(function (el) {
      if (!el.textContent.trim() && !el.querySelector('img')) {
        el.remove();
      }
    });
  }

  function applyI18n(container) {
    var lang = document.documentElement.lang || 'en';
    if (typeof window._i18nTranslations === 'undefined') return;
    var t = window._i18nTranslations[lang];
    if (!t) return;
    container.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      var value = t[key];
      if (value != null) {
        if (value.indexOf('<') !== -1) {
          el.innerHTML = value;
        } else {
          el.textContent = value;
        }
      }
    });
    container.querySelectorAll('[data-i18n-alt]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-alt');
      var val = t[key];
      if (val != null) el.setAttribute('alt', val);
    });
  }

  function loadCaseContent(href) {
    if (cache[href]) {
      return Promise.resolve(cache[href]);
    }
    return fetch(href + 'index.html')
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
        var result = main.innerHTML;
        result = fixImagePaths(result, href);
        cache[href] = result;
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

  function openPanel(card) {
    currentCard = card;
    var href = card.getAttribute('data-href') || '';
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
    history.pushState({ panel: true }, '', '');

    loadCaseContent(href)
      .then(function (html) {
        if (currentCard !== card) return;
        panelBody.innerHTML = '<div class="panel-case">' + html + '</div>';
        applyI18n(panelBody);
        if (panelScroll) panelScroll.scrollTop = 0;
        updateScrollIndicator();
      })
      .catch(function () {
        if (currentCard !== card) return;
        panelBody.innerHTML = '<div class="panel-error">Could not load case</div>';
      });
  }

  function closePanel() {
    document.body.classList.remove('panel-open', 'panel-open--samokat', 'panel-open--mes');
    document.documentElement.style.overflow = '';
    panel.setAttribute('aria-hidden', 'true');
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
      if (href) window.location.href = href;
      return;
    }
    openPanel(card);
  }

  if (panelScroll && scrollIndicator) {
    panelScroll.addEventListener('scroll', updateScrollIndicator);
    window.addEventListener('resize', updateScrollIndicator);
  }

  document.querySelectorAll('.project-card').forEach(function (card) {
    card.addEventListener('click', handleCardClick);
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

  // Open project panel from URL (e.g. /?project=order-picking) when coming from /order-picking/
  (function () {
    var match = /[?&]project=([^&]+)/.exec(location.search);
    if (match) {
      var id = match[1].replace(/\/$/, '');
      var card = document.querySelector('.project-card[data-project="' + id + '"]');
      if (card) {
        openPanel(card);
        history.replaceState({ panel: true }, '', location.pathname || '/');
      }
    }
  })();
})();
