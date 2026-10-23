(function () {
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Scroll reveal (repeats when scrolling up or down) */
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { e.target.classList.toggle('in', e.isIntersecting); });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  $$('.r').forEach(function (el) { io.observe(el); });

  /* Count up */
  var cio = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target, n = +el.dataset.count, t0 = performance.now();
      (function tick(now) { var p = Math.min(1, (now - t0) / 1200); el.textContent = Math.round(n * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(tick); })(t0);
      cio.unobserve(el);
    });
  }, { threshold: 0.6 });
  $$('[data-count]').forEach(function (el) { cio.observe(el); });

  /* Nav: active link, scrolled state, progress bar, mobile menu */
  var wrap = $('.nav-wrap'), bar = $('.progress'), links = $$('.nav-links a');
  var secs = ['home', 'about', 'portfolio', 'contact'].map(function (id) { return document.getElementById(id); });
  function onScroll() {
    var y = window.scrollY, max = document.documentElement.scrollHeight - innerHeight;
    wrap.classList.toggle('scrolled', y > 30);
    bar.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';
    var cur = 'home';
    secs.forEach(function (s) { if (s && s.getBoundingClientRect().top < innerHeight * 0.4) cur = s.id; });
    links.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + cur); });
  }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  var burger = $('.burger'), menu = $('.nav-links');
  burger.addEventListener('click', function () { var o = menu.classList.toggle('open'); burger.setAttribute('aria-expanded', o); });
  links.forEach(function (a) { a.addEventListener('click', function () { menu.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }); });

  /* Glow follows mouse + stat spotlight */
  var glow = $('.bg-glow');
  addEventListener('pointermove', function (e) { glow.style.setProperty('--mx', e.clientX + 'px'); glow.style.setProperty('--my', e.clientY + 'px'); });
  $$('.stat').forEach(function (s) { s.addEventListener('pointermove', function (e) { var r = s.getBoundingClientRect(); s.style.setProperty('--x', e.clientX - r.left + 'px'); s.style.setProperty('--y', e.clientY - r.top + 'px'); }); });

  /* Typewriter */
  var tw = $('.typed-text');
  if (tw) {
    var words = tw.dataset.words.split('|'), wi = 0, ci = 0, del = false;
    (function type() {
      var w = words[wi]; ci += del ? -1 : 1; tw.textContent = w.slice(0, ci);
      var wait = del ? 40 : 85;
      if (!del && ci === w.length) { del = true; wait = 1600; }
      else if (del && ci === 0) { del = false; wi = (wi + 1) % words.length; wait = 300; }
      setTimeout(type, wait);
    })();
  }

  /* Lanyard: elastic press, two-axis dragging, spring return */
  var lan = $('#lanyard'), badge = $('.badge');
  if (lan && badge) {
    var ang = 0, vel = 0, stretch = 0, stretchVel = 0;
    var drag = false, sx = 0, sy = 0, sa = 0, ss = 0, pointer = null, frame = 0, last = 0;
    function render() {
      lan.style.transform = 'rotate(' + ang.toFixed(2) + 'deg) scale(var(--lanyard-scale))';
      lan.style.setProperty('--stretch', stretch.toFixed(2) + 'px');
    }
    function step(now) {
      frame = 0;
      var dt = Math.min((now - last) / 16.667 || 1, 2); last = now;
      if (!drag) {
        vel = (vel - ang * .025 * dt) * Math.pow(.92, dt); ang += vel * dt;
        stretchVel = (stretchVel - stretch * .055 * dt) * Math.pow(.84, dt);
        stretch = Math.max(-18, stretch + stretchVel * dt);
      }
      render();
      if (!drag && (Math.abs(ang) + Math.abs(vel) + Math.abs(stretch) + Math.abs(stretchVel) > .08)) frame = requestAnimationFrame(step);
      else if (!drag) { ang = vel = stretch = stretchVel = 0; render(); }
    }
    function settle() {
      if (reduce) { ang = vel = stretch = stretchVel = 0; render(); return; }
      if (!frame) { last = performance.now(); frame = requestAnimationFrame(step); }
    }
    lan.addEventListener('animationend', function (e) { if (e.target !== lan) return; lan.style.animation = 'none'; vel = 1.8; settle(); }, { once: true });
    function press() {
      lan.style.animation = 'none';
      if (frame) cancelAnimationFrame(frame); frame = 0;
      drag = true; stretch = Math.max(48, stretch); vel = stretchVel = 0;
      badge.setAttribute('aria-pressed', 'true'); render();
    }
    function release() {
      if (!drag) return;
      drag = false; pointer = null; badge.setAttribute('aria-pressed', 'false'); settle();
    }
    badge.addEventListener('pointerdown', function (e) {
      if (!e.isPrimary || e.button !== 0 || drag) return;
      sx = e.clientX; sy = e.clientY; sa = ang; press(); ss = stretch; pointer = e.pointerId;
      badge.setPointerCapture(e.pointerId); e.preventDefault();
    });
    badge.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== pointer) return;
      var scale = parseFloat(getComputedStyle(lan).getPropertyValue('--lanyard-scale')) || 1;
      ang = Math.max(-28, Math.min(28, sa - (e.clientX - sx) * .09 / scale));
      stretch = Math.max(0, Math.min(180, ss + (e.clientY - sy) / scale)); render();
    });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (event) { badge.addEventListener(event, release); });
    addEventListener('blur', release);
    badge.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.preventDefault(); press(); } });
    badge.addEventListener('keyup', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); release(); } });
    badge.addEventListener('blur', release);
  }

  /* Tabs */
  var tabs = $$('.tab'), pill = $('.tab-pill');
  function setTab(name) {
    tabs.forEach(function (t, i) {
      var on = t.dataset.tab === name; t.classList.toggle('active', on); t.setAttribute('aria-selected', on);
      if (on) pill.style.transform = 'translateX(' + (i * 100) + '%)';
    });
    $$('.panel').forEach(function (p) {
      var on = p.dataset.panel === name; p.classList.toggle('active', on);
      if (on) $$('.pcard,.ccard,.tcard', p).forEach(function (c, i) { c.style.setProperty('--i', i); c.style.animation = 'none'; c.offsetWidth; c.style.animation = ''; });
    });
  }
  tabs.forEach(function (t) { t.addEventListener('click', function () { setTab(t.dataset.tab); }); });
  $$('.stat[data-tab]').forEach(function (s) { s.addEventListener('click', function () { setTab(s.dataset.tab); }); });
  setTab('projects');

  /* Project details */
  var projects = [
    { title: 'Hotel Reservation', img: 'images/hotel.jpg', desc: 'A online hotel booking website concept with date search and featured hotels.', tech: ['HTML', 'CSS', 'Bootstrap', 'MySQL'], feat: ['Date search', 'Featured hotels', 'Online booking'] },
    { title: 'RCS-POMS', img: 'images/rcspoms.webp', desc: 'A solar and electrical management dashboard for quotations, projects, attendance, products, and stock movements.', tech: [], feat: ['Quotations and change orders', 'Project and attendance tracking', 'Products and stock movements'] },
    { title: 'Health Appointment App', img: 'images/medalert.jpg', desc: 'A clinic appointment app with a clear booking confirmation screen.', tech: ['Flutter', 'Dart', 'Supabase'], feat: ['Clinic appointments', 'Booking confirmation screen'] }
  ];
  var detail = $('#detail');
  function li(t) { var l = document.createElement('li'); l.textContent = t; return l; }
  $$('.pcard').forEach(function (c) {
    $('.details', c).addEventListener('click', function () {
      var p = projects[+c.dataset.project];
      $('.detail-title', detail).textContent = p.title;
      $('.detail-desc', detail).textContent = p.desc;
      $('.detail-shot img', detail).src = p.img; $('.detail-shot img', detail).alt = p.title;
      $('.d-tech-n', detail).textContent = p.tech.length; $('.d-feat-n', detail).textContent = p.feat.length;
      var t = $('.detail-tech', detail), f = $('.detail-feat', detail); t.innerHTML = ''; f.innerHTML = '';
      p.tech.forEach(function (x) { t.appendChild(li(x)); }); p.feat.forEach(function (x) { f.appendChild(li(x)); });
      detail.scrollTop = 0; detail.classList.add('open'); detail.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden';
    });
  });
  function closeDetail() { detail.classList.remove('open'); detail.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; }
  $('[data-close]', detail).addEventListener('click', closeDetail);

  /* Lightbox */
  var lb = $('#lightbox');
  $$('.zoomable').forEach(function (b) {
    b.addEventListener('click', function () {
      $('img', lb).src = b.dataset.full; $('figcaption', lb).textContent = b.dataset.caption || '';
      lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false');
    });
  });
  function closeLb() { lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true'); }
  lb.addEventListener('click', function (e) { if (e.target === lb || e.target.closest('.lb-close')) closeLb(); });
  addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeLb(); closeDetail(); } });

  /* Toast */
  var toast = $('#toast'), tt;
  function say(m) { toast.textContent = m; toast.classList.add('show'); clearTimeout(tt); tt = setTimeout(function () { toast.classList.remove('show'); }, 2600); }

  /* Contact form: opens the visitor's email app */
  $('#contactForm').addEventListener('submit', function (e) {
    e.preventDefault(); var f = e.target;
    var body = f.message.value + '\n\n— ' + f.name.value + ' (' + f.email.value + ')';
    location.href = 'mailto:alimarserad@gmail.com?subject=' + encodeURIComponent('Portfolio message from ' + f.name.value) + '&body=' + encodeURIComponent(body);
    say('Opening your email app…'); f.reset();
  });

  /* Comments (saved in this browser) */
  var KEY = 'alimar-comments', list = $('#comments');
  var seed = [{ name: 'Alimar M. Serad', text: 'Thank you for visiting my portfolio!', likes: 2, pinned: true }];
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || seed; } catch (e) { return seed; } }
  function save(c) { try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {} }
  var data = load();
  function render() {
    list.innerHTML = '';
    data.forEach(function (c, i) {
      var el = document.createElement('li'); el.className = 'comment' + (c.pinned ? ' pinned' : ''); el.style.animationDelay = i * 60 + 'ms';
      var av = document.createElement('span'); av.className = 'avatar-sm'; av.textContent = c.name.charAt(0);
      var b = document.createElement('div'); b.className = 'comment-body';
      var s = document.createElement('strong'); s.textContent = c.name;
      if (c.pinned) { var p = document.createElement('span'); p.className = 'pin'; p.textContent = 'PINNED'; s.appendChild(p); }
      var t = document.createElement('p'); t.textContent = c.text; b.appendChild(s); b.appendChild(t);
      var lk = document.createElement('button'); lk.type = 'button'; lk.className = 'like' + (c.liked ? ' on' : '');
      lk.innerHTML = '<svg class="ic"><use href="#i-heart"/></svg>'; lk.appendChild(document.createTextNode(c.likes || 0));
      lk.addEventListener('click', function () { c.liked = !c.liked; c.likes = (c.likes || 0) + (c.liked ? 1 : -1); save(data); render(); });
      el.appendChild(av); el.appendChild(b); el.appendChild(lk); list.appendChild(el);
    });
  }
  render();
  $('#commentForm').addEventListener('submit', function (e) {
    e.preventDefault(); var f = e.target;
    data.splice(1, 0, { name: f.name.value.trim(), text: f.comment.value.trim(), likes: 0 });
    save(data); render(); f.reset(); say('Comment posted!');
  });
})();

