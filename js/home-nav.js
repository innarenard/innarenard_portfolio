(function () {
  var burger = document.getElementById('burgerBtn');
  var menu = document.getElementById('mobileMenu');

  if (!burger || !menu) return;

  function toggleMenu() {
    var isOpen = menu.classList.contains('is-open');
    if (isOpen) {
      menu.classList.remove('is-open');
      burger.classList.remove('is-open');
      document.body.style.overflow = '';
    } else {
      menu.classList.add('is-open');
      burger.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(function () {
        window.dispatchEvent(new CustomEvent('lang-switcher-update'));
      });
    }
  }

  function closeMenu() {
    menu.classList.remove('is-open');
    burger.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  var closeBtn = document.getElementById('mobileMenuClose');
  if (closeBtn) closeBtn.addEventListener('click', closeMenu);

  burger.addEventListener('click', toggleMenu);

  menu.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) {
      closeMenu();
    }
  });
})();
