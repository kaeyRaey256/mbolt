/**
 * MBolt — main.js
 * All interactivity: cursor, nav, slideshow, counters,
 * scroll reveal, ticker, form, accessibility panel
 */

(function () {
  'use strict';

  /* ── CONTENT ──────────────────────────────────────────────── */
  let CONTENT = {};

  async function loadContent() {
    try {
      const res = await fetch('./data/content.json');
      CONTENT = await res.json();
      buildPage();
    } catch (e) {
      // If fetch fails (e.g. opened as file://) fallback is already in HTML
      console.warn('Content JSON not loaded, using static HTML fallback.', e);
    }
  }

  /* ── BUILD PAGE FROM JSON ─────────────────────────────────── */
  function buildPage() {
    buildStats();
    buildServices();
    buildClients();
    buildWork();
    buildTeam();
    buildTestimonials();
    buildContact();
    buildFooter();
    // Re-observe any newly added reveal elements
    document.querySelectorAll('.reveal:not(.observed)').forEach(el => {
      revealObserver.observe(el);
      el.classList.add('observed');
    });
  }

  function buildStats() {
    const wrap = document.getElementById('proof-stats');
    if (!wrap || !CONTENT.stats) return;
    wrap.innerHTML = CONTENT.stats.map((s, i) => `
      <div class="proof-item reveal${i ? ' reveal-delay-' + i : ''}">
        <div class="proof-number" data-target="${s.number}">
          <span class="proof-count">0</span><sup>${s.suffix}</sup>
        </div>
        <div class="proof-label">${s.label}</div>
      </div>
    `).join('');
  }

  function buildServices() {
    const grid = document.getElementById('services-grid');
    if (!grid || !CONTENT.services) return;
    grid.innerHTML = CONTENT.services.map((s, i) => `
      <div class="service-card reveal${i > 0 ? ' reveal-delay-' + i : ''}" role="listitem">
        <div class="service-number" aria-hidden="true">${s.number}</div>
        <div class="service-icon-wrap" aria-hidden="true">
          ${serviceIconSVG(s.id)}
        </div>
        <h3 class="service-name">${s.name}</h3>
        <p class="service-desc">${s.description}</p>
        <div class="service-tags">${s.tags.map(t => `<span class="service-tag">${t}</span>`).join('')}</div>
      </div>
    `).join('');
  }

  function serviceIconSVG(id) {
    const icons = {
      btl: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13 2L4.5 13.5H11L9 22L19.5 9.5H13L13 2Z" fill="currentColor" style="color:var(--volt)"/></svg>`,
      comms: `<svg viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" style="color:var(--volt)"/></svg>`,
      sales: `<svg viewBox="0 0 24 24" fill="none"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" style="color:var(--volt)"/><polyline points="17 6 23 6 23 12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" style="color:var(--volt)"/></svg>`,
      supplies: `<svg viewBox="0 0 24 24" fill="none"><rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" stroke-width="1.8" style="color:var(--volt)"/><path d="M8 21h8M12 17v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" style="color:var(--volt)"/></svg>`
    };
    return icons[id] || icons.btl;
  }

  function buildClients() {
    const wrap = document.getElementById('clients-ticker');
    if (!wrap || !CONTENT.clients) return;
    // Duplicate for seamless infinite scroll
    const pills = CONTENT.clients.map(c => `
      <div class="client-logo-pill">
        <img src="assets/${c.logo}" alt="${c.name} logo" loading="lazy"
             onerror="this.style.display='none'">
        <span>${c.name}</span>
      </div>
    `).join('');
    wrap.innerHTML = pills + pills; // duplicate
  }

  function buildWork() {
    const grid = document.getElementById('work-grid');
    if (!grid || !CONTENT.work) return;
    grid.innerHTML = CONTENT.work.map((w, i) => `
      <div class="work-card reveal${i > 0 ? ' reveal-delay-' + Math.min(i, 5) : ''}"
           role="listitem" tabindex="0" aria-label="${w.client}: ${w.name}">
        <img src="assets/${w.image}" alt="${w.alt}" loading="lazy"
             onerror="this.src='assets/images/placeholder-work.jpg'">
        <div class="work-card-overlay" aria-hidden="true">
          <div class="work-card-client">${w.client}</div>
          <div class="work-card-name">${w.name}</div>
        </div>
        <div class="work-card-category" aria-hidden="true">${w.category}</div>
      </div>
    `).join('');
  }

  function buildTeam() {
    const grid = document.getElementById('team-grid');
    if (!grid || !CONTENT.team) return;
    grid.innerHTML = CONTENT.team.map((t, i) => `
      <div class="team-card reveal${i > 0 ? ' reveal-delay-' + Math.min(i, 5) : ''}" role="listitem">
        <div class="team-photo-wrap">
          <img src="assets/${t.photo}" alt="Photo of ${t.name}" loading="lazy"
               onerror="this.style.display='none'">
          <div class="team-initials" aria-hidden="true">${t.initials}</div>
        </div>
        <div class="team-info">
          <div class="team-name">${t.name}</div>
          <div class="team-role">${t.role}</div>
          <p class="team-bio">${t.bio}</p>
          <div class="team-quote">${t.quote}</div>
        </div>
      </div>
    `).join('');
  }

  function buildTestimonials() {
    const wrap = document.getElementById('testimonial-wrap');
    if (!wrap || !CONTENT.testimonials) return;
    const t = CONTENT.testimonials[0];
    // Highlight key phrase
    const highlighted = t.quote.replace('do not hesitate in giving suggestions',
      '<em>do not hesitate in giving suggestions</em>');
    wrap.innerHTML = `
      <blockquote>
        <p class="testi-quote">${highlighted}</p>
        <footer class="testi-author">
          <div class="testi-avatar" aria-hidden="true">${t.initials}</div>
          <div>
            <div class="testi-name">${t.name}</div>
            <div class="testi-title">${t.title}, ${t.company}</div>
          </div>
        </footer>
      </blockquote>
    `;
  }

  function buildContact() {
    const c = CONTENT.contact;
    if (!c) return;
    const phone1El = document.getElementById('contact-phone1');
    const phone2El = document.getElementById('contact-phone2');
    const emailEl  = document.getElementById('contact-email');
    const addrEl   = document.getElementById('contact-address');
    if (phone1El) phone1El.textContent = c.phone1;
    if (phone2El) phone2El.textContent = c.phone2;
    if (emailEl)  emailEl.textContent  = c.email;
    if (addrEl)   addrEl.textContent   = c.address + ', ' + c.pobox;
  }

  function buildFooter() {
    const c = CONTENT.contact;
    if (!c) return;
    ['footer-phone', 'footer-email', 'footer-address'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      if (id === 'footer-phone') el.textContent = c.phone1;
      if (id === 'footer-email') el.textContent = c.email;
      if (id === 'footer-address') el.textContent = c.address;
    });
  }

  /* ── CUSTOM CURSOR ────────────────────────────────────────── */
  function initCursor() {
    const dot  = document.getElementById('cursor-dot');
    const ring = document.getElementById('cursor-ring');
    if (!dot || !ring) return;
    if (window.matchMedia('(hover: none)').matches) return;

    let mx = 0, my = 0, rx = 0, ry = 0;

    document.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      dot.style.left = mx + 'px';
      dot.style.top  = my + 'px';
    });

    (function animRing() {
      rx += (mx - rx) * 0.11;
      ry += (my - ry) * 0.11;
      ring.style.left = rx + 'px';
      ring.style.top  = ry + 'px';
      requestAnimationFrame(animRing);
    })();

    const hoverEls = 'a, button, input, textarea, select, .work-card, .team-card, .client-logo-pill, .service-card, .social-btn, .footer-social';
    document.querySelectorAll(hoverEls).forEach(el => {
      el.addEventListener('mouseenter', () => { dot.classList.add('hover'); ring.classList.add('hover'); });
      el.addEventListener('mouseleave', () => { dot.classList.remove('hover'); ring.classList.remove('hover'); });
    });
  }

  /* ── NAVBAR ───────────────────────────────────────────────── */
  function initNav() {
    const nav     = document.getElementById('main-nav');
    const burger  = document.getElementById('nav-burger');
    const drawer  = document.getElementById('nav-drawer');
    const overlay = document.getElementById('nav-overlay');

    if (!nav) return;

    // Scroll state
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 50);
    }, { passive: true });

    // Hamburger
    if (burger && drawer && overlay) {
      function openDrawer() {
        drawer.classList.add('open');
        overlay.classList.add('open');
        burger.classList.add('open');
        burger.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
      }
      function closeDrawer() {
        drawer.classList.remove('open');
        overlay.classList.remove('open');
        burger.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
      burger.addEventListener('click', () => burger.classList.contains('open') ? closeDrawer() : openDrawer());
      overlay.addEventListener('click', closeDrawer);
      drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', closeDrawer));
    }
  }

  /* ── HERO SLIDESHOW ───────────────────────────────────────── */
  function initSlideshow() {
    const slides = document.querySelectorAll('.slide');
    const dots   = document.querySelectorAll('.slide-dot');
    if (!slides.length) return;

    let current = 0;
    let timer;

    function goTo(idx) {
      slides[current].classList.remove('active');
      dots[current]?.classList.remove('active');
      current = (idx + slides.length) % slides.length;
      slides[current].classList.add('active');
      dots[current]?.classList.add('active');
    }

    function next() { goTo(current + 1); }

    timer = setInterval(next, 4500);

    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        clearInterval(timer);
        goTo(i);
        timer = setInterval(next, 4500);
      });
    });

    // Pause on reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      clearInterval(timer);
    }
  }

  /* ── SCROLL REVEAL ────────────────────────────────────────── */
  let revealObserver;

  function initReveal() {
    revealObserver = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          revealObserver.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });

    document.querySelectorAll('.reveal').forEach(el => {
      revealObserver.observe(el);
      el.classList.add('observed');
    });
  }

  /* ── COUNTER ANIMATION ────────────────────────────────────── */
  function initCounters() {
    const proofEl = document.getElementById('proof-stats');
    if (!proofEl) return;

    const counterObs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.querySelectorAll('.proof-count').forEach(span => {
          const target = parseInt(span.closest('.proof-number').dataset.target, 10);
          if (isNaN(target)) return;
          animateCount(span, target);
        });
        counterObs.unobserve(e.target);
      });
    }, { threshold: 0.5 });

    counterObs.observe(proofEl);
  }

  function animateCount(el, target) {
    const duration = 1600;
    let start = null;
    function step(ts) {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
      el.textContent = Math.round(eased * target);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ── SERVICE CARD MICRO INTERACTION ──────────────────────── */
  function initServiceCards() {
    document.querySelectorAll('.service-card').forEach(card => {
      card.addEventListener('mouseenter', () => {
        const num = card.querySelector('.service-number');
        if (num) { num.style.transform = 'translateX(8px)'; num.style.transition = 'transform .3s'; }
      });
      card.addEventListener('mouseleave', () => {
        const num = card.querySelector('.service-number');
        if (num) num.style.transform = 'translateX(0)';
      });
    });
  }

  /* ── WORK CARD KEYBOARD ───────────────────────────────────── */
  function initWorkCards() {
    document.querySelectorAll('.work-card').forEach(card => {
      card.addEventListener('focus', () => {
        const overlay = card.querySelector('.work-card-overlay');
        if (overlay) overlay.style.opacity = '1';
      });
      card.addEventListener('blur', () => {
        const overlay = card.querySelector('.work-card-overlay');
        if (overlay) overlay.style.opacity = '';
      });
    });
  }

  /* ── ACCESSIBILITY PANEL ──────────────────────────────────── */
  function initA11y() {
    const toggle   = document.getElementById('a11y-toggle');
    const panel    = document.getElementById('a11y-panel');
    const hcCheck  = document.getElementById('a11y-hc');
    const motCheck = document.getElementById('a11y-motion');
    const fontSldr = document.getElementById('a11y-font');

    if (!toggle || !panel) return;

    toggle.addEventListener('click', e => {
      e.stopPropagation();
      panel.classList.toggle('open');
      toggle.setAttribute('aria-expanded', panel.classList.contains('open'));
    });
    document.addEventListener('click', e => {
      if (!panel.contains(e.target) && e.target !== toggle) {
        panel.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });

    if (hcCheck) {
      hcCheck.addEventListener('change', () => {
        document.body.classList.toggle('high-contrast', hcCheck.checked);
        localStorage.setItem('mbolt-hc', hcCheck.checked ? '1' : '');
      });
      if (localStorage.getItem('mbolt-hc')) {
        hcCheck.checked = true;
        document.body.classList.add('high-contrast');
      }
    }

    if (motCheck) {
      motCheck.addEventListener('change', () => {
        document.body.classList.toggle('reduce-motion', motCheck.checked);
        // Pause ticker and slideshow
        const ticker = document.querySelector('.clients-ticker');
        if (ticker) ticker.style.animationPlayState = motCheck.checked ? 'paused' : 'running';
        localStorage.setItem('mbolt-rm', motCheck.checked ? '1' : '');
      });
      if (localStorage.getItem('mbolt-rm') ||
          window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        motCheck.checked = true;
        document.body.classList.add('reduce-motion');
      }
    }

    if (fontSldr) {
      fontSldr.addEventListener('input', () => {
        document.documentElement.style.fontSize = fontSldr.value + 'px';
        localStorage.setItem('mbolt-fs', fontSldr.value);
      });
      const savedFs = localStorage.getItem('mbolt-fs');
      if (savedFs) {
        fontSldr.value = savedFs;
        document.documentElement.style.fontSize = savedFs + 'px';
      }
    }
  }

  /* ── FORM ─────────────────────────────────────────────────── */
  function initForm() {
    const form = document.getElementById('contact-form');
    const btn  = document.getElementById('form-submit');
    if (!form || !btn) return;

    btn.addEventListener('click', () => {
      const name    = form.querySelector('#f-name')?.value.trim();
      const company = form.querySelector('#f-company')?.value.trim();
      const email   = form.querySelector('#f-email')?.value.trim();
      const moment  = form.querySelector('#f-moment')?.value;
      const msg     = form.querySelector('#f-message')?.value.trim();

      // Simple validation
      const valid = name && email && moment && /\S+@\S+\.\S+/.test(email);
      if (!valid) {
        btn.textContent = 'Please fill in the key fields';
        btn.style.background = '#888';
        setTimeout(() => {
          btn.textContent = 'Send it ⚡';
          btn.style.background = '';
        }, 2800);
        return;
      }

      // Success state
      btn.textContent = 'Message sent ✓';
      btn.style.background = 'var(--volt)';
      btn.style.color = '#fff';
      btn.disabled = true;

      // In production: replace with actual fetch/POST to backend or Formspree
      console.log('Form submission:', { name, company, email, moment, msg });
    });
  }

  /* ── SMOOTH SCROLL FOR NAV LINKS ──────────────────────────── */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        const target = document.querySelector(a.getAttribute('href'));
        if (target) {
          e.preventDefault();
          const offset = 70;
          const top = target.getBoundingClientRect().top + window.scrollY - offset;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      });
    });
  }

  /* ── INIT ─────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    initCursor();
    initNav();
    initSlideshow();
    initReveal();
    initA11y();
    initSmoothScroll();
    loadContent().then(() => {
      // After content built, init card interactions
      initServiceCards();
      initWorkCards();
      initCounters();
    });
  });

})();

