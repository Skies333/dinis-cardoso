// Dinis Cardoso — motion layer (runs after main.js)
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var raf = window.requestAnimationFrame.bind(window);

  // ---- Word-by-word headings --------------------------------------------
  var heads = document.querySelectorAll('.section-head h2, .p-head h1, .p-head2 h1, .contact h2, .chapter h2, .result h2, .next-proj h2, .about-photo h3');
  heads.forEach(function (h) {
    if (h.children.length) return;
    var words = h.textContent.trim().split(/\s+/);
    h.setAttribute('aria-label', h.textContent.trim());
    h.innerHTML = words.map(function (w, i) {
      return '<span class="sw" aria-hidden="true"><span style="--wd:' + (i * 0.06).toFixed(2) + 's">' + w.replace(/</g, '&lt;') + '</span></span>';
    }).join(' ');
    h.classList.add('split');
  });

  // ---- Stagger indexes ----------------------------------------------------
  function idx(sel) { document.querySelectorAll(sel).forEach(function (g) { Array.prototype.forEach.call(g.children, function (c, i) { c.style.setProperty('--k', i); }); }); }
  idx('.cv-chips'); idx('.p-tags'); idx('.journey'); idx('.socials');

  // ---- Observe new things -------------------------------------------------
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
  document.querySelectorAll('.split, .journey, .contact, .cv-card, .p-head .lead').forEach(function (el) { io.observe(el); });

  // ---- Counters on tool bars ---------------------------------------------
  var cio = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      cio.unobserve(e.target);
      var el = e.target.querySelector('.pct'); if (!el) return;
      var to = parseInt(el.textContent, 10) || 0, t0 = null;
      (function step(t) {
        if (!t0) t0 = t;
        var p = Math.min(1, (t - t0) / 1400), v = Math.round(to * (1 - Math.pow(1 - p, 3)));
        el.textContent = v + '%';
        if (p < 1) raf(step);
      })(performance.now());
      el.textContent = '0%';
    });
  }, { threshold: 0.4 });
  document.querySelectorAll('.tool').forEach(function (t) { cio.observe(t); });

  // ---- Scroll-to-top button ---------------------------------------------
  var tt = document.createElement('button');
  tt.className = 'to-top'; tt.type = 'button'; tt.setAttribute('aria-label', (document.documentElement.lang || '').indexOf('pt') === 0 ? 'Voltar ao topo' : 'Back to top');
  tt.innerHTML = '<svg class="ring" viewBox="0 0 56 56" aria-hidden="true"><circle class="bg" cx="28" cy="28" r="25"/><circle class="fg" cx="28" cy="28" r="25"/></svg>' +
    '<svg class="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7"/><path d="M8 7h9v9"/></svg>';
  var ring = tt.querySelector('.fg');
  tt.addEventListener('click', function () { if (window.__lenis) window.__lenis.scrollTo(0, { duration: 1.4 }); else scrollTo({ top: 0, behavior: 'smooth' }); });
  document.body.appendChild(tt);

  // ---- Scroll-driven: nav hide, marquee velocity, parallax, to-top -------
  var nav = document.querySelector('.nav');
  var track = document.querySelector('.marquee-track');
  var par = Array.prototype.slice.call(document.querySelectorAll('.about-photo img, .cv-sheet img, .badge-wrap'));
  var lastY = scrollY, vel = 0, mx = 0;
  if (track) track.style.animation = 'none';
  addEventListener('scroll', function () {
    var y = scrollY, d = y - lastY;
    vel += d * 0.12;
    if (nav) nav.classList.toggle('hide', d > 4 && y > 220);
    if (nav && d < -4) nav.classList.remove('hide');
    var max = document.documentElement.scrollHeight - innerHeight, pr = max > 0 ? y / max : 0;
    tt.classList.toggle('show', pr > 0.55 && y > 700);
    if (ring) ring.style.strokeDashoffset = (157 * (1 - pr)).toFixed(1);
    lastY = y;
  }, { passive: true });
  (function loop() {
    if (track) {
      vel *= 0.92;
      mx -= 0.6 + Math.abs(vel);
      var half = track.scrollWidth / 2;
      if (half && -mx >= half) mx += half;
      track.style.transform = 'translate3d(' + mx + 'px,0,0)';
    }
    var vh = innerHeight;
    par.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      var c = (r.top + r.height / 2 - vh / 2) / vh;
      if (el.classList.contains('badge-wrap')) { el.style.translate = '0 ' + (c * -30).toFixed(1) + 'px'; }
      else { el.style.translate = '0 ' + (c * -40).toFixed(1) + 'px'; el.style.scale = '1.12'; }
    });
    raf(loop);
  })();

  // ---- Page transitions ---------------------------------------------------
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
    var href = a.getAttribute('href');
    if (!href || href.charAt(0) === '#' || /^(mailto|tel|https?):/i.test(href)) return;
    var url = new URL(a.href, location.href);
    if (url.pathname === location.pathname && url.hash) return;
    e.preventDefault();
    document.body.classList.add('leaving');
    setTimeout(function () { location.href = a.href; }, 300);
  });
  addEventListener('pageshow', function (e) { if (e.persisted) document.body.classList.remove('leaving'); });

  // ---- 3D tilt on the ID badge only (mouse) ------------------------------
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var bz = document.querySelector('.badge .bezel'), hero = document.querySelector('.hero');
    if (bz && hero) {
      hero.addEventListener('mousemove', function (e) {
        var r = bz.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        px = Math.max(-1, Math.min(1, px)); py = Math.max(-1, Math.min(1, py));
        bz.classList.add('tilt');
        bz.style.transform = 'perspective(900px) rotateX(' + (-py * 10).toFixed(2) + 'deg) rotateY(' + (px * 10).toFixed(2) + 'deg)';
      });
      hero.addEventListener('mouseleave', function () { bz.classList.remove('tilt'); bz.style.transform = ''; });
    }
  }

})();
