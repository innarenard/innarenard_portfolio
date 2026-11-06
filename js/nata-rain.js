/* Пока курсор на кружке с натой рядом с «Lisbon», сверху падают
   паштел-де-ната под разным наклоном. Курсор ушёл — новые не появляются,
   уже падающие быстро гаснут. */
(function () {
  var chip = document.querySelector('.hero__chip--nata');
  if (!chip || !Element.prototype.animate) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var SRC = 'images/hero-nata-fall.png';
  var layer = null;
  var timer = null;
  var live = [];

  // Догружаем заранее, чтобы первая не мигнула пустым местом
  new Image().src = SRC;

  function ensureLayer() {
    if (layer) return layer;
    layer = document.createElement('div');
    layer.className = 'nata-rain';
    layer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(layer);
    return layer;
  }

  function rand(a, b) { return a + Math.random() * (b - a); }

  function drop() {
    var img = document.createElement('img');
    img.src = SRC;
    img.alt = '';
    img.className = 'nata-rain__item';

    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var w = Math.round(rand(70, 130));
    var x = rand(-w * 0.3, vw - w * 0.7);
    var tilt = rand(-40, 40);
    var spin = rand(-90, 90);
    var dur = rand(1500, 2400);

    img.style.width = w + 'px';
    img.style.left = x + 'px';
    ensureLayer().appendChild(img);

    var anim = img.animate([
      { transform: 'translateY(' + (-w * 1.2) + 'px) rotate(' + tilt + 'deg)' },
      { transform: 'translateY(' + (vh + w * 0.2) + 'px) rotate(' + (tilt + spin) + 'deg)' }
    ], { duration: dur, easing: 'cubic-bezier(.45, 0, .85, .6)', fill: 'forwards' });

    var item = { img: img, anim: anim };
    live.push(item);
    anim.onfinish = function () { remove(item); };
  }

  function remove(item) {
    var i = live.indexOf(item);
    if (i !== -1) live.splice(i, 1);
    item.img.remove();
  }

  function start() {
    if (timer) return;
    // Первая пачка сразу, чтобы отклик был мгновенным
    for (var i = 0; i < 4; i++) setTimeout(drop, i * 60);
    timer = setInterval(drop, 140);
  }

  function stop() {
    clearInterval(timer);
    timer = null;
    live.slice().forEach(function (item) {
      item.img.animate([{ opacity: 1 }, { opacity: 0 }],
        { duration: 220, easing: 'ease-out', fill: 'forwards' })
        .onfinish = function () { item.anim.cancel(); remove(item); };
    });
  }

  chip.addEventListener('mouseenter', start);
  chip.addEventListener('mouseleave', stop);
  window.addEventListener('blur', stop);
})();
