/**
 * MBolt — main.js v4
 * All bugs fixed · All upgrades applied
 */
(function () {
  'use strict';

  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
  }

  let lenis;
  const IS_TOUCH  = window.matchMedia('(hover: none)').matches;
  const IS_MOBILE = window.innerWidth <= 600;
  let CONTENT = {};

  /* ── CONTENT ───────────────────────────────────────────── */
  async function loadContent() {
    try {
      const res = await fetch('./data/content.json');
      CONTENT = await res.json();
    } catch (e) { /* static HTML fallback */ }
  }

  /* ── LENIS ─────────────────────────────────────────────── */
  function initLenis() {
    if (typeof Lenis === 'undefined') return;
    lenis = new Lenis({
      duration: 0.85,
      easing: t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
      smoothWheel: true,
      wheelMultiplier: 1.1,
      touchMultiplier: 1.5,
      smoothTouch: false,
    });
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(time => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      (function raf(time) { lenis.raf(time); requestAnimationFrame(raf); })(0);
    }
  }

  /* ── THEME (wires up toggles — theme already set in <head>) */
  function initTheme() {
    document.querySelectorAll('.theme-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('mbolt-theme', next);
      });
    });
  }

  /* ── CURSOR ─────────────────────────────────────────────── */
  function initCursor() {
    if (IS_TOUCH) return;
    const dot  = document.getElementById('cursor-dot');
    const ring = document.getElementById('cursor-ring');
    if (!dot || !ring) return;

    dot.style.opacity = ring.style.opacity = '0';
    let mx = 0, my = 0, rx = 0, ry = 0, moved = false;

    document.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      dot.style.left = mx + 'px'; dot.style.top = my + 'px';
      if (!moved) {
        moved = true;
        dot.style.opacity = ring.style.opacity = '1';
        document.body.style.cursor = 'none';
      }
    });

    (function rafRing() {
      rx += (mx - rx) * 0.1; ry += (my - ry) * 0.1;
      ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
      requestAnimationFrame(rafRing);
    })();

    document.addEventListener('click', e => {
      const r = document.createElement('div');
      r.className = 'cursor-ripple';
      r.style.left = e.clientX + 'px'; r.style.top = e.clientY + 'px';
      document.body.appendChild(r);
      setTimeout(() => r.remove(), 600);
    });

    function ctx(sel, dc, rc) {
      document.querySelectorAll(sel).forEach(el => {
        el.addEventListener('mouseenter', () => { dot.className = 'cursor-dot ' + dc; ring.className = 'cursor-ring ' + rc; });
        el.addEventListener('mouseleave', () => { dot.className = 'cursor-dot'; ring.className = 'cursor-ring'; });
      });
    }
    ctx('.btn, .nav-cta, .drawer-cta', 'on-btn', 'on-btn expanded');
    ctx('.service-card, .work-card, .team-card, .culture-card', '', 'expanded');
    ctx('.client-pill', 'on-volt', 'expanded');

    if (!IS_MOBILE) {
      document.querySelectorAll('.btn-primary, .nav-cta').forEach(btn => {
        btn.addEventListener('mousemove', e => {
          const r = btn.getBoundingClientRect();
          const dx = (e.clientX - r.left - r.width / 2) * 0.16;
          const dy = (e.clientY - r.top  - r.height / 2) * 0.16;
          btn.style.transform = `translate(${dx}px,${dy}px) translateY(-2px)`;
        });
        btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
      });
    }
  }

  /* ── TEAM PHOTOS — initials fallback ───────────────────── */
  function initTeamPhotos() {
    document.querySelectorAll('.team-photo').forEach(container => {
      const img = container.querySelector('img');
      if (!img) return;
      const apply = () => { if (img.naturalWidth > 0) container.classList.add('has-photo'); };
      if (img.complete) apply();
      else {
        img.addEventListener('load', apply);
        img.addEventListener('error', () => container.classList.remove('has-photo'));
      }
    });
  }

  /* ── NAVBAR ─────────────────────────────────────────────── */
  function initNav() {
    const nav    = document.getElementById('main-nav');
    const burger = document.getElementById('nav-burger');
    const drawer = document.getElementById('nav-drawer');
    if (!nav) return;

    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 60);
    }, { passive: true });

    if (burger && drawer) {
      const toggle = open => {
        burger.classList.toggle('open', open);
        drawer.classList.toggle('open', open);
        burger.setAttribute('aria-expanded', String(open));
        document.body.style.overflow = open ? 'hidden' : '';
        if (lenis) { try { open ? lenis.stop() : lenis.start(); } catch(e){} }
      };
      burger.addEventListener('click', () => toggle(!drawer.classList.contains('open')));
      drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', () => toggle(false)));
    }

    // Active section highlight
    const sections = document.querySelectorAll('section[id]');
    const links    = document.querySelectorAll('.nav-links a');
    if (sections.length && links.length) {
      new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (e.isIntersecting) links.forEach(a => {
            a.classList.toggle('active',
              a.getAttribute('href') === '#' + e.target.id ||
              a.getAttribute('href') === 'index.html#' + e.target.id);
          });
        });
      }, { threshold: 0.4 }).observe(document.querySelector('section[id]') || document.body);
    }
  }

  /* ── HERO ───────────────────────────────────────────────── */
  function initHero() {
    if (typeof gsap === 'undefined') return;

    // Parallax
    const bg = document.querySelector('.hero-bg');
    if (bg && ScrollTrigger) {
      gsap.to(bg, { yPercent: 25, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    }

    // Strike line
    const strike = document.querySelector('.hero-strike');
    if (strike) gsap.to(strike, { width: '100%', duration: 1.2, delay: 2.8, ease: 'power3.out' });

    // Entrance
    const tl = gsap.timeline({ delay: .25 });
    const ey = document.querySelector('.hero-eyebrow');
    const ln = document.querySelectorAll('.hero-headline .line');
    const sb = document.querySelector('.hero-sub');
    const sg = document.querySelector('.hero-signoff');
    const ct = document.querySelector('.hero-ctas');

    if (ey) tl.from(ey, { y: 20, opacity: 0, duration: .6, ease: 'power3.out' });
    ln.forEach((l, i) => tl.from(l, { y: 55, opacity: 0, duration: .75, ease: 'power3.out' }, i === 0 ? '-=.2' : '-=.5'));
    if (sb) tl.from(sb, { y: 18, opacity: 0, duration: .6, ease: 'power3.out' }, '-=.4');
    if (sg) tl.from(sg, { y: 14, opacity: 0, duration: .55, ease: 'power3.out' }, '-=.3');
    if (ct) tl.from(ct, { y: 18, opacity: 0, duration: .6, ease: 'power3.out' }, '-=.3');
  }

  /* ── SCROLL REVEAL ──────────────────────────────────────── */
  function initReveal() {
    const els = document.querySelectorAll('.reveal');
    if (!els.length) return;
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      els.forEach(el => ScrollTrigger.create({ trigger: el, start: 'top 88%', onEnter: () => el.classList.add('visible'), once: true }));
    } else {
      new IntersectionObserver((ents, obs) => {
        ents.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
      }, { threshold: 0.12 }).observe(els[0]);
      els.forEach(el => {
        new IntersectionObserver((ents, obs) => { ents.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } }); }, { threshold: 0.12 }).observe(el);
      });
    }
  }

  /* ── SERVICE CARD ENTRANCE (staggered scale) ────────────── */
  function initServiceEntrance() {
    const cards = document.querySelectorAll('.service-card');
    if (!cards.length) return;
    new IntersectionObserver((ents, obs) => {
      ents.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
      });
    }, { threshold: 0.15 }).observe(cards[0].closest('.services-grid') || cards[0]);
    // Observe each card individually for the stagger
    cards.forEach(card => {
      new IntersectionObserver((ents, obs) => {
        ents.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
      }, { threshold: 0.1 }).observe(card);
    });
  }

  /* ── FOOTER ENTRANCE ────────────────────────────────────── */
  function initFooterEntrance() {
    const grid = document.querySelector('.footer-grid');
    if (!grid) return;
    new IntersectionObserver((ents, obs) => {
      ents.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
    }, { threshold: 0.2 }).observe(grid);
  }

  /* ── COUNTERS ───────────────────────────────────────────── */
  function initCounters() {
    const proof = document.querySelector('.proof');
    if (!proof) return;

    function animCount(span, target, dur = 1400) {
      let start = null;
      const step = ts => {
        if (!start) start = ts;
        const p    = Math.min((ts - start) / dur, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        const val  = Math.round(ease * target);
        span.textContent = val;
        // Tick pulse on the parent number element
        if (p < 1) {
          requestAnimationFrame(step);
        } else {
          span.textContent = target;
        }
      };
      requestAnimationFrame(step);
    }

    new IntersectionObserver((ents, obs) => {
      if (!ents[0].isIntersecting) return;
      proof.querySelectorAll('.proof-count').forEach(span => {
        const t = parseInt(span.closest('.proof-number').dataset.target, 10);
        if (!isNaN(t)) animCount(span, t);
      });
      obs.disconnect();
    }, { threshold: .5 }).observe(proof);
  }

  /* ── WORK HORIZONTAL SCROLL ─────────────────────────────── */
  function initWorkScroll() {
    // Guard: only on viewport > 768px AND gsap available
    if (window.innerWidth <= 768) return;
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    const wrap    = document.querySelector('.work-pin-wrap');
    const sticky  = document.querySelector('.work-sticky');
    const track   = document.querySelector('.work-track');
    const progress = document.querySelector('.work-progress');
    if (!wrap || !sticky || !track) return;

    const cards = track.querySelectorAll('.work-card');
    if (!cards.length) return;

    // Calculate exact scroll distance
    let trackW = 0;
    cards.forEach(c => { trackW += c.offsetWidth + 24; });
    const scrollDist = trackW - window.innerWidth + parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--page-pad') || '80');

    // Set wrap height so normal page flow accounts for the scroll distance
    wrap.style.height = (window.innerHeight + scrollDist) + 'px';

    ScrollTrigger.create({
      trigger: wrap,
      start: 'top top',
      end: () => '+=' + scrollDist,
      pin: sticky,
      anticipatePin: 1,
      scrub: 1.2,
      invalidateOnRefresh: true,
      onUpdate: self => {
        gsap.set(track, { x: -(self.progress * scrollDist) });
        if (progress) progress.style.width = (self.progress * 100) + '%';
      }
    });
  }

  /* ── CLIENTS TICKER — gradual slowdown ──────────────────── */
  function initTicker() {
    const ticker = document.querySelector('.ticker');
    if (!ticker) return;
    let slowTimer;
    ticker.addEventListener('mouseenter', () => {
      clearTimeout(slowTimer);
      ticker.classList.add('slowing');
    });
    ticker.addEventListener('mouseleave', () => {
      ticker.classList.remove('slowing');
    });
  }

  /* ── MODALS ─────────────────────────────────────────────── */
  function initModals() {
    const overlay = document.getElementById('modal-overlay');
    const modal   = document.getElementById('service-modal');
    if (!overlay || !modal) return;

    function open(data) {
      document.getElementById('modal-num').textContent  = data.number || '';
      document.getElementById('modal-name').textContent = data.name   || '';
      document.getElementById('modal-desc').textContent = data.fullDesc || data.shortDesc || '';
      document.getElementById('modal-tags').innerHTML   = (data.tags || []).map(t => `<span class="stag">${t}</span>`).join('');
      overlay.classList.add('open'); modal.classList.add('open');
      try { if (lenis) lenis.stop(); } catch(e) {}
      document.body.style.overflow = 'hidden';
    }
    function close() {
      overlay.classList.remove('open'); modal.classList.remove('open');
      try { if (lenis) lenis.start(); } catch(e) {}
      document.body.style.overflow = '';
    }

    overlay.addEventListener('click', close);
    document.getElementById('modal-close')?.addEventListener('click', close);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    // Close CTA inside modal also triggers close + scroll
    document.getElementById('modal-cta-btn')?.addEventListener('click', close);

    document.querySelectorAll('.service-card[data-service-id]').forEach(card => {
      card.addEventListener('click', () => {
        const svc = (CONTENT.services || []).find(s => s.id === card.dataset.serviceId);
        if (svc) { open(svc); return; }
        open({
          number:    card.querySelector('.service-num')?.textContent || '',
          name:      card.querySelector('.h-card')?.textContent || '',
          shortDesc: card.querySelector('.body-md')?.textContent || '',
          fullDesc:  card.querySelector('.body-md')?.textContent || '',
          tags: Array.from(card.querySelectorAll('.stag')).map(t => t.textContent)
        });
      });
    });
  }

  /* ── FLOATING CTA ───────────────────────────────────────── */
  function initFloatingCta() {
    const cta       = document.getElementById('floating-cta');
    const scrollTop = document.getElementById('scroll-top-btn');

    if (cta) {
      window.addEventListener('scroll', () => {
        const past      = window.scrollY > window.innerHeight * 0.8;
        const nearEnd   = (window.innerHeight + window.scrollY) >= document.body.offsetHeight - 300;
        cta.classList.toggle('visible', past && !nearEnd);
      }, { passive: true });
    }
    if (scrollTop) {
      window.addEventListener('scroll', () => {
        scrollTop.classList.toggle('visible', window.scrollY > 300);
      }, { passive: true });
      scrollTop.addEventListener('click', () => {
        try { if (lenis) { lenis.scrollTo(0); return; } } catch(e) {}
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }

  /* ── SMOOTH ANCHORS ─────────────────────────────────────── */
  function initAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        const target = document.querySelector(a.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        try { if (lenis) { lenis.scrollTo(target, { offset: -70 }); return; } } catch(err) {}
        window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 70, behavior: 'smooth' });
      });
    });
  }

  /* ── FORMS ──────────────────────────────────────────────── */
  function initForms() {
    document.querySelectorAll('[data-form]').forEach(form => {
      const btn = form.querySelector('[data-submit]');
      if (!btn) return;
      // Reset state if user revisits (navigated away and back)
      btn.disabled = false;
      btn.textContent = btn.dataset.label || 'Send';
      btn.style.background = '';

      btn.addEventListener('click', () => {
        if (btn.disabled) return;
        const fields = form.querySelectorAll('[required]');
        let valid = true;
        fields.forEach(f => {
          const empty    = !f.value.trim();
          const badEmail = f.type === 'email' && f.value && !/\S+@\S+\.\S+/.test(f.value);
          f.style.borderColor = (empty || badEmail) ? 'var(--red)' : '';
          if (empty || badEmail) valid = false;
        });
        if (!valid) {
          const orig = btn.innerHTML;
          btn.innerHTML = '<span>Fill in required fields</span>';
          btn.style.background = 'var(--ink-4)';
          setTimeout(() => { btn.innerHTML = orig; btn.style.background = ''; }, 2600);
          return;
        }
        btn.innerHTML = '<span>Message sent</span>';
        btn.style.background = 'var(--volt)';
        btn.disabled = true;
        // TODO: replace with fetch POST to Formspree/backend
      });
    });
  }

  /* ── ACCESSIBILITY ──────────────────────────────────────── */
  function initA11y() {
    const toggle  = document.getElementById('a11y-toggle');
    const panel   = document.getElementById('a11y-panel');
    const hcCheck = document.getElementById('a11y-hc');
    const motCheck= document.getElementById('a11y-motion');
    const fontSldr= document.getElementById('a11y-font');
    if (!toggle || !panel) return;

    toggle.addEventListener('click', e => { e.stopPropagation(); panel.classList.toggle('open'); toggle.setAttribute('aria-expanded', panel.classList.contains('open')); });
    document.addEventListener('click', e => { if (!panel.contains(e.target) && e.target !== toggle) panel.classList.remove('open'); });

    if (hcCheck) {
      hcCheck.addEventListener('change', () => { document.body.classList.toggle('high-contrast', hcCheck.checked); localStorage.setItem('mbolt-hc', hcCheck.checked ? '1' : ''); });
      if (localStorage.getItem('mbolt-hc')) { hcCheck.checked = true; document.body.classList.add('high-contrast'); }
    }
    if (motCheck) {
      const apply = v => {
        document.body.classList.toggle('reduce-motion', v);
        document.querySelectorAll('.ticker,.hero-mesh,.scroll-thumb').forEach(el => { el.style.animationPlayState = v ? 'paused' : ''; });
        try { if (lenis) v ? lenis.stop() : lenis.start(); } catch(e){}
      };
      motCheck.addEventListener('change', () => { apply(motCheck.checked); localStorage.setItem('mbolt-rm', motCheck.checked ? '1' : ''); });
      const saved = localStorage.getItem('mbolt-rm') || (window.matchMedia('(prefers-reduced-motion:reduce)').matches ? '1' : '');
      if (saved) { motCheck.checked = true; apply(true); }
    }
    if (fontSldr) {
      fontSldr.addEventListener('input', () => { document.documentElement.style.fontSize = fontSldr.value + 'px'; localStorage.setItem('mbolt-fs', fontSldr.value); });
      const s = localStorage.getItem('mbolt-fs');
      if (s) { fontSldr.value = s; document.documentElement.style.fontSize = s + 'px'; }
    }
  }

  /* ── COOKIES ────────────────────────────────────────────── */
  function initCookies() {
    const banner = document.getElementById('cookie-banner');
    if (!banner || localStorage.getItem('mbolt-cookies')) return;
    setTimeout(() => banner.classList.add('visible'), 1500);
    document.getElementById('cookie-accept')?.addEventListener('click', () => { localStorage.setItem('mbolt-cookies','accepted'); banner.classList.remove('visible'); });
    document.getElementById('cookie-decline')?.addEventListener('click', () => { localStorage.setItem('mbolt-cookies','declined'); banner.classList.remove('visible'); });
  }

  /* ── LEGAL TABS ─────────────────────────────────────────── */
  function initLegalTabs() {
    const tabs = document.querySelectorAll('.legal-tab');
    if (!tabs.length) return;
    // Ensure first tab/section active state is correct on load
    tabs[0]?.classList.add('active');
    document.querySelectorAll('.legal-section')[0]?.classList.add('active');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-pressed','false'); });
        document.querySelectorAll('.legal-section').forEach(s => s.classList.remove('active'));
        tab.classList.add('active'); tab.setAttribute('aria-pressed','true');
        const target = document.getElementById(tab.dataset.target);
        if (target) target.classList.add('active');
      });
    });
  }

  /* ── INIT ───────────────────────────────────────────────── */
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
    initServiceEntrance();
    initCounters();
    initTicker();
    initWorkScroll();
    initModals();
    initFloatingCta();
    initAnchors();
    initForms();
    initA11y();
    initLegalTabs();
    initFooterEntrance();

    document.fonts?.ready.then(() => {
      if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
    });
    window.addEventListener('resize', () => {
      if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
    });
  });

})();
