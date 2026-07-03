/* 🍌 Banana rain — a header slider sets the per-second chance a banana
   drops from the sky. Bananas spin gently as they fall; click one to
   whack it away from the point you clicked. Default: 0 (off). */
(function () {
  // ── styles ─────────────────────────────────────────────
  var css = ''
    + '#banana-ctrl{display:flex;align-items:center;justify-content:center;gap:8px;'
    +   "font-family:'Source Sans 3',sans-serif;color:#4a3a20;user-select:none;"
    +   'clear:both;margin:10px 0 0;}'
    + '#banana-ctrl .bn-cap{font-size:13px;white-space:nowrap;}'
    + '#banana-ctrl .bn-track{position:relative;width:120px;height:6px;'
    +   'border-radius:3px;background:#b89b52;cursor:pointer;}'
    + '#banana-ctrl .bn-fill{position:absolute;left:0;top:0;bottom:0;'
    +   'border-radius:3px;background:#6f5a24;}'
    + '#banana-ctrl .bn-knob{position:absolute;top:50%;'
    +   'transform:translate(-50%,-50%);font-size:24px;line-height:1;'
    +   'cursor:grab;touch-action:none;}'
    + '#banana-ctrl .bn-knob:active{cursor:grabbing;}'
    + '#banana-ctrl .bn-pct{font-size:13px;width:34px;text-align:right;'
    +   'font-variant-numeric:tabular-nums;}'
    + '#banana-sky{position:fixed;inset:0;overflow:hidden;'
    +   'pointer-events:none;z-index:9998;}'
    + '#banana-sky .bn{position:absolute;left:0;top:0;will-change:transform;'
    +   'pointer-events:none;line-height:1;user-select:none;}'
    + '#banana-monkey{position:fixed;left:50%;bottom:0;transform:translateX(-50%);'
    +   'font-size:84px;line-height:1;z-index:9999;pointer-events:none;'
    +   'user-select:none;display:none;transition:transform .08s ease-out;}'
    + '#banana-score{position:fixed;left:50%;bottom:96px;transform:translateX(-50%);'
    +   'z-index:9999;pointer-events:none;user-select:none;display:none;white-space:nowrap;'
    +   "font-family:'Source Sans 3',sans-serif;font-weight:700;font-size:20px;"
    +   'color:#e6b455;text-shadow:0 1px 3px rgba(0,0,0,.6);}';
  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  // ── the slider control ─────────────────────────────────
  var ctrl = document.createElement('div');
  ctrl.id = 'banana-ctrl';
  ctrl.innerHTML =
      '<div class="bn-track"><div class="bn-fill"></div>'
    + '<span class="bn-knob">🍌</span></div>'
    + '<span class="bn-pct">0%</span>';

  var host = document.querySelector('#colophon .site-info')
          || document.querySelector('#colophon')
          || document.querySelector('.site-footer')
          || document.body;
  host.appendChild(ctrl);

  var track = ctrl.querySelector('.bn-track');
  var fill  = ctrl.querySelector('.bn-fill');
  var knob  = ctrl.querySelector('.bn-knob');
  var pct   = ctrl.querySelector('.bn-pct');

  var value = 0; // 0..1 — probability per second
  function setValue(v) {
    var prev = value;
    value = Math.max(0, Math.min(1, v));
    if (prev === 0 && value > 0) { // fresh game
      score = 0; total = 0;
      if (typeof renderScore === 'function') renderScore();
      if (typeof pickCatcher === 'function') pickCatcher();
    }
    if (typeof syncMonkey === 'function') syncMonkey();
    var w = track.clientWidth;
    knob.style.left = (value * w) + 'px';
    fill.style.width = (value * w) + 'px';
    pct.textContent = Math.round(value * 100) + '%';
  }
  function valFromX(clientX) {
    var r = track.getBoundingClientRect();
    return (clientX - r.left) / r.width;
  }
  var dragging = false;
  function down(e) { dragging = true; setValue(valFromX(e.clientX)); e.preventDefault(); }
  function moveSlider(e) { if (dragging) setValue(valFromX(e.clientX)); }
  function up() { dragging = false; }
  track.addEventListener('pointerdown', down);
  knob.addEventListener('pointerdown', down);
  window.addEventListener('pointermove', moveSlider);
  window.addEventListener('pointerup', up);
  window.addEventListener('resize', function () { setValue(value); });
  setValue(0);

  // ── the falling bananas ────────────────────────────────
  var sky = document.createElement('div');
  sky.id = 'banana-sky';
  document.body.appendChild(sky);

  var bananas = [];
  var G = 220; // gravity, px/s^2 — gentle, slow fall

  function spawn() {
    var el = document.createElement('div');
    el.className = 'bn';
    el.textContent = '🍌';
    var size = 60 + Math.random() * 55; // big bananas
    el.style.fontSize = size + 'px';
    sky.appendChild(el);
    var dir = Math.random() < 0.5 ? -1 : 1;
    var b = {
      el: el, size: size,
      x: Math.random() * window.innerWidth, y: -size - 20,
      vx: (Math.random() - 0.5) * 30, vy: 12 + Math.random() * 18, // slow drop
      ang: Math.random() * 360, av: dir * (40 + Math.random() * 90) // always visibly spinning
    };
    b.held = false;
    bananas.push(b);
    total++;
    if (typeof renderScore === 'function') renderScore();
  }

  // ── grab / drag / throw ────────────────────────────────
  var grabbed = null, offX = 0, offY = 0, lastX = 0, lastY = 0, lastT = 0;
  function clamp(v, m) { return Math.max(-m, Math.min(m, v)); }

  // find the nearest banana within a permissive radius of the pointer
  function grabAt(px, py) {
    var best = null, bestD = Infinity;
    for (var i = 0; i < bananas.length; i++) {
      var b = bananas[i];
      var cx = b.x + b.size / 2, cy = b.y + b.size / 2;
      var d = Math.hypot(cx - px, cy - py);
      var reach = b.size / 2 + 45; // generous — easy to grab
      if (d < reach && d < bestD) { bestD = d; best = b; }
    }
    return best;
  }

  window.addEventListener('pointerdown', function (e) {
    var b = grabAt(e.clientX, e.clientY);
    if (!b) return;                 // not near a banana — let the page handle it
    grabbed = b; b.held = true;
    offX = e.clientX - b.x; offY = e.clientY - b.y;
    lastX = e.clientX; lastY = e.clientY; lastT = e.timeStamp;
    b.vx = b.vy = 0;
    document.body.style.cursor = 'grabbing';
    e.preventDefault();
    e.stopPropagation();
  }, true);

  window.addEventListener('pointermove', function (e) {
    if (!grabbed) return;
    grabbed.x = e.clientX - offX;
    grabbed.y = e.clientY - offY;
    var dt = (e.timeStamp - lastT) / 1000;
    if (dt > 0) {                    // track motion so a flick throws it
      grabbed.vx = clamp((e.clientX - lastX) / dt, 2000);
      grabbed.vy = clamp((e.clientY - lastY) / dt, 2000);
    }
    lastX = e.clientX; lastY = e.clientY; lastT = e.timeStamp;
    e.preventDefault();
  }, { passive: false });

  function release() {
    if (!grabbed) return;
    grabbed.av += clamp(grabbed.vx, 1500) * 0.4; // extra spin from the throw
    grabbed.held = false;
    grabbed = null;
    document.body.style.cursor = '';
  }
  window.addEventListener('pointerup', release);
  window.addEventListener('pointercancel', release);

  // ── monkey catcher: move with ← / →, +1 per banana eaten ─
  var monkey = document.createElement('div');
  monkey.id = 'banana-monkey';
  document.body.appendChild(monkey);
  var scoreEl = document.createElement('div');
  scoreEl.id = 'banana-score';
  document.body.appendChild(scoreEl);

  // Who's catching this round — randomly Josh or Shawn.
  var CATCHERS = [
    { type: 'img', val: '/wp-content/uploads/heads/josh.png' },
    { type: 'img', val: '/wp-content/uploads/heads/shawn.png' }
  ];
  function pickCatcher() {
    var c = CATCHERS[Math.floor(Math.random() * CATCHERS.length)];
    if (c.type === 'emoji') {
      monkey.innerHTML = '';
      monkey.textContent = c.val;
      monkey.style.fontSize = '84px';
    } else {
      monkey.style.fontSize = '';
      monkey.innerHTML = '<img src="' + c.val + '" alt="" '
        + 'style="height:104px;width:auto;display:block;pointer-events:none;'
        + 'filter:drop-shadow(0 2px 3px rgba(0,0,0,.4));">';
    }
  }
  pickCatcher();

  var monkeyW = 88, monkeyX = window.innerWidth / 2, score = 0, total = 0;
  var leftHeld = false, rightHeld = false, shiftHeld = false, chompUntil = 0;

  function syncMonkey() {
    if (!monkey) return;
    var on = value > 0;
    monkey.style.display = on ? 'block' : 'none';
    scoreEl.style.display = on ? 'block' : 'none';
  }
  function renderScore() { scoreEl.textContent = '🍌 ' + score + ' / ' + total; }
  renderScore();
  syncMonkey();

  window.addEventListener('keydown', function (e) {
    if (e.key === 'Shift') shiftHeld = true;
    if (e.key === 'ArrowLeft')  { leftHeld = true;  if (value > 0) e.preventDefault(); }
    else if (e.key === 'ArrowRight') { rightHeld = true; if (value > 0) e.preventDefault(); }
  });
  window.addEventListener('keyup', function (e) {
    if (e.key === 'Shift') shiftHeld = false;
    if (e.key === 'ArrowLeft') leftHeld = false;
    else if (e.key === 'ArrowRight') rightHeld = false;
  });
  window.addEventListener('blur', function () { leftHeld = rightHeld = shiftHeld = false; });

  var last = null;
  function frame(t) {
    if (last === null) last = t;
    var dt = Math.min(0.05, (t - last) / 1000);
    last = t;

    // move the monkey (Shift = warp speed)
    if (value > 0) {
      var mspeed = shiftHeld ? 3600 : 1100;
      if (leftHeld)  monkeyX -= mspeed * dt;
      if (rightHeld) monkeyX += mspeed * dt;
      monkeyX = Math.max(monkeyW / 2, Math.min(window.innerWidth - monkeyW / 2, monkeyX));
      monkey.style.left = monkeyX + 'px';
      monkey.style.transform = 'translateX(-50%) scale(' + (t < chompUntil ? 1.25 : 1) + ')';
    }

    for (var i = bananas.length - 1; i >= 0; i--) {
      var b = bananas[i];
      if (!b.held) {                 // held bananas follow the cursor, no gravity
        b.vy += G * dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
      }
      b.ang += b.av * dt;
      b.el.style.transform = 'translate(' + b.x + 'px,' + b.y + 'px) rotate(' + b.ang + 'deg)';

      // eaten?
      if (value > 0 && !b.held && b.vy > 0) {
        var bcx = b.x + b.size / 2, bcy = b.y + b.size / 2;
        if (bcy > window.innerHeight - 74 && Math.abs(bcx - monkeyX) < monkeyW * 0.55) {
          b.el.remove(); bananas.splice(i, 1);
          score++; renderScore(); chompUntil = t + 120;
          continue;
        }
      }
      if (!b.held && (b.y > window.innerHeight + 100 || b.x < -160 || b.x > window.innerWidth + 160)) {
        b.el.remove();
        bananas.splice(i, 1);
      }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // each second, drop a banana with probability = slider value
  setInterval(function () { if (Math.random() < value) spawn(); }, 1000);
})();
