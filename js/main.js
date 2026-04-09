/**
 * MBolt v2 — main.js
 * GSAP + ScrollTrigger + Lenis smooth scroll
 * Cursor · Nav · Hero · Counters · Horizontal work scroll
 * Modals · Dark mode · Accessibility · Form · Cookie banner
 */
(function () {
  'use strict';

  /* ── GSAP REGISTRATION ─────────────────────────────────── */
  // GSAP and ScrollTrigger loaded via CDN in HTML
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
  }

  /* ── STATE ─────────────────────────────────────────────── */
  let CONTENT = {};
  let lenis;
  const IS_TOUCH = window.matchMedia('(hover: none)').matches;
  const IS_MOBILE = window.innerWidth <= 600;

  /* ── CONTENT LOADER ────────────────────────────────────── */
  async function loadContent() {
    try {
      const res = await fetch('./data/content.json');
      CONTENT = await res.json();
    } catch (e) {
      console.warn('content.json not loaded — static HTML fallback active.', e);
    }
  }

  /* ── LENIS SMOOTH SCROLL ───────────────────────────────── */
  function initLenis() {
    if (typeof Lenis === 'undefined') return;
    lenis = new Lenis({
      duration: 0.8,
      easing: t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
      smoothWheel: true,
      wheelMultiplier: 1.2,
      touchMultiplier: 1.5,
      smoothTouch: false,
    });

    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      lenis.on('scroll', ScrollTrigger.update);
      // GSAP ticker gives time in seconds; Lenis.raf expects milliseconds
      gsap.ticker.add(time => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      // Fallback: rAF gives ms directly
      function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
      requestAnimationFrame(raf);
    }
  }

  /* ── CUSTOM CURSOR ─────────────────────────────────────── */
  function initCursor() {
    if (IS_TOUCH) return;
    const dot  = document.getElementById('cursor-dot');
    const ring = document.getElementById('cursor-ring');
    if (!dot || !ring) return;

    // Show cursor elements once mouse moves (avoids flash at 0,0 on load)
    dot.style.opacity  = '0';
    ring.style.opacity = '0';

    let mx = 0, my = 0, rx = 0, ry = 0, moved = false;

    document.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      dot.style.left = mx + 'px';
      dot.style.top  = my + 'px';
      if (!moved) {
        moved = true;
        dot.style.opacity  = '1';
        ring.style.opacity = '1';
        // Hide native cursor now we know mouse is active
        document.body.style.cursor = 'none';
      }
    });

    (function rafRing() {
      rx += (mx - rx) * 0.1;
      ry += (my - ry) * 0.1;
      ring.style.left = rx + 'px';
      ring.style.top  = ry + 'px';
      requestAnimationFrame(rafRing);
    })();

    // Click ripple
    document.addEventListener('click', e => {
      const ripple = document.createElement('div');
      ripple.className = 'cursor-ripple';
      ripple.style.left = e.clientX + 'px';
      ripple.style.top  = e.clientY + 'px';
      document.body.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });

    // Context-aware states
    function addCursorContext(sel, dotClass, ringClass) {
      document.querySelectorAll(sel).forEach(el => {
        el.addEventListener('mouseenter', () => {
          dot.className  = 'cursor-dot '  + dotClass;
          ring.className = 'cursor-ring ' + ringClass;
        });
        el.addEventListener('mouseleave', () => {
          dot.className  = 'cursor-dot';
          ring.className = 'cursor-ring';
        });
      });
    }

    // Buttons: ring expands and turns red, dot stays visible (not hidden)
    addCursorContext('.btn, .nav-cta, .drawer-cta', 'on-btn', 'on-btn expanded');
    addCursorContext('.service-card, .work-card, .team-card, .culture-card', '', 'expanded');
    addCursorContext('.client-pill', 'on-volt', 'expanded');

    // Magnetic buttons
    if (!IS_MOBILE) {
      document.querySelectorAll('.btn-primary, .nav-cta').forEach(btn => {
        btn.addEventListener('mousemove', e => {
          const rect = btn.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top  + rect.height / 2;
          const dx = (e.clientX - cx) * 0.18;
          const dy = (e.clientY - cy) * 0.18;
          btn.style.transform = `translate(${dx}px, ${dy}px) translateY(-2px)`;
        });
        btn.addEventListener('mouseleave', () => {
          btn.style.transform = '';
        });
      });
    }
  }

  /* ── TEAM PHOTO INITIALS FALLBACK ──────────────────────── */
  function initTeamPhotos() {
    document.querySelectorAll('.team-photo').forEach(container => {
      const img = container.querySelector('img');
      if (!img) return;
      const applyLoaded = () => {
        if (img.naturalWidth > 0) container.classList.add('has-photo');
      };
      if (img.complete) { applyLoaded(); }
      else {
        img.addEventListener('load',  applyLoaded);
        img.addEventListener('error', () => container.classList.remove('has-photo'));
      }
    });
  }


  function initTheme() {
    // Already applied in <script> in <head> — just wire up the toggle buttons
    document.querySelectorAll('.theme-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('mbolt-theme', next);
      });
    });
  }

  /* ── NAVBAR ────────────────────────────────────────────── */
  function initNav() {
    const nav     = document.getElementById('main-nav');
    const burger  = document.getElementById('nav-burger');
    const drawer  = document.getElementById('nav-drawer');

    if (!nav) return;

    // Scroll state
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 60);
    }, { passive: true });

    // Hamburger
    if (burger && drawer) {
      const toggleDrawer = open => {
        burger.classList.toggle('open', open);
        drawer.classList.toggle('open', open);
        burger.setAttribute('aria-expanded', String(open));
        document.body.style.overflow = open ? 'hidden' : '';
        if (lenis) open ? lenis.stop() : lenis.start();
      };
      burger.addEventListener('click', () => toggleDrawer(!drawer.classList.contains('open')));
      drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', () => toggleDrawer(false)));
    }

    // Active link highlighting
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-links a');
    if (sections.length && navLinks.length) {
      const obs = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            navLinks.forEach(a => {
              a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id || a.getAttribute('href') === 'index.html#' + e.target.id);
            });
          }
        });
      }, { threshold: 0.4 });
      sections.forEach(s => obs.observe(s));
    }
  }

  /* ── HERO ANIMATIONS ───────────────────────────────────── */
  function initHero() {
    if (typeof gsap === 'undefined') return;

    // Parallax on hero image
    const heroBg = document.querySelector('.hero-bg');
    if (heroBg && typeof ScrollTrigger !== 'undefined') {
      gsap.to(heroBg, {
        yPercent: 25,
        ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
      });
    }

    // Strike line
    const strike = document.querySelector('.hero-strike');
    if (strike) {
      gsap.to(strike, { width: '100%', duration: 1.2, delay: 3, ease: 'power3.out' });
    }

    // Entrance sequence
    const tl = gsap.timeline({ delay: .3 });
    const heroEyebrow = document.querySelector('.hero-eyebrow');
    const heroLines   = document.querySelectorAll('.hero-headline .line');
    const heroSub     = document.querySelector('.hero-sub');
    const heroSign    = document.querySelector('.hero-signoff');
    const heroCtAs    = document.querySelector('.hero-ctas');

    if (heroEyebrow) tl.from(heroEyebrow, { y: 20, opacity: 0, duration: .7, ease: 'power3.out' });
    if (heroLines.length) {
      heroLines.forEach((line, i) => {
        tl.from(line, { y: 60, opacity: 0, duration: .8, ease: 'power3.out' }, i === 0 ? '-=.3' : '-=.5');
      });
    }
    if (heroSub)  tl.from(heroSub,  { y: 20, opacity: 0, duration: .7, ease: 'power3.out' }, '-=.4');
    if (heroSign) tl.from(heroSign, { y: 16, opacity: 0, duration: .6, ease: 'power3.out' }, '-=.3');
    if (heroCtAs) tl.from(heroCtAs, { y: 20, opacity: 0, duration: .7, ease: 'power3.out' }, '-=.3');
  }

  /* ── SCROLL REVEAL ─────────────────────────────────────── */
  function initReveal() {
    const els = document.querySelectorAll('.reveal');
    if (!els.length) return;

    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      els.forEach(el => {
        ScrollTrigger.create({
          trigger: el,
          start: 'top 88%',
          onEnter: () => el.classList.add('visible'),
          once: true
        });
      });
    } else {
      // Pure IntersectionObserver fallback
      const obs = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
      }, { threshold: 0.12 });
      els.forEach(el => obs.observe(el));
    }
  }

  /* ── COUNTERS ──────────────────────────────────────────── */
  function initCounters() {
    const proofEl = document.querySelector('.proof');
    if (!proofEl) return;

    function animCount(span, target, dur = 1600) {
      let start = null;
      function step(ts) {
        if (!start) start = ts;
        const p = Math.min((ts - start) / dur, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        span.textContent = Math.round(ease * target);
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    const obs = new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting) return;
      proofEl.querySelectorAll('.proof-count').forEach(span => {
        const t = parseInt(span.closest('.proof-number').dataset.target, 10);
        if (!isNaN(t)) animCount(span, t);
      });
      obs.disconnect();
    }, { threshold: .5 });
    obs.observe(proofEl);
  }

  /* ── HORIZONTAL WORK SCROLL ────────────────────────────── */
  function initWorkScroll() {
    if (window.innerWidth <= 768) return;
    const track = document.querySelector('.work-track');
    const progress = document.querySelector('.work-progress');
    if (!track || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    const cards = track.querySelectorAll('.work-card');
    const totalWidth = Array.from(cards).reduce((w, c) => w + c.offsetWidth + 24, 0) - window.innerWidth + (window.innerWidth * 0.1);

    const st = ScrollTrigger.create({
      trigger: '.work-pin-wrap',
      start: 'top top',
      end: () => '+=' + totalWidth,
      pin: '.work-sticky',
      scrub: 1,
      onUpdate: self => {
        gsap.set(track, { x: -self.progress * totalWidth });
        if (progress) progress.style.width = (self.progress * 100) + '%';
      }
    });
  }

  /* ── SERVICE MODALS ────────────────────────────────────── */
  function initModals() {
    const overlay = document.getElementById('modal-overlay');
    const modal   = document.getElementById('service-modal');
    if (!overlay || !modal) return;

    function openModal(data) {
      document.getElementById('modal-num').textContent  = data.number;
      document.getElementById('modal-name').textContent = data.name;
      document.getElementById('modal-desc').textContent = data.fullDesc || data.shortDesc;
      const tagsEl = document.getElementById('modal-tags');
      tagsEl.innerHTML = data.tags.map(t => `<span class="stag">${t}</span>`).join('');
      overlay.classList.add('open');
      modal.classList.add('open');
      if (lenis) lenis.stop();
      document.body.style.overflow = 'hidden';
    }

    function closeModal() {
      overlay.classList.remove('open');
      modal.classList.remove('open');
      if (lenis) lenis.start();
      document.body.style.overflow = '';
    }

    overlay.addEventListener('click', closeModal);
    document.getElementById('modal-close')?.addEventListener('click', closeModal);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

    document.querySelectorAll('.service-card[data-service-id]').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.serviceId;
        const svc = (CONTENT.services || []).find(s => s.id === id);
        if (svc) openModal(svc);
        else {
          // fallback from HTML data attributes
          openModal({
            number: card.querySelector('.service-num')?.textContent || '',
            name: card.querySelector('.h-card')?.textContent || '',
            shortDesc: card.querySelector('.body-md')?.textContent || '',
            fullDesc: card.querySelector('.body-md')?.textContent || '',
            tags: Array.from(card.querySelectorAll('.stag')).map(t => t.textContent)
          });
        }
      });
    });
  }

  /* ── FLOATING CTA ──────────────────────────────────────── */
  function initFloatingCta() {
    const cta = document.getElementById('floating-cta');
    const scrollTop = document.getElementById('scroll-top-btn');

    if (cta) {
      window.addEventListener('scroll', () => {
        const past = window.scrollY > window.innerHeight * 0.8;
        const nearBottom = (window.innerHeight + window.scrollY) >= document.body.offsetHeight - 300;
        cta.classList.toggle('visible', past && !nearBottom);
      }, { passive: true });
    }

    if (scrollTop) {
      window.addEventListener('scroll', () => {
        scrollTop.classList.toggle('visible', window.scrollY > 300);
      }, { passive: true });
      scrollTop.addEventListener('click', () => {
        if (lenis) lenis.scrollTo(0);
        else window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }

  /* ── SMOOTH SCROLL ANCHORS ─────────────────────────────── */
  function initAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        const target = document.querySelector(a.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        if (lenis) lenis.scrollTo(target, { offset: -70 });
        else {
          const top = target.getBoundingClientRect().top + window.scrollY - 70;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      });
    });
  }

  /* ── FORM ──────────────────────────────────────────────── */
  function initForms() {
    document.querySelectorAll('[data-form]').forEach(form => {
      const btn = form.querySelector('[data-submit]');
      if (!btn) return;

      btn.addEventListener('click', () => {
        const fields = form.querySelectorAll('[required]');
        let valid = true;
        fields.forEach(f => {
          const empty = !f.value.trim();
          const badEmail = f.type === 'email' && f.value && !/\S+@\S+\.\S+/.test(f.value);
          f.style.borderColor = (empty || badEmail) ? 'var(--red)' : '';
          if (empty || badEmail) valid = false;
        });

        if (!valid) {
          btn.textContent = 'Please fill in required fields';
          btn.style.background = '#888';
          setTimeout(() => {
            btn.textContent = btn.dataset.label || 'Send';
            btn.style.background = '';
          }, 2800);
          return;
        }

        btn.textContent = 'Message sent';
        btn.style.background = 'var(--volt)';
        btn.disabled = true;
        // Production: replace with fetch POST to Formspree or backend
      });
    });
  }

  /* ── ACCESSIBILITY PANEL ───────────────────────────────── */
  function initA11y() {
    const toggle   = document.getElementById('a11y-toggle');
    const panel    = document.getElementById('a11y-panel');
    const hcCheck  = document.getElementById('a11y-hc');
    const motCheck = document.getElementById('a11y-motion');
    const fontSldr = document.getElementById('a11y-font');
    if (!toggle || !panel) return;

    toggle.addEventListener('click', e => { e.stopPropagation(); panel.classList.toggle('open'); });
    document.addEventListener('click', e => { if (!panel.contains(e.target) && e.target !== toggle) panel.classList.remove('open'); });

    if (hcCheck) {
      hcCheck.addEventListener('change', () => {
        document.body.classList.toggle('high-contrast', hcCheck.checked);
        localStorage.setItem('mbolt-hc', hcCheck.checked ? '1' : '');
      });
      if (localStorage.getItem('mbolt-hc')) { hcCheck.checked = true; document.body.classList.add('high-contrast'); }
    }

    if (motCheck) {
      const applyMotion = val => {
        document.body.classList.toggle('reduce-motion', val);
        document.querySelectorAll('.ticker, .hero-mesh, .scroll-thumb').forEach(el => {
          el.style.animationPlayState = val ? 'paused' : '';
        });
        if (lenis) val ? lenis.stop() : lenis.start();
      };
      motCheck.addEventListener('change', () => {
        applyMotion(motCheck.checked);
        localStorage.setItem('mbolt-rm', motCheck.checked ? '1' : '');
      });
      const saved = localStorage.getItem('mbolt-rm') || (window.matchMedia('(prefers-reduced-motion: reduce)').matches ? '1' : '');
      if (saved) { motCheck.checked = true; applyMotion(true); }
    }

    if (fontSldr) {
      fontSldr.addEventListener('input', () => {
        document.documentElement.style.fontSize = fontSldr.value + 'px';
        localStorage.setItem('mbolt-fs', fontSldr.value);
      });
      const savedFs = localStorage.getItem('mbolt-fs');
      if (savedFs) { fontSldr.value = savedFs; document.documentElement.style.fontSize = savedFs + 'px'; }
    }
  }

  /* ── COOKIE BANNER ─────────────────────────────────────── */
  function initCookies() {
    const banner = document.getElementById('cookie-banner');
    if (!banner) return;
    if (localStorage.getItem('mbolt-cookies')) return;
    setTimeout(() => banner.classList.add('visible'), 1500);

    document.getElementById('cookie-accept')?.addEventListener('click', () => {
      localStorage.setItem('mbolt-cookies', 'accepted');
      banner.classList.remove('visible');
    });
    document.getElementById('cookie-decline')?.addEventListener('click', () => {
      localStorage.setItem('mbolt-cookies', 'declined');
      banner.classList.remove('visible');
    });
  }

  /* ── LEGAL PAGE TABS ───────────────────────────────────── */
  function initLegalTabs() {
    const tabs = document.querySelectorAll('.legal-tab');
    if (!tabs.length) return;
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.legal-section').forEach(s => s.classList.remove('active'));
        tab.classList.add('active');
        const target = document.getElementById(tab.dataset.target);
        if (target) target.classList.add('active');
      });
    });
  }

  /* ── INIT ──────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', async () => {
    initTheme();
    initCookies();
    initNav();
    initTeamPhotos();
    await loadContent();
    initLenis();
    initCursor();
    initHero();
    initReveal();
    initCounters();
    initWorkScroll();
    initModals();
    initFloatingCta();
    initAnchors();
    initForms();
    initA11y();
    initLegalTabs();

    // Refresh ScrollTrigger after fonts load
    document.fonts?.ready.then(() => {
      if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
    });

    // Resize
    window.addEventListener('resize', () => {
      if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
    });
  });

})();