/* Interactive smoke background: drifts slowly, swirls away from the mouse, click = puff */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var c = document.createElement('canvas');
  c.className = 'smoke-bg'; c.setAttribute('aria-hidden', 'true');
  c.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;opacity:.9;mix-blend-mode:screen';
  var grid = document.querySelector('.bg-grid');
  if (grid && grid.parentNode) grid.parentNode.insertBefore(c, grid.nextSibling); else document.body.prepend(c);
  var g = c.getContext('2d'), W, H, dpr = Math.min(window.devicePixelRatio || 1, 2);
  var sprites = [];
  for (var s = 0; s < 4; s++) {
    var sc = document.createElement('canvas'); sc.width = sc.height = 128; var sg = sc.getContext('2d');
    for (var b = 0; b < 14; b++) {
      var a = Math.random() * 6.283, d = Math.random() * 28, x = 64 + Math.cos(a) * d, y = 64 + Math.sin(a) * d, r = 20 + Math.random() * 26;
      var gr = sg.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, 'rgba(200,200,205,.16)'); gr.addColorStop(1, 'rgba(150,150,155,0)');
      sg.fillStyle = gr; sg.fillRect(0, 0, 128, 128);
    }
    sprites.push(sc);
  }
  function size() { W = innerWidth; H = innerHeight; c.width = W * dpr; c.height = H * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0); }
  size(); addEventListener('resize', size);
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function make(x, y, big) {
    return { x: x, y: y, vx: rnd(-.2, .2), vy: rnd(-.35, -.08), r: big ? rnd(60, 120) : rnd(120, 260), rot: rnd(0, 6.28), spin: rnd(-.002, .002),
             life: 0, max: rnd(600, 1100), img: sprites[(Math.random() * 4) | 0], a: big ? .9 : rnd(.35, .6) };
  }
  var P = [];
  for (var i = 0; i < 28; i++) { var p = make(rnd(0, W), rnd(0, H)); p.life = rnd(0, p.max); P.push(p); }
  var mx = -999, my = -999, pmx = 0, pmy = 0;
  addEventListener('mousemove', function (e) { pmx = mx; pmy = my; mx = e.clientX; my = e.clientY; }, { passive: true });
  addEventListener('click', function (e) { for (var k = 0; k < 6; k++) P.push(make(e.clientX + rnd(-20, 20), e.clientY + rnd(-20, 20), true)); });
  (function loop() {
    g.clearRect(0, 0, W, H);
    var mvx = (mx - pmx) * .02, mvy = (my - pmy) * .02; pmx = mx; pmy = my;
    for (var k = P.length - 1; k >= 0; k--) {
      var p = P[k], dx = p.x - mx, dy = p.y - my, dd = Math.hypot(dx, dy) || 1, R = p.r + 120;
      if (dd < R) { var f = (1 - dd / R) * .5; p.vx += dx / dd * f + mvx * (1 - dd / R); p.vy += dy / dd * f + mvy * (1 - dd / R); }   // mouse pushes and drags the smoke
      p.vx *= .97; p.vy = p.vy * .97 - .004; p.x += p.vx; p.y += p.vy; p.rot += p.spin; p.life++;
      var t = p.life / p.max;
      if (t >= 1 || p.y < -p.r * 1.5) { P.splice(k, 1); if (P.length < 28) P.push(make(rnd(0, W), H + rnd(0, 150))); continue; }
      g.globalAlpha = Math.sin(t * Math.PI) * p.a;
      g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.drawImage(p.img, -p.r, -p.r, p.r * 2, p.r * 2); g.restore();
    }
    if (P.length > 80) P.splice(0, P.length - 80);
    g.globalAlpha = 1;
    requestAnimationFrame(loop);
  })();
})();
