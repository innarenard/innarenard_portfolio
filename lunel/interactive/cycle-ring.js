/* ==========================================================================
   Lunel interactive replicas — Living Cycle Ring
   --------------------------------------------------------------------------
   A canned-data replica of the Home ring. No business logic: the cycle is a
   fixed 28 days anchored on a fixed date, and every number on screen is
   derived from the day the visitor has scrubbed to.

   Everything geometric here is ported one-to-one from the app:
     Ring/CycleRing.swift            angles, displacement, proximity scale,
                                     attraction, bridge envelope, reveal
     Ring/DayCircleSizing.swift      circle diameters
     Ring/CycleProgressView.swift    gesture zone, drag → day mapping, springs
     Ring/OrbBackgroundView.swift    the six Lissajous blobs
     MetaballBridge.metal            the SDF smooth-min, re-implemented on a
                                     2D canvas over the bounding box of the
                                     two circles only
   ========================================================================== */

(function () {
  'use strict';

  var L = window.Lunel;
  if (!L) return;
  var U = L.util;
  var RAD = Math.PI / 180;

  /* ------------------------------------------------------------ constants */

  var C = {
    radiusFraction: 0.43,
    angularAmplitude: 48,
    idleStrength: 0.55,
    proxAmplitude: 0.85,
    proxFalloff: 2,
    baseSpacingFraction: 0.48,
    baseMin: 10,
    baseMax: 18,
    selMultShort: 2.0,
    selMultLong: 1.8,
    selMin: 30,
    selMax: 38,
    maxPull: 10,
    innerZone: 0.5,
    outerZone: 1.5,
    noteGap: 4,
    noteSize: 5,
    bridge: {
      fadeInStart: 0.01,
      plateauStart: 0.18,
      plateauEnd: 0.92,
      fadeOutEnd: 1.0,
      kMinFraction: 0.1,
      kMaxFraction: 1.0,
      kDistanceFraction: 0.2,
      closureGapMultiplier: 2.2,
      closurePadding: 0.8,
      accelMin: 1.0,
      accelMax: 1.55,
      referenceSize: 340
    },
    dragRevealStart: 0.1,
    dragRevealFull: 0.98,
    introRingMs: 1000,
    /* "the first 34% of the circles take 62% of the time" → t^2.257 */
    introGamma: Math.log(0.34) / Math.log(0.62),
    introTrigger: 0.5,
    introHighlightDelayMs: 220
  };

  /* OrbBackgroundView.configs, verbatim. */
  var ORBS = [
    { xFreq: 0.31, yFreq: 0.47, xPhase: 0.0, yPhase: 1.0, xAmp: 0.28, yAmp: 0.25, baseSize: 0.42, pulseFreq: 0.23, rot: 8.0, hueShift: -0.04, opacity: 0.55, blur: 28, widthRatio: 0.85 },
    { xFreq: 0.53, yFreq: 0.29, xPhase: 2.1, yPhase: 0.5, xAmp: 0.3, yAmp: 0.32, baseSize: 0.38, pulseFreq: 0.31, rot: -6.0, hueShift: 0.05, opacity: 0.5, blur: 32, widthRatio: 1.15 },
    { xFreq: 0.41, yFreq: 0.63, xPhase: 4.2, yPhase: 2.8, xAmp: 0.22, yAmp: 0.28, baseSize: 0.45, pulseFreq: 0.19, rot: 12.0, hueShift: 0.02, opacity: 0.45, blur: 35, widthRatio: 0.75 },
    { xFreq: 0.67, yFreq: 0.38, xPhase: 1.5, yPhase: 4.1, xAmp: 0.25, yAmp: 0.2, baseSize: 0.35, pulseFreq: 0.27, rot: -9.0, hueShift: -0.03, opacity: 0.58, blur: 22, widthRatio: 1.25 },
    { xFreq: 0.44, yFreq: 0.71, xPhase: 3.7, yPhase: 1.2, xAmp: 0.32, yAmp: 0.26, baseSize: 0.4, pulseFreq: 0.35, rot: 7.0, hueShift: 0.04, opacity: 0.48, blur: 30, widthRatio: 0.9 },
    { xFreq: 0.23, yFreq: 0.51, xPhase: 5.5, yPhase: 3.3, xAmp: 0.15, yAmp: 0.18, baseSize: 0.5, pulseFreq: 0.15, rot: 4.0, hueShift: 0.0, opacity: 0.38, blur: 40, widthRatio: 1.05 }
  ];

  var SPRINGS = {
    displace: L.motion.springEasing(0.3, 0.8),
    dragEnd: L.motion.springEasing(0.25, 0.8),
    select: L.motion.springEasing(0.3, 0.7),
    today: L.motion.springEasing(0.4, 0.7),
    highlight: L.motion.springEasing(0.28, 0.78)
  };

  /* ------------------------------------------------------------- helpers */

  function wrap180(deg) {
    var d = deg;
    while (d > 180) d -= 360;
    while (d < -180) d += 360;
    return d;
  }

  /* A scalar driven by a SwiftUI spring, sampled analytically each frame. */
  function Spring(value) {
    this.value = value;
    this.from = value;
    this.to = value;
    this.start = 0;
    this.duration = 0;
    this.response = 0.3;
    this.damping = 0.8;
  }
  Spring.prototype.animate = function (to, spec, now) {
    if (this.to === to && this.duration && now < this.start + this.duration) return;
    if (L.motion.reduced()) {
      this.value = this.from = this.to = to;
      this.duration = 0;
      return;
    }
    this.from = this.value;
    this.to = to;
    this.start = now;
    this.duration = spec.duration;
    this.response = spec.response;
    this.damping = spec.damping;
  };
  Spring.prototype.set = function (value) {
    this.value = this.from = this.to = value;
    this.duration = 0;
  };
  Spring.prototype.sample = function (now) {
    if (!this.duration) {
      this.value = this.to;
      return this.value;
    }
    var t = (now - this.start) / 1000;
    if (t >= this.duration / 1000) {
      this.duration = 0;
      this.value = this.to;
      return this.value;
    }
    var p = L.motion.springValue(t, this.response, this.damping);
    this.value = this.from + (this.to - this.from) * p;
    return this.value;
  };

  function springSpec(name, response, damping) {
    return {
      duration: SPRINGS[name].duration,
      response: response,
      damping: damping
    };
  }

  var SPEC = {
    displace: springSpec('displace', 0.3, 0.8),
    dragEnd: springSpec('dragEnd', 0.25, 0.8),
    select: springSpec('select', 0.3, 0.7),
    today: springSpec('today', 0.4, 0.7),
    highlight: springSpec('highlight', 0.28, 0.78)
  };

  /* -------------------------------------------------------------- factory */

  L.define('cycle-ring', function (root) {
    var ring = root.querySelector('[data-ring]');
    if (!ring) return null;

    var el = {
      ring: ring,
      orbs: ring.querySelector('[data-orbs]'),
      bridge: ring.querySelector('[data-bridge]'),
      circles: ring.querySelector('[data-circles]'),
      numbers: ring.querySelector('[data-numbers]'),
      center: ring.querySelector('[data-center]'),
      month: ring.querySelector('[data-month]'),
      daynum: ring.querySelector('[data-daynum]'),
      phase: ring.querySelector('[data-phase]'),
      tag: ring.querySelector('[data-tag]'),
      input: ring.querySelector('[data-input]'),
      title: root.querySelector('[data-title]'),
      todayBtn: root.querySelector('[data-today]'),
      device: root.classList.contains('lunel-device') ? root : root.querySelector('.lunel-device')
    };

    var cycleLength = parseInt(root.getAttribute('data-cycle-length'), 10) || 28;
    var currentDay = parseInt(root.getAttribute('data-current-day'), 10) || 2;
    var periodLength = parseInt(root.getAttribute('data-period-length'), 10) || 5;
    var anchorISO = root.getAttribute('data-anchor') || '2026-03-01';
    var anchorParts = anchorISO.split('-');
    var anchorDate = new Date(+anchorParts[0], +anchorParts[1] - 1, +anchorParts[2]);
    var noteDays = {};
    (root.getAttribute('data-notes') || '2,9,17,24').split(',').forEach(function (n) {
      noteDays[parseInt(n, 10)] = true;
    });

    var state = {
      selectedDay: currentDay,
      prevSelectedDay: currentDay,
      size: 0,
      baseSize: 16,
      selSize: 32,
      dragging: false,
      fingerAngle: 0,
      fingerPos: null,
      bridgeSource: null,
      bridgeTarget: null,
      bridgeProgress: 0,
      reveal: 0,
      introStart: 0,
      introPlaying: false,
      introDone: false,
      phaseKey: null,
      lang: L.i18n.langOf(root)
    };

    var disp = new Spring(0);
    var selection = new Spring(1); /* 0 = previous day selected, 1 = current */
    var highlight = new Spring(0);
    selection.set(1);

    /* -------------------------------------------------- geometry (ported) */

    function angleForDay(day) {
      return -90 + (360 / cycleLength) * (day - 1);
    }

    function focusAngle() {
      var idle = angleForDay(state.selectedDay);
      if (disp.value <= 0) return idle;
      return idle + wrap180(state.fingerAngle - idle) * disp.value;
    }

    function strength() {
      return C.idleStrength + (1 - C.idleStrength) * disp.value;
    }

    function effectiveAngle(day, focus, str) {
      var base = angleForDay(day);
      return base + C.angularAmplitude * Math.sin((base - focus) * RAD) * str;
    }

    function proximityScale(day, focus, str) {
      var delta = wrap180(angleForDay(day) - focus);
      var raw = Math.cos(Math.abs(delta) * RAD);
      var cosValue =
        raw >= 0 ? Math.pow(raw, C.proxFalloff) : -Math.pow(-raw, C.proxFalloff);
      return (1 + C.proxAmplitude * cosValue) * str + (1 - str);
    }

    function positionForAngle(angle) {
      var r = state.size * C.radiusFraction;
      return {
        x: state.size / 2 + r * Math.cos(angle * RAD),
        y: state.size / 2 + r * Math.sin(angle * RAD)
      };
    }

    function attraction(day, pos) {
      if (state.bridgeSource === null || !state.fingerPos) return pos;
      var factor;
      if (day === state.bridgeSource) factor = 1 - state.bridgeProgress;
      else if (day === state.bridgeTarget) factor = state.bridgeProgress;
      else return pos;
      var dx = state.fingerPos.x - pos.x;
      var dy = state.fingerPos.y - pos.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (!dist) return pos;
      var pull = Math.min(C.maxPull, dist) * factor;
      return { x: pos.x + (dx / dist) * pull, y: pos.y + (dy / dist) * pull };
    }

    /* How "selected" a day is, 0…1. Drives its diameter between base and
       selected, which is how the app keeps the size continuous across the
       snap at 50% of a drag between two days (CycleRing.bridgeScale). */
    function selectedness(day) {
      if (state.bridgeSource !== null && state.bridgeProgress > 0) {
        var norm = Math.min(state.bridgeProgress / C.bridge.plateauEnd, 1);
        if (day === state.bridgeSource) return 1 - norm;
        if (day === state.bridgeTarget) return norm;
        return 0;
      }
      if (state.introPlaying || !state.introDone) {
        return day === state.selectedDay ? highlight.value : 0;
      }
      if (day === state.selectedDay) return selection.value;
      if (day === state.prevSelectedDay) return 1 - selection.value;
      return 0;
    }

    function circleRevealProgress(day) {
      if (state.reveal >= 1) return 1;
      if (state.reveal <= 0) return 0;
      var step = 1 / cycleLength;
      var start = (day - 1) * step;
      return U.smoothstep((state.reveal - start) / (step * 1.15));
    }

    function revealScale(day, reveal) {
      return day === 1 ? 0.45 + 0.55 * reveal : 0.82 + 0.18 * reveal;
    }

    /* ----------------------------------------------------------- the DOM */

    var days = [];

    function buildDays() {
      var circlesFrag = document.createDocumentFragment();
      var numbersFrag = document.createDocumentFragment();
      for (var day = 1; day <= cycleLength; day++) {
        var phase = L.phase.forDay(day, cycleLength, { periodLength: periodLength });
        var circle = document.createElement('div');
        circle.className = 'lunel-day';
        circle.style.setProperty('--day-color', phase.main);
        circle.style.setProperty('--day-stroke', L.color.rgba(phase.main, 0.7));
        circle.style.setProperty('--day-fill-30', L.color.rgba(phase.main, 0.3));
        if (day < currentDay) circle.setAttribute('data-past', '');
        circlesFrag.appendChild(circle);

        var note = null;
        if (noteDays[day]) {
          note = document.createElement('div');
          note.className = 'lunel-day__note';
          circlesFrag.appendChild(note);
        }

        var number = document.createElement('div');
        number.className = 'lunel-day-number';
        number.textContent = String(day);
        numbersFrag.appendChild(number);

        days.push({ day: day, phase: phase, circle: circle, note: note, number: number });
      }
      el.circles.appendChild(circlesFrag);
      el.numbers.appendChild(numbersFrag);
    }

    /* ------------------------------------------------------------- orbs */

    var orbNodes = [];
    var orbBaseFills = [];
    var orbBaseActive = 0;

    function buildOrbs() {
      var base = document.createElement('div');
      base.className = 'lunel-orb-base';
      for (var b = 0; b < 2; b++) {
        var fill = document.createElement('div');
        fill.className = 'lunel-orb-base__fill';
        base.appendChild(fill);
        orbBaseFills.push(fill);
      }
      el.orbs.appendChild(base);

      for (var i = 0; i < ORBS.length; i++) {
        var cfg = ORBS[i];
        var wrapper = document.createElement('div');
        wrapper.className = 'lunel-orb';
        wrapper.style.setProperty('--orb-blur', cfg.blur + 'px');
        var fills = [];
        for (var k = 0; k < 2; k++) {
          var f = document.createElement('div');
          f.className = 'lunel-orb__fill';
          f.style.opacity = '0';
          wrapper.appendChild(f);
          fills.push(f);
        }
        el.orbs.appendChild(wrapper);
        orbNodes.push({ cfg: cfg, wrapper: wrapper, fills: fills, active: 0 });
      }
    }

    /* Colour per blob: phase Main in HSB, saturation ≥ .45, brightness
       clamped to [.65, .90], hue shifted per blob. Cross-faded over 1.5 s by
       swapping which of the two stacked fills is opaque — opacity only, so
       the blur behind it is never re-rasterised. */
    function tintOrbs(phase, immediate) {
      var hsb = L.color.rgbToHsb(L.color.hexToRgb(phase.main));
      var sat = Math.max(hsb.s, 0.45);
      var bri = Math.min(Math.max(hsb.b, 0.65), 0.9);

      var baseColor = L.color.hsbToCss(hsb.h, sat, bri);
      var nextBase = orbBaseFills[1 - orbBaseActive];
      nextBase.style.background =
        'radial-gradient(circle closest-side, ' +
        baseColor.replace('rgb(', 'rgba(').replace(')', ', 0.22)') + ' 0%, ' +
        baseColor.replace('rgb(', 'rgba(').replace(')', ', 0.06)') + ' 50%, ' +
        'rgba(255,255,255,0) 100%)';

      for (var i = 0; i < orbNodes.length; i++) {
        var orb = orbNodes[i];
        var shifted = hsb.h + orb.cfg.hueShift;
        shifted -= Math.floor(shifted);
        var color = L.color.hsbToCss(shifted, sat, bri);
        var next = orb.fills[1 - orb.active];
        next.style.background = color;
        next.style.opacity = String(orb.cfg.opacity);
        orb.fills[orb.active].style.opacity = '0';
        orb.active = 1 - orb.active;
      }
      nextBase.setAttribute('data-active', '');
      orbBaseFills[orbBaseActive].removeAttribute('data-active');
      orbBaseActive = 1 - orbBaseActive;
      if (immediate) {
        /* nothing extra: the transition token is 0 ms under reduced motion */
      }
    }

    function layoutOrbs() {
      var size = state.size;
      for (var i = 0; i < orbNodes.length; i++) {
        var cfg = orbNodes[i].cfg;
        var h = cfg.baseSize * size;
        var w = h * cfg.widthRatio;
        for (var k = 0; k < 2; k++) {
          var f = orbNodes[i].fills[k];
          f.style.width = w + 'px';
          f.style.height = h + 'px';
          f.style.marginLeft = -w / 2 + 'px';
          f.style.marginTop = -h / 2 + 'px';
          f.style.left = '0px';
          f.style.top = '0px';
        }
      }
    }

    function renderOrbs(elapsed) {
      var size = state.size;
      for (var i = 0; i < orbNodes.length; i++) {
        var cfg = orbNodes[i].cfg;
        var x = cfg.xAmp * size * Math.sin(cfg.xFreq * elapsed + cfg.xPhase);
        var y = cfg.yAmp * size * Math.cos(cfg.yFreq * elapsed + cfg.yPhase);
        var pulse = 1 + 0.12 * Math.sin(cfg.pulseFreq * elapsed);
        var rotation = (cfg.rot * elapsed) % 360;
        orbNodes[i].wrapper.style.transform =
          'translate3d(calc(-50% + ' + x.toFixed(2) + 'px), calc(-50% + ' +
          y.toFixed(2) + 'px), 0) rotate(' + rotation.toFixed(2) + 'deg) scale(' +
          pulse.toFixed(4) + ')';
      }
    }

    /* ------------------------------------------------- metaball bridge */

    var ctx = el.bridge.getContext('2d');
    var dpr = 1;
    var lastK = 0;
    var lastBridgeBox = null;

    function sizeBridgeCanvas() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      el.bridge.width = Math.round(state.size * dpr);
      el.bridge.height = Math.round(state.size * dpr);
      lastBridgeBox = null;
    }

    function bridgeWidthFactor(p) {
      var b = C.bridge;
      if (p < b.plateauStart) {
        return U.smoothstep((p - b.fadeInStart) / (b.plateauStart - b.fadeInStart));
      }
      if (p > b.plateauEnd) {
        return U.smoothstep((b.fadeOutEnd - p) / (b.fadeOutEnd - b.plateauEnd));
      }
      return 1;
    }

    function clearBridge() {
      if (!lastBridgeBox) return;
      ctx.clearRect(
        lastBridgeBox.x0 - 2,
        lastBridgeBox.y0 - 2,
        lastBridgeBox.x1 - lastBridgeBox.x0 + 4,
        lastBridgeBox.y1 - lastBridgeBox.y0 + 4
      );
      lastBridgeBox = null;
    }

    /* Inigo Quilez polynomial smooth-min, exactly as MetaballBridge.metal. */
    function smin(a, b, k) {
      var h = Math.max(k - Math.abs(a - b), 0) / k;
      return Math.min(a, b) - h * h * k * 0.25;
    }

    function renderBridge(geometry) {
      clearBridge();
      if (state.bridgeSource === null || state.bridgeTarget === null) return;
      if (state.bridgeSource === state.bridgeTarget) return;
      var p = state.bridgeProgress;
      if (p < C.bridge.fadeInStart || p > C.bridge.fadeOutEnd) return;

      var a = geometry[state.bridgeSource - 1];
      var b = geometry[state.bridgeTarget - 1];
      var rA = a.diameter / 2;
      var rB = b.diameter / 2;
      var smallR = Math.min(rA, rB);
      var dx = b.x - a.x;
      var dy = b.y - a.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      var edgeGap = Math.max(0, dist - (rA + rB));
      var ringRadius = state.size * C.radiusFraction;
      var neighbour = 2 * ringRadius * Math.sin(Math.PI / cycleLength);
      var spacingRatio = U.clamp(edgeGap / Math.max(neighbour, 1), 0, 1);
      var screenScale = state.size / C.bridge.referenceSize;

      var accel =
        C.bridge.accelMin + (C.bridge.accelMax - C.bridge.accelMin) * spacingRatio;
      var widthFactor = U.clamp(1 - Math.pow(1 - bridgeWidthFactor(p), accel), 0, 1);

      var kMin = smallR * C.bridge.kMinFraction * screenScale;
      var kMax =
        smallR * C.bridge.kMaxFraction * screenScale + dist * C.bridge.kDistanceFraction;
      var required = edgeGap * C.bridge.closureGapMultiplier + C.bridge.closurePadding;
      var k = kMin + (Math.max(kMax, required) - kMin) * widthFactor;
      lastK = k;
      if (k <= 0.01) return;

      var colA = L.color.hexToRgb(a.phase.main);
      var colB = L.color.hexToRgb(b.phase.main);
      var alphaA = a.past ? 0.3 : 1;
      var alphaB = b.past ? 0.3 : 1;

      var pad = k + 2;
      var x0 = Math.max(0, Math.floor((Math.min(a.x - rA, b.x - rB) - pad) * dpr));
      var y0 = Math.max(0, Math.floor((Math.min(a.y - rA, b.y - rB) - pad) * dpr));
      var x1 = Math.min(el.bridge.width, Math.ceil((Math.max(a.x + rA, b.x + rB) + pad) * dpr));
      var y1 = Math.min(el.bridge.height, Math.ceil((Math.max(a.y + rA, b.y + rB) + pad) * dpr));
      var w = x1 - x0;
      var h = y1 - y0;
      if (w <= 0 || h <= 0) return;

      var image = ctx.createImageData(w, h);
      var data = image.data;
      var i = 0;
      for (var py = 0; py < h; py++) {
        var wy = (y0 + py + 0.5) / dpr;
        for (var px = 0; px < w; px++) {
          var wx = (x0 + px + 0.5) / dpr;
          var ax = wx - a.x, ay = wy - a.y;
          var bx = wx - b.x, by = wy - b.y;
          var d1 = Math.sqrt(ax * ax + ay * ay) - rA;
          var d2 = Math.sqrt(bx * bx + by * by) - rB;
          var d = smin(d1, d2, k);
          if (d > 0.75) {
            i += 4;
            continue;
          }
          var w1 = Math.max(0, 1 - Math.max(d1, 0) / Math.max(k, 1));
          var w2 = Math.max(0, 1 - Math.max(d2, 0) / Math.max(k, 1));
          var total = w1 + w2;
          var blend = total > 0.001 ? w2 / total : 0.5;
          /* 1 px of feather where the Metal version had a hard edge — the
             shader ran at device resolution with MSAA, the canvas does not. */
          var cover = U.clamp(0.5 - d * dpr * 0.5, 0, 1);
          data[i] = Math.round(colA.r + (colB.r - colA.r) * blend);
          data[i + 1] = Math.round(colA.g + (colB.g - colA.g) * blend);
          data[i + 2] = Math.round(colA.b + (colB.b - colA.b) * blend);
          data[i + 3] = Math.round(255 * cover * (alphaA + (alphaB - alphaA) * blend));
          i += 4;
        }
      }
      ctx.putImageData(image, x0, y0);
      lastBridgeBox = { x0: x0, y0: y0, x1: x1, y1: y1 };
    }

    /* -------------------------------------------------------- the render */

    var geometry = [];

    function renderRing(now) {
      disp.sample(now);
      selection.sample(now);
      highlight.sample(now);

      var focus = focusAngle();
      var str = strength();
      var size = state.size;
      var base = state.baseSize;
      var sel = state.selSize;

      for (var i = 0; i < days.length; i++) {
        var entry = days[i];
        var day = entry.day;
        var pos = positionForAngle(effectiveAngle(day, focus, str));
        pos = attraction(day, pos);
        var s = selectedness(day);
        var diameter = base + (sel - base) * s;
        var prox = proximityScale(day, focus, str);
        var reveal = circleRevealProgress(day);
        var scale = (diameter / base) * prox * revealScale(day, reveal);

        entry.circle.style.transform =
          'translate3d(' + (pos.x - base / 2).toFixed(2) + 'px, ' +
          (pos.y - base / 2).toFixed(2) + 'px, 0) scale(' + scale.toFixed(4) + ')';
        entry.circle.style.opacity = reveal === 1 ? '' : reveal.toFixed(3);

        if (s > 0.5) entry.circle.setAttribute('data-selected', '');
        else entry.circle.removeAttribute('data-selected');

        var renderedRadius = (base * scale) / 2;
        if (entry.note) {
          var noteAngle = effectiveAngle(day, focus, str) * RAD;
          var offset = renderedRadius + C.noteSize / 2 + C.noteGap;
          var nx = pos.x - offset * Math.cos(noteAngle);
          var ny = pos.y - offset * Math.sin(noteAngle);
          entry.note.style.transform =
            'translate3d(' + (nx - C.noteSize / 2).toFixed(2) + 'px, ' +
            (ny - C.noteSize / 2).toFixed(2) + 'px, 0)';
          entry.note.style.opacity = day === state.selectedDay ? '0' : reveal.toFixed(3);
        }

        entry.number.style.transform =
          'translate3d(' + pos.x.toFixed(2) + 'px, ' + pos.y.toFixed(2) + 'px, 0) translate(-50%, -50%)';
        if (day === state.selectedDay && reveal > 0.5 && s > 0.5) {
          entry.number.setAttribute('data-on', '');
        } else {
          entry.number.removeAttribute('data-on');
        }

        geometry[i] = {
          x: pos.x,
          y: pos.y,
          diameter: diameter * prox * revealScale(day, reveal),
          phase: entry.phase,
          past: day < currentDay
        };
      }

      renderBridge(geometry);
      void size;
    }

    /* ---------------------------------------------------------- the loop */

    var tickerHandle = null;
    var pendingFrame = null;
    var orbStart = 0;

    function frame(timeSec) {
      var now = timeSec * 1000;
      if (!orbStart) orbStart = timeSec;
      if (state.introPlaying) stepIntro(now);
      renderOrbs(timeSec - orbStart);
      renderRing(now);
    }

    function invalidate() {
      if (tickerHandle || pendingFrame) return;
      pendingFrame = requestAnimationFrame(function (t) {
        pendingFrame = null;
        renderRing(t);
      });
    }

    function startLoop() {
      if (tickerHandle) return;
      tickerHandle = L.ticker.add(frame, root);
    }

    function stopLoop() {
      if (!tickerHandle) return;
      tickerHandle.stop();
      tickerHandle = null;
    }

    /* ---------------------------------------------------------- the intro */

    function stepIntro(now) {
      var t = U.clamp((now - state.introStart) / C.introRingMs, 0, 1);
      state.reveal = Math.pow(t, C.introGamma);
      if (!state.centerShown && state.reveal >= C.introTrigger) {
        state.centerShown = true;
        el.center.setAttribute('data-on', '');
        el.orbs.setAttribute('data-intro-done', '');
      }
      if (t >= 1 && !state.highlightQueued) {
        state.highlightQueued = true;
        state.highlightAt = now + C.introHighlightDelayMs;
      }
      if (state.highlightQueued && !state.highlightStarted && now >= state.highlightAt) {
        state.highlightStarted = true;
        highlight.animate(1, SPEC.highlight, now);
      }
      if (state.highlightStarted && !highlight.duration) {
        state.introPlaying = false;
        state.introDone = true;
        state.reveal = 1;
        highlight.set(1);
        selection.set(1);
      }
    }

    function playIntro() {
      if (L.motion.reduced()) {
        finishIntro();
        return;
      }
      state.reveal = 0;
      state.centerShown = false;
      state.highlightQueued = false;
      state.highlightStarted = false;
      state.introDone = false;
      state.introPlaying = true;
      state.introStart = performance.now();
      highlight.set(0);
      el.center.removeAttribute('data-on');
      el.orbs.removeAttribute('data-intro-done');
      startLoop();
    }

    /* The finished state, which is also what reduced motion gets. */
    function finishIntro() {
      state.introPlaying = false;
      state.introDone = true;
      state.centerShown = true;
      state.highlightQueued = true;
      state.highlightStarted = true;
      state.reveal = 1;
      highlight.set(1);
      selection.set(1);
      el.center.setAttribute('data-on', '');
      el.orbs.setAttribute('data-intro-done', '');
      invalidate();
    }

    /* ---------------------------------------------------------- the copy */

    function phaseForSelected() {
      return L.phase.forDay(state.selectedDay, cycleLength, { periodLength: periodLength });
    }

    function dateForDay(day) {
      return L.dates.addDays(anchorDate, day - 1);
    }

    /* iOS .numericText: the digit rolls vertically. Rapid drags fire this
       many times a second, so an in-flight roll is collapsed to its target
       first — otherwise the strip can be left showing the stale digit. */
    function rollDayNumber(text, countsDown) {
      if (!el.daynum.firstElementChild) {
        var seed = document.createElement('span');
        seed.textContent = text;
        el.daynum.appendChild(seed);
        return;
      }
      /* keep only the newest span and stop its animation */
      while (el.daynum.children.length > 1) {
        el.daynum.removeChild(el.daynum.firstElementChild);
      }
      var current = el.daynum.firstElementChild;
      if (current.getAnimations) {
        current.getAnimations().forEach(function (a) { a.cancel(); });
      }
      if (current.textContent === text) return;
      if (L.motion.reduced() || !current.animate) {
        current.textContent = text;
        return;
      }
      var next = document.createElement('span');
      next.textContent = text;
      el.daynum.appendChild(next);
      var dir = countsDown ? -1 : 1;
      var options = { duration: 160, easing: 'cubic-bezier(.42,0,.58,1)', fill: 'none' };
      current.animate(
        [
          { transform: 'translateY(0)', opacity: 1 },
          { transform: 'translateY(' + -dir * 100 + '%)', opacity: 0 }
        ],
        options
      );
      var anim = next.animate(
        [
          { transform: 'translateY(' + dir * 100 + '%)', opacity: 0 },
          { transform: 'translateY(0)', opacity: 1 }
        ],
        options
      );
      anim.onfinish = function () {
        if (current.parentNode === el.daynum && el.daynum.children.length > 1) {
          el.daynum.removeChild(current);
        }
      };
    }

    function headerTitle(lang) {
      var offset = state.selectedDay - currentDay;
      if (offset === 0) return L.i18n.t('Today', lang, []);
      if (offset === 1) return L.i18n.t('Tomorrow', lang, []);
      if (offset === -1) return L.i18n.t('Yesterday', lang, []);
      if (offset > 1) return L.i18n.t('home_title_in_days', lang, [offset]);
      return L.i18n.t('home_title_days_ago', lang, [-offset]);
    }

    function tagText(lang, phase) {
      if (phase.key === 'menstrual') {
        var left = Math.max(periodLength - state.selectedDay, 0);
        if (left === 0) return L.i18n.t('home_period_last_day', lang, []);
        return L.i18n.t('home_period_days_left', lang, [left]);
      }
      var earliest = L.dates.addDays(anchorDate, cycleLength);
      var latest = L.dates.addDays(earliest, 4);
      return L.i18n.t('home_next_period_window', lang, [
        L.dates.shortRange(earliest, latest, lang)
      ]);
    }

    function updateCopy(countsDown) {
      var lang = state.lang;
      var phase = phaseForSelected();
      var date = dateForDay(state.selectedDay);

      el.month.textContent = L.dates.monthStandalone(date, lang) + ',';
      rollDayNumber(String(date.getDate()), countsDown);

      el.phase.textContent = L.i18n.t('home_ring_day_phase', lang, [
        state.selectedDay,
        L.i18n.t(phase.title, lang, [])
      ]);
      el.tag.textContent = tagText(lang, phase);
      el.center.style.setProperty('--phase-dark', phase.dark);

      if (el.title) el.title.textContent = headerTitle(lang);
      if (el.todayBtn) el.todayBtn.hidden = state.selectedDay === currentDay;

      el.input.setAttribute('aria-valuenow', String(state.selectedDay));
      /* The accessible NAME is the visible "Day N · Phase" line
         (aria-labelledby in the markup), so the value text carries only what
         the name does not: the date and the tag. Every word on this screen is
         app copy; there is no invented a11y string anywhere in the component. */
      el.input.setAttribute(
        'aria-valuetext',
        el.month.textContent + ' ' + date.getDate() + '. ' + el.tag.textContent
      );

      if (phase.key !== state.phaseKey) {
        state.phaseKey = phase.key;
        tintOrbs(phase, false);
      }
    }

    /* ------------------------------------------------------- interaction */

    function isCountingDown(from, to) {
      var forward = (to - from + cycleLength) % cycleLength <= cycleLength / 2;
      return !forward;
    }

    function setSelectedDay(day, spec) {
      var next = U.clamp(Math.round(day), 1, cycleLength);
      if (next === state.selectedDay) return;
      var down = isCountingDown(state.selectedDay, next);
      state.prevSelectedDay = state.selectedDay;
      state.selectedDay = next;
      if (spec && !state.dragging) {
        selection.set(0);
        selection.animate(1, spec, performance.now());
      } else {
        selection.set(1);
      }
      updateCopy(down);
      invalidate();
    }

    function localPoint(event) {
      var rect = el.ring.getBoundingClientRect();
      var scale = rect.width / state.size || 1;
      return {
        x: (event.clientX - rect.left) / scale,
        y: (event.clientY - rect.top) / scale
      };
    }

    function inZone(point) {
      var r = state.size * C.radiusFraction;
      var dx = point.x - state.size / 2;
      var dy = point.y - state.size / 2;
      var d = Math.sqrt(dx * dx + dy * dy);
      return d >= r * C.innerZone && d <= r * C.outerZone;
    }

    /* CycleProgressView.handleTapOnRing — pick the nearest circle using the
       positions it is actually drawn at (idle displacement included). */
    function closestDay(point) {
      var r = state.size * C.radiusFraction;
      var focus = angleForDay(state.selectedDay);
      var best = state.selectedDay;
      var bestDist = Infinity;
      for (var day = 1; day <= cycleLength; day++) {
        var angle = effectiveAngle(day, focus, C.idleStrength) * RAD;
        var x = state.size / 2 + r * Math.cos(angle);
        var y = state.size / 2 + r * Math.sin(angle);
        var dx = point.x - x;
        var dy = point.y - y;
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d < bestDist) {
          bestDist = d;
          best = day;
        }
      }
      return best;
    }

    function mappedBridgeProgress(raw) {
      if (raw <= C.dragRevealStart) return 0;
      return U.smoothstep(
        (raw - C.dragRevealStart) / (C.dragRevealFull - C.dragRevealStart)
      );
    }

    function handleDrag(point) {
      var r = state.size * C.radiusFraction;
      var dx = point.x - state.size / 2;
      var dy = point.y - state.size / 2;
      if (Math.sqrt(dx * dx + dy * dy) > r * C.outerZone) return;

      var angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      if (angle < 0) angle += 360;
      var normalized = angle + 90;
      if (normalized >= 360) normalized -= 360;

      var step = 360 / cycleLength;
      var exact = normalized / step;
      var floorPos = Math.floor(exact);
      var raw = exact - floorPos;
      var sourceIdx = floorPos % cycleLength;

      state.bridgeSource = sourceIdx + 1;
      state.bridgeTarget = ((sourceIdx + 1) % cycleLength) + 1;
      state.bridgeProgress = mappedBridgeProgress(raw);

      var dayIndex = Math.round(normalized / step);
      setSelectedDay((dayIndex % cycleLength) + 1, null);

      state.fingerAngle = normalized - 90;
      state.fingerPos = point;

      if (!state.dragging) {
        state.dragging = true;
        el.ring.setAttribute('data-dragging', '');
        disp.animate(1, SPEC.displace, performance.now());
      }
      invalidate();
    }

    function endDrag() {
      if (!state.dragging) return;
      state.dragging = false;
      el.ring.removeAttribute('data-dragging');
      state.fingerPos = null;
      state.bridgeSource = null;
      state.bridgeTarget = null;
      state.bridgeProgress = 0;
      selection.set(1);
      disp.animate(0, SPEC.dragEnd, performance.now());
      invalidate();
    }

    var pointerId = null;
    var pressOrigin = null;
    var fingerOffset = { x: 0, y: 0 };

    el.input.addEventListener('pointerdown', function (event) {
      var point = localPoint(event);
      if (!inZone(point)) return; /* centre and far taps belong to the page */
      pointerId = event.pointerId;
      pressOrigin = point;
      try { el.input.setPointerCapture(pointerId); } catch (e) { /* synthetic pointer */ }
      /* focus so the arrow keys work straight after a drag, without showing
         the keyboard focus ring for a pointer interaction */
      el.input.setAttribute('data-pointer-focus', '');
      el.input.focus({ preventScroll: true });

      setSelectedDay(closestDay(point), SPEC.select);

      var r = state.size * C.radiusFraction;
      var angle = angleForDay(state.selectedDay) * RAD;
      fingerOffset = {
        x: state.size / 2 + r * Math.cos(angle) - point.x,
        y: state.size / 2 + r * Math.sin(angle) - point.y
      };
    });

    el.input.addEventListener('pointermove', function (event) {
      if (pointerId === null || event.pointerId !== pointerId) return;
      var point = localPoint(event);
      var moved = Math.hypot(point.x - pressOrigin.x, point.y - pressOrigin.y);
      if (!state.dragging && moved < 4) return;
      handleDrag({ x: point.x + fingerOffset.x, y: point.y + fingerOffset.y });
      event.preventDefault();
    });

    function release(event) {
      if (pointerId === null || (event && event.pointerId !== pointerId)) return;
      try {
        if (el.input.hasPointerCapture && el.input.hasPointerCapture(pointerId)) {
          el.input.releasePointerCapture(pointerId);
        }
      } catch (e) { /* synthetic pointer */ }
      pointerId = null;
      endDrag();
    }

    el.input.addEventListener('pointerup', release);
    el.input.addEventListener('pointercancel', release);

    el.input.addEventListener('dblclick', function () {
      setSelectedDay(currentDay, SPEC.today);
    });

    /* Keyboard equivalent of the drag — a slider, so the usual slider keys. */
    el.input.addEventListener('blur', function () {
      el.input.removeAttribute('data-pointer-focus');
    });

    el.input.addEventListener('keydown', function (event) {
      el.input.removeAttribute('data-pointer-focus');
      var delta = 0;
      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowUp': delta = 1; break;
        case 'ArrowLeft':
        case 'ArrowDown': delta = -1; break;
        case 'PageUp': delta = 7; break;
        case 'PageDown': delta = -7; break;
        case 'Home': setSelectedDay(1, SPEC.select); event.preventDefault(); return;
        case 'End': setSelectedDay(cycleLength, SPEC.select); event.preventDefault(); return;
        default: return;
      }
      setSelectedDay(state.selectedDay + delta, SPEC.select);
      event.preventDefault();
    });

    if (el.todayBtn) {
      el.todayBtn.addEventListener('click', function () {
        setSelectedDay(currentDay, SPEC.today);
        el.input.focus({ preventScroll: true });
      });
    }

    /* ----------------------------------------------------------- layout */

    function measure() {
      /* clientWidth is layout px and ignores the frame's transform scale,
         which is exactly the coordinate space every formula below uses. */
      var size = el.ring.clientWidth;
      if (!size) return false;
      state.size = size;
      var ringRadius = size * C.radiusFraction;
      var space = (2 * Math.PI * ringRadius) / cycleLength;
      state.baseSize = U.clamp(space * C.baseSpacingFraction, C.baseMin, C.baseMax);
      state.selSize = U.clamp(
        state.baseSize * (cycleLength > 30 ? C.selMultLong : C.selMultShort),
        C.selMin,
        C.selMax
      );
      for (var i = 0; i < days.length; i++) {
        days[i].circle.style.width = state.baseSize + 'px';
        days[i].circle.style.height = state.baseSize + 'px';
      }
      sizeBridgeCanvas();
      layoutOrbs();
      return true;
    }

    /* -------------------------------------------------------------- boot */

    buildDays();
    buildOrbs();
    measure();
    tintOrbs(phaseForSelected(), true);
    state.phaseKey = phaseForSelected().key;
    updateCopy(false);
    renderOrbs(0);
    renderRing(performance.now());

    var resizeObserver =
      typeof ResizeObserver === 'function'
        ? new ResizeObserver(function () {
            if (measure()) invalidate();
          })
        : null;
    if (resizeObserver) resizeObserver.observe(el.ring);

    root.addEventListener('lunel:lang', function (event) {
      state.lang = event.detail.lang;
      updateCopy(false);
    });

    L.motion.onChange(function (isReduced) {
      if (isReduced) {
        stopLoop();
        finishIntro();
        renderOrbs(0);
        invalidate();
      } else {
        startLoop();
      }
    });

    if (L.motion.reduced()) {
      finishIntro();
    } else {
      startLoop();
      L.inView(root, playIntro, { threshold: 0.3 });
    }

    return {
      replayIntro: playIntro,
      setDay: function (day) { setSelectedDay(day, SPEC.select); },
      get day() { return state.selectedDay; },
      /* exposed for tests and for the scenario driver */
      get debug() {
        return {
          progress: state.bridgeProgress,
          source: state.bridgeSource,
          target: state.bridgeTarget,
          displacement: disp.value,
          k: lastK
        };
      },
      destroy: function () {
        stopLoop();
        if (resizeObserver) resizeObserver.disconnect();
      }
    };
  });
})();
