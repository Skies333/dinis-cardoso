// Dinis Cardoso — small progressive enhancements (site works without JS)
(function () {
  var root = document.documentElement;
  root.classList.add('js');
  var PT = (root.getAttribute('lang') || '').toLowerCase().indexOf('pt') === 0;

  // Always open pages at the top (unless the link points to a section)
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  var toTop = function () { if (!location.hash) window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); };
  toTop();
  addEventListener('DOMContentLoaded', toTop);
  addEventListener('load', toTop);
  addEventListener('pageshow', toTop);
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Hero headline: split into words for the rise-in animation
  var h1 = document.querySelector('.hero h1[data-split]');
  if (h1) {
    var html = '';
    var i = 0;
    h1.childNodes.forEach(function (node) {
      var isEm = node.nodeType === 1 && node.tagName === 'EM';
      var text = node.textContent;
      text.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) { html += ' '; return; }
        var inner = '<span style="--d:' + (0.08 + i * 0.07).toFixed(2) + 's">' + part + '</span>';
        html += '<span class="w">' + (isEm ? '<em>' + inner + '</em>' : inner) + '</span>';
        i++;
      });
    });
    h1.setAttribute('aria-label', h1.textContent.replace(/\s+/g, ' ').trim());
    h1.innerHTML = html;
    Array.prototype.forEach.call(h1.children, function (c) { c.setAttribute('aria-hidden', 'true'); });
  }
  var hero = document.querySelector('.hero');
  if (hero) requestAnimationFrame(function () { requestAnimationFrame(function () { hero.classList.add('ready'); }); });

  // Reveal on scroll
  var els = document.querySelectorAll('.rv, .tool, .motto-quote, .beats');
  if (!('IntersectionObserver' in window) || reduce) {
    els.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach(function (el) { io.observe(el); });
  }

  // Nav: highlight the section in view (home page only)
  var links = document.querySelectorAll('.nav a[data-sec]');
  if (links.length && 'IntersectionObserver' in window) {
    var map = {};
    links.forEach(function (a) { map[a.getAttribute('data-sec')] = a; });
    var so = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) { a.classList.remove('active'); });
        var a = map[e.target.id];
        if (a) a.classList.add('active');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).concat(['top', 'services', 'contact', 'work']).forEach(function (id) { var s = document.getElementById(id); if (s) so.observe(s); });
  }

  // Contact form: static hosting has no backend, so compose an email instead
  var form = document.querySelector('form[data-mailto]');
  if (form) {
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var to = form.getAttribute('data-mailto');
      var name = form.elements.name.value.trim();
      var email = form.elements.email.value.trim();
      var msg = form.elements.message.value.trim();
      var subject = (PT ? 'Contacto pelo portfólio' : 'Portfolio contact') + (name ? ' — ' + name : '');
      var body = msg + '\n\n— ' + name + (email ? ' (' + email + ')' : '');
      window.location.href = 'mailto:' + to + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      var note = form.querySelector('.form-note');
      if (note) note.textContent = PT ? 'A abrir a tua app de email…' : 'Opening your email app…';
    });
  }

  // Reading progress bar (project pages)
  var bar = document.querySelector('.progress i');
  if (bar) {
    var onScroll = function () {
      var h = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, scrollY / h) : 0) + ')';
    };
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // Lightbox for gallery images
  var lb = document.querySelector('.lb');
  var figs = Array.prototype.slice.call(document.querySelectorAll('.gallery figure[data-full]'));
  if (lb && figs.length) {
    var img = lb.querySelector('img'), ct = lb.querySelector('.ct'), cur = 0, last = null;
    var show = function (i) {
      cur = (i + figs.length) % figs.length;
      img.src = figs[cur].getAttribute('data-full');
      img.alt = figs[cur].querySelector('img').alt;
      ct.textContent = (cur + 1) + ' / ' + figs.length;
    };
    var open = function (i) {
      last = document.activeElement; show(i);
      lb.classList.add('open'); document.body.style.overflow = 'hidden'; if (window.__lenis) window.__lenis.stop();
      lb.querySelector('.x').focus();
    };
    var close = function () {
      lb.classList.remove('open'); document.body.style.overflow = ''; if (window.__lenis) window.__lenis.start();
      if (last && last.focus) last.focus();
    };
    figs.forEach(function (f, i) {
      f.setAttribute('tabindex', '0'); f.setAttribute('role', 'button');
      f.setAttribute('aria-label', (PT ? 'Abrir imagem ' : 'Open image ') + (i + 1));
      f.addEventListener('click', function () { open(i); });
      f.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i); } });
    });
    lb.querySelector('.x').addEventListener('click', close);
    lb.querySelector('.pv').addEventListener('click', function (e) { e.stopPropagation(); show(cur - 1); });
    lb.querySelector('.nx').addEventListener('click', function (e) { e.stopPropagation(); show(cur + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    if (figs.length < 2) { lb.querySelector('.pv').hidden = true; lb.querySelector('.nx').hidden = true; }
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(cur - 1);
      if (e.key === 'ArrowRight') show(cur + 1);
    });
  }

  // Project filters (projects page)
  var fbtns = document.querySelectorAll('.filter[data-f]');
  if (fbtns.length) {
    var cards = document.querySelectorAll('.all-grid .card');
    var empty = document.querySelector('.empty');
    fbtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var f = btn.getAttribute('data-f'), shown = 0;
        fbtns.forEach(function (o) { o.classList.toggle('on', o === btn); o.setAttribute('aria-pressed', o === btn ? 'true' : 'false'); });
        cards.forEach(function (c) {
          var ok = f === 'all' || (' ' + c.getAttribute('data-cat') + ' ').indexOf(' ' + f + ' ') > -1;
          c.classList.toggle('hide', !ok);
          if (ok) { shown++; c.classList.add('in'); }
        });
        if (empty) empty.hidden = shown > 0;
        var grid = document.querySelector('.all-grid');
        if (grid) grid.classList.toggle('filtered', f !== 'all');
      });
    });
  }

  // Education timeline: scrolling travels through the years (click also works)
  var tys = Array.prototype.slice.call(document.querySelectorAll('.tl-y'));
  if (tys.length) {
    var rows = document.querySelectorAll('.journey li[data-y]');
    var list = document.querySelector('.journey');
    var tl = document.querySelector('.tl');
    var wrapS = document.querySelector('.tl-scroll');
    var stickS = document.querySelector('.tl-sticky');
    var cur = -1;
    var setYear = function (i) {
      if (i === cur) return; cur = i;
      var yr = tys[i].getAttribute('data-y');
      tys.forEach(function (o, k) {
        o.classList.toggle('on', k === i); o.classList.toggle('past', k < i);
        o.setAttribute('aria-pressed', k === i ? 'true' : 'false');
      });
      rows.forEach(function (r) { r.classList.toggle('hit', r.getAttribute('data-y') === yr); });
      if (list) list.classList.add('dim');
    };
    tys.forEach(function (t, i) {
      t.addEventListener('click', function () {
        if (wrapS && stickS && getComputedStyle(stickS).position === 'sticky') {
          var top = wrapS.getBoundingClientRect().top + scrollY - 110;
          var range = wrapS.offsetHeight - stickS.offsetHeight;
          var dest = top + range * ((i + 0.5) / tys.length);
          if (window.__lenis) window.__lenis.scrollTo(dest, { duration: 1.1 }); else scrollTo({ top: dest, behavior: 'smooth' });
        } else { setYear(i); }
      });
    });
    var sizeWrap = function () {
      if (!wrapS || !stickS) return;
      if (getComputedStyle(stickS).position !== 'sticky') { wrapS.style.height = ''; return; }
      wrapS.style.height = (stickS.offsetHeight + tys.length * innerHeight * 0.38) + 'px';
    };
    var onScrollTl = function () {
      if (!wrapS || !stickS || getComputedStyle(stickS).position !== 'sticky') return;
      var r = wrapS.getBoundingClientRect();
      var range = wrapS.offsetHeight - stickS.offsetHeight;
      var p = Math.max(0, Math.min(0.9999, (110 - r.top) / range));
      if (tl) tl.style.setProperty('--tlp', p.toFixed(4));
      if (r.top < innerHeight * 0.75) setYear(Math.min(tys.length - 1, Math.floor(p * tys.length)));
    };
    sizeWrap();
    addEventListener('resize', function () { sizeWrap(); onScrollTl(); });
    addEventListener('load', function () { sizeWrap(); onScrollTl(); });
    addEventListener('scroll', onScrollTl, { passive: true });
    setYear(0); if (list) list.classList.remove('dim');
    onScrollTl();
  }

  // Liquid-glass nav: a glass pill slides to the active (or hovered) item
  var gnav = document.querySelector('.nav'), gpill = document.querySelector('.glass-pill');
  if (gnav && gpill) {
    var gl = Array.prototype.slice.call(gnav.querySelectorAll('a:not(.lang-switch)'));
    var hov = null;
    var place = function () {
      var t = hov || gnav.querySelector('a.active');
      if (!t) { gpill.style.opacity = '0'; gl.forEach(function (a) { a.removeAttribute('data-lit'); }); return; }
      gpill.style.opacity = '1';
      gpill.style.width = t.offsetWidth + 'px';
      gpill.style.transform = 'translateX(' + t.offsetLeft + 'px)';
      gl.forEach(function (a) { if ((a === t) !== a.hasAttribute('data-lit')) { if (a === t) a.setAttribute('data-lit', ''); else a.removeAttribute('data-lit'); } });
    };
    gl.forEach(function (a) {
      a.addEventListener('mouseenter', function () { hov = a; place(); });
      a.addEventListener('focus', function () { hov = a; place(); });
      a.addEventListener('blur', function () { hov = null; place(); });
    });
    gnav.addEventListener('mouseleave', function () { hov = null; place(); });
    var lastActive = null;
    new MutationObserver(function () { var a = gnav.querySelector('a.active'); if (a !== lastActive) { lastActive = a; place(); } }).observe(gnav, { subtree: true, attributes: true, attributeFilter: ['class'] });
    addEventListener('resize', place);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);
    var home = gnav.querySelector('a.home');
    if (home && home.hasAttribute('data-sec') && scrollY < 200 && !gnav.querySelector('a.active')) home.classList.add('active');
    place();
  }

  // Instagram-style story carousel (About)
  var story = document.querySelector('.story');
  if (story) {
    var slides = Array.prototype.slice.call(story.querySelectorAll('.st-slide'));
    var bars = Array.prototype.slice.call(story.querySelectorAll('.st-bars i'));
    var DUR = 5000, idx = 0, elapsed = 0, last = 0, playing = false, holds = 0, inView = false, rafId = null;
    var reduceM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var render = function () {
      slides.forEach(function (s, k) { s.classList.toggle('on', k === idx); });
      bars.forEach(function (b, k) {
        b.classList.toggle('done', k < idx);
        b.firstChild.style.transform = k < idx ? 'scaleX(1)' : (k > idx ? 'scaleX(0)' : 'scaleX(' + Math.min(1, elapsed / DUR) + ')');
      });
      // warm up the next image
      var nx = slides[(idx + 1) % slides.length]; if (nx && nx.loading === 'lazy') nx.loading = 'eager';
    };
    var go = function (k) { idx = (k + slides.length) % slides.length; elapsed = 0; render(); };
    var tick = function (t) {
      rafId = null;
      var active = playing && holds === 0 && inView && !document.hidden;
      if (active) { elapsed += Math.min(100, t - last); if (elapsed >= DUR) go(idx + 1); else bars[idx].firstChild.style.transform = 'scaleX(' + (elapsed / DUR) + ')'; }
      last = t;
      story.classList.toggle('paused', playing && (holds > 0) && inView);
      rafId = requestAnimationFrame(tick);
    };
    var start = function () { if (!rafId) { last = performance.now(); rafId = requestAnimationFrame(tick); } };
    playing = !reduceM;
    render();
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { es.forEach(function (e) { inView = e.isIntersecting; }); }, { threshold: 0.35 }).observe(story);
    } else { inView = true; }
    start();
    // tap left/right; hold to pause
    var downAt = 0, moved = false;
    story.querySelector('.st-prev').addEventListener('click', function () { if (Date.now() - downAt < 350) go(idx - 1); });
    story.querySelector('.st-next').addEventListener('click', function () { if (Date.now() - downAt < 350) go(idx + 1); });
    story.querySelectorAll('.st-tap').forEach(function (z) {
      z.addEventListener('pointerdown', function () { downAt = Date.now(); holds++; });
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) { z.addEventListener(ev, function () { holds = Math.max(0, holds - 1); }); });
      z.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    });
    // pause while hovering with a mouse
    if (window.matchMedia('(hover: hover)').matches) {
      story.addEventListener('mouseenter', function () { holds++; });
      story.addEventListener('mouseleave', function () { holds = 0; });
    }
    story.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { go(idx + 1); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { go(idx - 1); e.preventDefault(); }
      if (e.key === ' ') { playing = !playing; e.preventDefault(); }
    });
    // like + heart burst (also on double-tap)
    var likeBtn = story.querySelector('.st-like');
    var burst = function (x, y) {
      var h = document.createElement('span'); h.className = 'st-burst';
      h.innerHTML = likeBtn.innerHTML; h.style.left = x + 'px'; h.style.top = y + 'px';
      story.appendChild(h); setTimeout(function () { h.remove(); }, 950);
    };
    likeBtn.addEventListener('click', function () {
      var on = !likeBtn.classList.contains('liked');
      likeBtn.classList.toggle('liked', on); likeBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
      if (on) burst(story.clientWidth / 2, story.clientHeight / 2);
    });
    var lastTap = 0;
    story.querySelectorAll('.st-tap').forEach(function (z) {
      z.addEventListener('pointerup', function (e) {
        var now = Date.now();
        if (now - lastTap < 300) {
          var r = story.getBoundingClientRect();
          likeBtn.classList.add('liked'); likeBtn.setAttribute('aria-pressed', 'true');
          burst(e.clientX - r.left, e.clientY - r.top);
        }
        lastTap = now;
      });
    });
  }

  // About card: crossfade through photos
  var apS = document.querySelectorAll('.about-photo .ap-slide'), apD = document.querySelectorAll('.about-photo .ap-dots i');
  if (apS.length > 1) {
    var apI = 0, apVis = true;
    var apCard = document.querySelector('.about-photo');
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { apVis = es[0].isIntersecting; }).observe(apCard);
    setInterval(function () {
      if (!apVis || document.hidden) return;
      apS[apI].classList.remove('on'); if (apD[apI]) apD[apI].classList.remove('on');
      apI = (apI + 1) % apS.length;
      apS[apI].classList.add('on'); if (apD[apI]) apD[apI].classList.add('on');
    }, 3800);
  }

  var y = document.querySelector('[data-year]');
  if (y) y.textContent = new Date().getFullYear();
})();
