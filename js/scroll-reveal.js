(function () {
  var elements = document.querySelectorAll('.scroll-reveal');
  if (!elements.length) return;

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    },
    {
      rootMargin: '0px 0px -40px 0px',
      threshold: 0.1
    }
  );

  elements.forEach(function (el) {
    observer.observe(el);
  });
})();
