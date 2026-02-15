(function () {
  var OFFSET_X = 0;
  var OFFSET_Y = 0;
  var rafId = null;
  var lastX = 0;
  var lastY = 0;

  function updatePosition(x, y) {
    var el = document.getElementById('cursor-view-case');
    if (!el) return;
    el.style.left = (x + OFFSET_X) + 'px';
    el.style.top = (y + OFFSET_Y) + 'px';
  }

  function onMove(e) {
    lastX = e.clientX;
    lastY = e.clientY;
    if (rafId === null) {
      rafId = requestAnimationFrame(function () {
        updatePosition(lastX, lastY);
        rafId = null;
      });
    }
  }

  function showCursor(e) {
    var el = document.getElementById('cursor-view-case');
    if (el) {
      el.classList.add('is-visible');
      updatePosition(e.clientX, e.clientY);
    }
  }

  function hideCursor() {
    var el = document.getElementById('cursor-view-case');
    if (el) el.classList.remove('is-visible');
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  function bindCovers() {
    var cursorEl = document.getElementById('cursor-view-case');
    var covers = document.querySelectorAll('.link_image.project-cover');
    if (!cursorEl || !covers.length) return;

    covers.forEach(function (cover) {
      cover.addEventListener('mouseenter', showCursor);
      cover.addEventListener('mousemove', onMove);
      cover.addEventListener('mouseleave', hideCursor);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindCovers);
  } else {
    bindCovers();
  }
})();
