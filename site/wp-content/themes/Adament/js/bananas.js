/* 🍌 Banana rain — a header slider sets the per-second chance a banana
   drops from the sky. Bananas spin gently as they fall; click one to
   whack it away from the point you clicked. Default: 0 (off). */
(function () {
  // ── styles ─────────────────────────────────────────────
  var css = ''
    + '#banana-ctrl{display:inline-flex;align-items:center;gap:8px;'
    +   "font-family:'Source Sans 3',sans-serif;color:#4a3a20;user-select:none;"
    +   'float:right;clear:both;margin:6px 2px 2px;}'
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
    +   'pointer-events:auto;cursor:pointer;line-height:1;user-select:none;}';
  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  // ── the slider control ─────────────────────────────────
  var ctrl = document.createElement('div');
  ctrl.id = 'banana-ctrl';
  ctrl.innerHTML =
      '<span class="bn-cap">🍌 rain</span>'
    + '<div class="bn-track"><div class="bn-fill"></div>'
    + '<span class="bn-knob">🍌</span></div>'
    + '<span class="bn-pct">0%</span>';

  var nav = document.querySelector('#site-navigation');
  var host = (nav && nav.parentNode) || document.querySelector('#masthead') || document.body;
  host.appendChild(ctrl);

  var track = ctrl.querySelector('.bn-track');
  var fill  = ctrl.querySelector('.bn-fill');
  var knob  = ctrl.querySelector('.bn-knob');
  var pct   = ctrl.querySelector('.bn-pct');

  var value = 0; // 0..1 — probability per second
  function setValue(v) {
    value = Math.max(0, Math.min(1, v));
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
  var G = 900; // gravity, px/s^2

  function spawn() {
    var el = document.createElement('div');
    el.className = 'bn';
    el.textContent = '🍌';
    var size = 28 + Math.random() * 18;
    el.style.fontSize = size + 'px';
    sky.appendChild(el);
    var b = {
      el: el, size: size,
      x: Math.random() * window.innerWidth, y: -50,
      vx: (Math.random() - 0.5) * 40, vy: 20 + Math.random() * 40,
      ang: Math.random() * 360, av: (Math.random() - 0.5) * 120 // gentle spin
    };
    el.addEventListener('pointerdown', function (e) {
      hit(b, e.clientX, e.clientY);
      e.preventDefault();
      e.stopPropagation();
    });
    bananas.push(b);
  }

  function hit(b, clickX, clickY) {
    var cx = b.x + b.size / 2, cy = b.y + b.size / 2;
    var dx = cx - clickX, dy = cy - clickY; // push away from the click
    var d = Math.hypot(dx, dy);
    if (d < 3) { var a = Math.random() * Math.PI * 2; dx = Math.cos(a); dy = Math.sin(a); d = 1; }
    var force = 540;
    b.vx += (dx / d) * force;
    b.vy += (dy / d) * force;
    b.av += (Math.random() - 0.5) * 720; // extra spin from the whack
  }

  var last = null;
  function frame(t) {
    if (last === null) last = t;
    var dt = Math.min(0.05, (t - last) / 1000);
    last = t;
    for (var i = bananas.length - 1; i >= 0; i--) {
      var b = bananas[i];
      b.vy += G * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.ang += b.av * dt;
      b.el.style.transform = 'translate(' + b.x + 'px,' + b.y + 'px) rotate(' + b.ang + 'deg)';
      if (b.y > window.innerHeight + 100 || b.x < -140 || b.x > window.innerWidth + 140) {
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
