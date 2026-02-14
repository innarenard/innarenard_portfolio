(function () {
  var nav = document.querySelector('.nav-menu-2');
  var button = document.querySelector('.menu-button');

  if (!nav || !button) return;

  function toggleMenu() {
    var isOpen = nav.hasAttribute('data-nav-menu-open');
    if (isOpen) {
      nav.removeAttribute('data-nav-menu-open');
      button.classList.remove('w--open');
    } else {
      nav.setAttribute('data-nav-menu-open', '');
      button.classList.add('w--open');
      requestAnimationFrame(function () {
        window.dispatchEvent(new CustomEvent('lang-switcher-update'));
      });
    }
  }

  function closeMenu() {
    nav.removeAttribute('data-nav-menu-open');
    button.classList.remove('w--open');
  }

  button.addEventListener('click', toggleMenu);

  nav.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('click', function (e) {
    if (nav.hasAttribute('data-nav-menu-open') && !nav.contains(e.target) && !button.contains(e.target)) {
      closeMenu();
    }
  });
})();
