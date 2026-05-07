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

    // Initial state check
    if (window.scrollY > 60) nav.classList.add('scrolled');

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
      drawer.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', e => {
          const href = a.getAttribute('href');
          const isAnchor = href && href.startsWith('#');
          if (isAnchor) {
            e.preventDefault();
            toggle(false);
            // Wait for drawer close animation before scrolling
            setTimeout(() => {
              const target = document.querySelector(href);
              if (!target) return;
              try { if (lenis) { lenis.scrollTo(target, { offset: -70 }); return; } } catch(err) {}
              window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 70, behavior: 'smooth' });
            }, 380); // matches drawer transition .45s
          } else {
            toggle(false);
          }
        });
      });
    }

    // Active section highlight — observe ALL sections
    const sections = document.querySelectorAll('section[id]');
    const links    = document.querySelectorAll('.nav-links a');
    if (sections.length && links.length) {
      const sectionObs = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            links.forEach(a => {
              a.classList.toggle('active',
                a.getAttribute('href') === '#' + e.target.id ||
                a.getAttribute('href') === 'index.html#' + e.target.id
              );
            });
          }
        });
      }, { threshold: 0.35, rootMargin: '-70px 0px 0px 0px' });
      sections.forEach(s => sectionObs.observe(s));
    }
  }

  /* ── HERO ───────────────────────────────────────────────── */
  /* ── HERO IMAGE ROTATION — independent of GSAP ────────── */
  /* Runs on DOMContentLoaded, no GSAP dependency */
  function initHeroRotation() {
    const heroImages = [
      'assets/images/hero-1.jpg',
      'assets/images/hero-2.jpg',
      'assets/images/hero-3.jpg'
    ];

    const heroBg = document.querySelector('.hero-bg');
    if (!heroBg) return;

    // Build layered divs
    const layers = heroImages.map((src, i) => {
      const div = document.createElement('div');
      div.className = 'hero-bg-layer';
      // Inline transition — no GSAP needed
      div.style.cssText = [
        'position:absolute', 'inset:0',
        `background-image:url('${src}')`,
        'background-size:cover',
        `opacity:${i === 0 ? '1' : '0'}`,
        'transform:scale(1.04)',
        'transition:opacity 1.6s cubic-bezier(0.4,0,0.2,1), transform 8s ease-out'
      ].join(';');
      heroBg.appendChild(div);
      return div;
    });

    // Preload all images immediately
    heroImages.forEach(src => { const img = new Image(); img.src = src; });

    let current = 0;

    function showLayer(idx) {
      layers.forEach((layer, i) => {
        if (i === idx) {
          layer.style.transform = 'scale(1.04)';
          layer.style.opacity   = '1';
          // Double-rAF to allow layout to paint before breath animation
          requestAnimationFrame(() => requestAnimationFrame(() => {
            layer.style.transform = 'scale(1)';
          }));
        } else {
          layer.style.opacity = '0';
        }
      });
    }

    // Breathe first image in immediately
    requestAnimationFrame(() => requestAnimationFrame(() => {
      layers[0].style.transform = 'scale(1)';
    }));

    // Cycle every 8 seconds — pause when tab is hidden
    let timer = setInterval(advance, 8000);
    function advance() {
      current = (current + 1) % layers.length;
      showLayer(current);
    }
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { clearInterval(timer); }
      else { timer = setInterval(advance, 8000); }
    });
  }

  function initHero() {
    if (typeof gsap === 'undefined') return;

    const heroBg = document.querySelector('.hero-bg');

    // ── Parallax on the whole hero bg container ─────────────
    if (heroBg && ScrollTrigger) {
      gsap.to(heroBg, { yPercent: 20, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
      });
    }

    // ── Strike line ─────────────────────────────────────────
    const strike = document.querySelector('.hero-strike');
    if (strike) gsap.to(strike, { width: '100%', duration: 1.2, delay: 2.8, ease: 'power3.out' });

    // ── Content entrance ────────────────────────────────────
    const tl = gsap.timeline({ delay: .3 });
    const ey = document.querySelector('.hero-eyebrow');
    const ln = document.querySelectorAll('.hero-headline .line');
    const sb = document.querySelector('.hero-sub');
    const tg = document.querySelector('.hero-tagline');
    const sg = document.querySelector('.hero-signoff');
    const ct = document.querySelector('.hero-ctas');

    if (ey) tl.from(ey, { y: 16, opacity: 0, duration: .55, ease: 'power3.out' });
    ln.forEach((l, i) => tl.from(l, { y: 55, opacity: 0, duration: .75, ease: 'power3.out' }, i === 0 ? '-=.15' : '-=.5'));
    if (sb) tl.from(sb, { y: 16, opacity: 0, duration: .55, ease: 'power3.out' }, '-=.35');
    if (tg) tl.from(tg, { y: 12, opacity: 0, duration: .5,  ease: 'power3.out' }, '-=.3');
    if (sg) tl.from(sg, { y: 12, opacity: 0, duration: .5,  ease: 'power3.out' }, '-=.25');
    if (ct) tl.from(ct, { y: 16, opacity: 0, duration: .55, ease: 'power3.out' }, '-=.25');
  }

  /* ── SCROLL REVEAL ──────────────────────────────────────── */
  function initReveal() {
    const els = document.querySelectorAll('.reveal');
    if (!els.length) return;
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      els.forEach(el => ScrollTrigger.create({ trigger: el, start: 'top 88%', onEnter: () => el.classList.add('visible'), once: true }));
    } else {
      // Single observer for all elements (efficient)
      const revealObs = new IntersectionObserver((ents, obs) => {
        ents.forEach(e => {
          if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
        });
      }, { threshold: 0.12 });
      els.forEach(el => revealObs.observe(el));
    }
  }

  /* ── SERVICE CARD ENTRANCE (staggered scale) ────────────── */
  function initServiceEntrance() {
    const cards = document.querySelectorAll('.service-card');
    if (!cards.length) return;

    // If already in view on load (e.g. deep link), show immediately
    const grid = cards[0].closest('.services-grid');
    if (grid) {
      const rect = grid.getBoundingClientRect();
      if (rect.top < window.innerHeight) {
        // Already visible — apply all with stagger delays baked in
        cards.forEach((card, i) => {
          setTimeout(() => card.classList.add('visible'), i * 100);
        });
        return;
      }
    }

    // Otherwise observe the grid and stagger when it enters
    const obs = new IntersectionObserver((ents, observer) => {
      ents.forEach(e => {
        if (!e.isIntersecting) return;
        const allCards = e.target.querySelectorAll('.service-card');
        allCards.forEach((card, i) => {
          setTimeout(() => card.classList.add('visible'), i * 100);
        });
        observer.disconnect();
      });
    }, { threshold: 0.1 });
    if (grid) obs.observe(grid);
    else cards.forEach(c => obs.observe(c));
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
      const numEl = span.closest('.proof-number');
      if (numEl) numEl.classList.add('counting');
      let start = null;
      const step = ts => {
        if (!start) start = ts;
        const p    = Math.min((ts - start) / dur, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        span.textContent = Math.round(ease * target);
        if (p < 1) {
          requestAnimationFrame(step);
        } else {
          span.textContent = target;
          if (numEl) {
            numEl.classList.remove('counting');
            numEl.classList.add('done');
          }
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
    if (window.innerWidth <= 768) return;
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    const wrap     = document.querySelector('.work-pin-wrap');
    const sticky   = document.querySelector('.work-sticky');
    const track    = document.querySelector('.work-track');
    const progress = document.querySelector('.work-progress');
    if (!wrap || !sticky || !track) return;

    const cards = track.querySelectorAll('.work-card');
    if (!cards.length) return;

    // Must run after all images loaded so offsetWidth is real
    function build() {
      ScrollTrigger.getAll().forEach(st => {
        if (st.vars.trigger === wrap) st.kill();
      });

      // Force layout recalc
      track.style.transform = 'none';
      const pagePad = parseFloat(getComputedStyle(document.documentElement)
        .getPropertyValue('--page-pad')) || 80;

      let trackW = pagePad; // left padding
      cards.forEach(c => { trackW += c.offsetWidth + 24; });
      // scrollDist = how far we need to pull the track left
      const scrollDist = Math.max(0, trackW - window.innerWidth + pagePad);

      if (scrollDist < 10) return; // nothing to scroll

      // Give the wrap enough height so the page flow reserves scroll space
      wrap.style.height = (window.innerHeight + scrollDist) + 'px';

      ScrollTrigger.create({
        trigger: wrap,
        start: 'top top',
        end: () => '+=' + scrollDist,
        pin: sticky,
        anticipatePin: 1,
        scrub: 1,
        invalidateOnRefresh: true,
        onUpdate: self => {
          gsap.set(track, { x: -(self.progress * scrollDist), force3D: true });
          if (progress) progress.style.width = (self.progress * 100) + '%';
        }
      });
    }

    // Run after full page load (images painted, dimensions real)
    if (document.readyState === 'complete') {
      build();
    } else {
      window.addEventListener('load', build, { once: true });
    }

    // Rebuild on resize
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        wrap.style.height = '';
        build();
        ScrollTrigger.refresh();
      }, 250);
    });
  }

  /* ── CLIENTS TICKER — hover gradual slow, touch friendly ── */
  function initTicker() {
    const ticker = document.querySelector('.ticker');
    if (!ticker) return;

    // Hover: gradually slow then pause
    let pauseTimer;
    ticker.addEventListener('mouseenter', () => {
      ticker.classList.remove('paused');
      ticker.classList.add('slowing');
      clearTimeout(pauseTimer);
      // After CSS transition reaches slow speed, fully pause
      pauseTimer = setTimeout(() => ticker.classList.add('paused'), 1200);
    });
    ticker.addEventListener('mouseleave', () => {
      clearTimeout(pauseTimer);
      ticker.classList.remove('paused', 'slowing');
    });

    // Touch: tap to pause/resume (mobile clients section)
    let touchPaused = false;
    ticker.addEventListener('touchstart', () => {
      touchPaused = !touchPaused;
      ticker.classList.toggle('paused', touchPaused);
    }, { passive: true });
  }



  /* ── BODY SCROLL LOCK UTILITY ───────────────────────────── */
  /* Locks page scroll while keeping modal content scrollable  */
  /* Works on desktop, iOS Safari, Android Chrome              */
  function lockBody() {
    // Lock on html only — body stays in flow, modal scroll works everywhere
    document.documentElement.classList.add('modal-open');
    try { if (lenis) lenis.stop(); } catch(e) {}
  }
  function unlockBody() {
    document.documentElement.classList.remove('modal-open');
    try { if (lenis) lenis.start(); } catch(e) {}
  }

  /* ── WORK MODAL DATA ────────────────────────────────────── */
  const WORK_COPY = {
    w1: {
      client: 'Orange Telecom',
      name: 'Retail Outreach Campaign',
      category: 'Field Marketing',
      img: 'assets/images/work-1.jpg',
      copy: `<p>Orange Telecom needed to deepen their retail presence across key urban and peri-urban markets in Uganda. We deployed a coordinated field team across multiple regions simultaneously — brand ambassadors trained to convert conversations into connections at the point of sale.</p><p>The campaign ran for eight weeks. Teams operated across Kampala, Jinja, Mbale and Mbarara, visiting over 2,400 retail touchpoints. Every interaction was logged, every outlet mapped. The result was a measurable lift in Orange's shelf presence and a pipeline of newly activated retail partners.</p><p>This is what field marketing looks like when it's done with precision, not just presence.</p>`
    },
    w2: {
      client: "Gorillo's Snacks",
      name: "Branded Vans & Cannons",
      category: 'Promotions',
      img: 'assets/images/work-2.jpg',
      copy: `<p>Gorillo's Snacks wanted noise — the kind you feel before you see it. We built a mobile activation unit: fully branded vans fitted with product cannon systems that launched snack samples into crowds at high-footfall locations across the city.</p><p>The activation hit markets, taxi parks, university campuses and weekend events. Thousands of samples distributed. Thousands of photos taken. The brand didn't just show up — it became the moment people talked about on the way home.</p><p>BTL done loud. BTL done right.</p>`
    },
    w3: {
      client: 'TotalEnergies',
      name: 'Brand Experience Event',
      category: 'Brand Experience',
      img: 'assets/images/work-3.jpg',
      copy: `<p>TotalEnergies tasked us with creating an immersive brand experience that would communicate their energy transition message to a business and consumer audience in Uganda. We designed and produced a full-scale brand environment — from spatial layout to staffing to experiential touchpoints.</p><p>Visitors moved through a curated journey: the history of energy, TotalEnergies' operations in Uganda, and a vision of what's next. Interactive stations, product demos, and a live Q&A with brand representatives kept engagement high throughout.</p><p>Premium execution for a global brand, built and delivered by a Ugandan team.</p>`
    },
    w4: {
      client: 'Field Activation',
      name: 'Pay Campaign',
      category: 'Sales & Distribution',
      img: 'assets/images/work-4.jpg',
      copy: `<p>A direct sales and awareness campaign targeting underserved communities across central and western Uganda. Our field teams were trained on the product, equipped with the tools, and deployed with clear daily targets and geographic mandates.</p><p>Door-to-door. Market stall to market stall. The campaign ran across six districts over twelve weeks, with daily reporting, real-time route adjustments, and weekly performance reviews that kept the team sharp and the numbers moving.</p><p>Sales campaigns fail when the people on the ground aren't fully invested. Ours were.</p>`
    },
    w5: {
      client: 'Orange Telecom',
      name: 'Internet Packages Campaign',
      category: 'Communications',
      img: 'assets/images/work-5.jpg',
      copy: `<p>Orange needed to communicate a new internet package offering to a mass audience quickly and clearly. The message had to work across demographics — urban professionals, students, small business owners — and it had to drive immediate action.</p><p>We built a multi-channel communication campaign: trained brand communicators at key touch points, one-on-one demonstrations at retail locations, and a community outreach programme that took the message into neighbourhoods rather than waiting for customers to come to the brand.</p><p>Clear message. Right people. Right places. That's communication.</p>`
    },
    w6: {
      client: 'Smile Telecom',
      name: 'Rural Outreach Campaign',
      category: 'Field Marketing',
      img: 'assets/images/work-6.jpg',
      copy: `<p>Reaching rural Uganda is not the same as reaching Kampala. The infrastructure is different, the culture of communication is different, and the trust dynamic between brand and community requires a different approach entirely.</p><p>We deployed teams into districts across northern and eastern Uganda for Smile Telecom — teams who understood the communities they were entering, spoke the relevant languages, and built genuine connections rather than just completing a call sheet.</p><p>The campaign achieved registration and awareness targets ahead of schedule, with zero incidents and strong community feedback. Rural is not a lesser market. It requires better work.</p>`
    }
  };

  /* ── WORK MODAL ─────────────────────────────────────────── */
  function initWorkModal() {
    const overlay = document.getElementById('work-modal-overlay');
    const modal   = document.getElementById('work-modal');
    if (!overlay || !modal) return;

    const imgEl    = document.getElementById('work-modal-img');
    const catEl    = document.getElementById('work-modal-cat');
    const titleEl  = document.getElementById('work-modal-title');
    const clientEl = document.getElementById('work-modal-client');
    const copyEl   = document.getElementById('work-modal-copy');

    function openWork(data) {
      const body = modal.querySelector('.work-modal-body');

      // Set content before opening
      if (imgEl) {
        imgEl.src = data.img || '';
        imgEl.alt = data.name || '';
        imgEl.style.display = data.img ? 'block' : 'none';
      }
      if (catEl)    catEl.textContent  = data.category || '';
      if (titleEl)  titleEl.textContent = data.name    || '';
      if (clientEl) clientEl.textContent = data.client || '';
      if (copyEl)   copyEl.innerHTML   = data.copy     || '';

      // Stage body for entrance animation using classes only (no inline styles)
      if (body) {
        body.classList.remove('entered');
        body.classList.add('entering');
      }

      // Open modal
      overlay.classList.add('open');
      modal.classList.add('open');
      overlay.setAttribute('aria-hidden', 'false');

      // Trigger entrance animation on next frame
      requestAnimationFrame(() => {
        if (body) {
          body.classList.remove('entering');
          body.classList.add('entered');
        }
      });

      lockBody();
    }
    function closeWork() {
      overlay.classList.remove('open');
      modal.classList.remove('open');
      overlay.setAttribute('aria-hidden', 'true');
      // Reset body classes for next open
      const body = modal.querySelector('.work-modal-body');
      if (body) { body.classList.remove('entered', 'entering'); }
      unlockBody();
    }

    overlay.addEventListener('click', closeWork);
    document.getElementById('work-modal-close')?.addEventListener('click', closeWork);
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && modal.classList.contains('open')) closeWork(); });

    // Desktop: stop wheel events escaping modal so Lenis doesn't intercept them
    modal.addEventListener('wheel', e => {
      if (!modal.classList.contains('open')) return;
      const atTop    = modal.scrollTop === 0;
      const atBottom = modal.scrollTop + modal.clientHeight >= modal.scrollHeight - 1;
      if (modal.scrollHeight > modal.clientHeight) {
        if (!(atTop && e.deltaY < 0) && !(atBottom && e.deltaY > 0)) {
          e.stopPropagation();
        }
      }
    }, { passive: false });

    // Mobile/touch: stop Lenis consuming touch events inside the modal
    // This is the definitive fix for iOS scroll inside fixed modals
    modal.addEventListener('touchmove', e => {
      if (!modal.classList.contains('open')) return;
      // Allow scroll only if modal has scrollable content
      if (modal.scrollHeight > modal.clientHeight) {
        e.stopPropagation(); // stop Lenis from eating this touch
        // Do NOT call e.preventDefault() — that would stop scroll entirely
      }
    }, { passive: true });

    // Wire up ALL work cards (both horizontal track and mobile grid)
    document.querySelectorAll('.work-card').forEach((card, i) => {
      const keys = ['w1','w2','w3','w4','w5','w6'];
      // Use data-work-id if set, otherwise wrap index with modulo (handles duplicate mobile grid)
      const id = card.dataset.workId || keys[i % 6] || null;
      card.style.cursor = 'pointer';
      card.setAttribute('tabindex', '0');
      // Click handler
      const handleOpen = () => {
        const data = (id && WORK_COPY[id]) || {
          client:   card.querySelector('.work-client')?.textContent || '',
          name:     card.querySelector('.work-name')?.textContent   || '',
          category: card.querySelector('.work-cat')?.textContent    || '',
          img:      card.querySelector('img')?.getAttribute('src')  || '',
          copy:     '<p>Campaign details coming soon.</p>'
        };
        openWork(data);
      };
      card.addEventListener('click', handleOpen);
      // Keyboard accessibility
      card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleOpen(); } });
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
      lockBody();
    }
    function close() {
      overlay.classList.remove('open'); modal.classList.remove('open');
      unlockBody();
    }

    overlay.addEventListener('click', close);
    document.getElementById('modal-close')?.addEventListener('click', close);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    document.getElementById('modal-cta-btn')?.addEventListener('click', close);

    // Desktop: stop wheel events escaping service modal
    modal.addEventListener('wheel', e => {
      if (!modal.classList.contains('open')) return;
      const atTop    = modal.scrollTop === 0;
      const atBottom = modal.scrollTop + modal.clientHeight >= modal.scrollHeight - 1;
      if (modal.scrollHeight > modal.clientHeight) {
        if (!(atTop && e.deltaY < 0) && !(atBottom && e.deltaY > 0)) {
          e.stopPropagation();
        }
      }
    }, { passive: false });

    // Mobile: stop Lenis consuming touch events inside service modal
    modal.addEventListener('touchmove', e => {
      if (!modal.classList.contains('open')) return;
      if (modal.scrollHeight > modal.clientHeight) {
        e.stopPropagation();
      }
    }, { passive: true });

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


  /* ── FOOTER SERVICE LINKS → modals ─────────────────────── */
  function initFooterServiceLinks() {
    const map = {
      'BTL Marketing':          'btl',
      'Digital Solutions':      'digital',
      'Activation Strategy':    'strategy',
      'Communications':         'comms',
      'Sales & Distribution':   'sales',
      'General Supplies':       'supplies',
    };

    // Handle query param on load — opens modal if ?service=xxx in URL
    // (used when navigating from careers.html footer)
    const params = new URLSearchParams(window.location.search);
    const autoOpen = params.get('service');
    if (autoOpen) {
      // Wait for DOMContentLoaded + a tick for modals to init
      const tryOpen = () => {
        const card = document.querySelector(`.service-card[data-service-id="${autoOpen}"]`);
        if (card) {
          card.click();
          // Clean URL without reload
          history.replaceState({}, '', window.location.pathname);
        }
      };
      // Retry a few times in case modal init hasn't run yet
      setTimeout(tryOpen, 400);
    }

    document.querySelectorAll('.footer-links a').forEach(a => {
      const svcId = a.dataset.serviceOpen || map[a.textContent.trim()];
      if (!svcId) return;

      const card = document.querySelector(`.service-card[data-service-id="${svcId}"]`);

      a.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();

        if (card) {
          // Same page (index.html) — open modal immediately
          card.click();
        } else {
          // Different page (careers, legal) — navigate with query param
          window.location.href = `index.html?service=${encodeURIComponent(svcId)}`;
        }
      });
    });
  }

  /* ── FLOATING CTA ───────────────────────────────────────── */
  function initFloatingCta() {
    const cta        = document.getElementById('floating-cta');
    const scrollTop  = document.getElementById('scroll-top-btn');
    const heroScroll = document.querySelector('.hero-scroll');

    if (cta) {
      let ctaPulsed = false;
      window.addEventListener('scroll', () => {
        const past    = window.scrollY > window.innerHeight * 0.8;
        const nearEnd = (window.innerHeight + window.scrollY) >= document.body.offsetHeight - 300;
        const show    = past && !nearEnd;
        cta.classList.toggle('visible', show);
        if (show && !ctaPulsed) {
          ctaPulsed = true;
          cta.classList.add('pulse');
          setTimeout(() => cta.classList.remove('pulse'), 700);
        }
        // Hide hero scroll indicator once user has scrolled
        if (heroScroll && window.scrollY > 80) heroScroll.classList.add('hidden');
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
        // Animate form out, show success state
        const formInner = btn.closest('[data-form]');
        const card = formInner?.closest('.contact-form-card, .pipeline-box');
        if (formInner) {
          formInner.style.transition = 'opacity .4s, transform .4s';
          formInner.style.opacity = '0';
          formInner.style.transform = 'translateY(-8px)';
          setTimeout(() => {
            formInner.style.display = 'none';
            // Insert success message
            const success = document.createElement('div');
            success.className = 'form-success';
            success.innerHTML = `
              <div class="form-success-icon">
                <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div class="form-success-title">We've got your brief.</div>
              <p class="form-success-sub">We'll be in touch within one working day. In the meantime, have a look at our work.</p>
              <a href="#work" class="btn btn-primary" style="margin-top:.5rem;">
                <span>See our work</span>
              </a>
            `;
            (card || formInner.parentNode).appendChild(success);
            // Trigger animation
            requestAnimationFrame(() => success.classList.add('visible'));
          }, 420);
        }
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


  /* ── PROOF NUMBER MAGNETIC HOVER ───────────────────────── */
  function initProofMagnetic() {
    document.querySelectorAll('.proof-item').forEach(item => {
      const num = item.querySelector('.proof-number');
      if (!num) return;
      item.addEventListener('mousemove', e => {
        const rect = item.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top  + rect.height / 2;
        const dx = (e.clientX - cx) * 0.12;
        const dy = (e.clientY - cy) * 0.12;
        num.style.transform = `translate(${dx}px,${dy}px) scale(1.05)`;
      });
      item.addEventListener('mouseleave', () => {
        num.style.transform = '';
      });
    });
  }


  /* ── TESTIMONIAL ROTATION ───────────────────────────────── */
  function initTestiRotation() {
    const section = document.querySelector('.testi-section');
    if (!section) return;
    const quote = section.querySelector('.testi-quote');
    const author = section.querySelector('.testi-author');
    if (!quote) return;

    const testimonials = [
      {
        text: `Association with MBolt has been great. They dive into the problem and <em>do not hesitate in giving suggestions.</em> They come up with fresh ideas and have always surpassed expectations.`,
        name: 'Val Muleba',
        title: 'Product Manager, GlK Tampeco',
        initials: 'VM'
      },
      {
        text: `Working with Market Bolt changed how we approach field marketing entirely. <em>Their teams don't just execute — they understand the brand.</em> The results spoke for themselves.`,
        name: 'Brand Partner',
        title: 'Senior Manager, Nile Breweries',
        initials: 'NB'
      },
      {
        text: `We've worked with agencies across East Africa. <em>MBolt stands out for one reason: they deliver exactly what they promise.</em> No surprises. No excuses. Just results.`,
        name: 'Campaign Director',
        title: 'TotalEnergies Uganda',
        initials: 'TE'
      }
    ];

    // Build dot navigation
    const dotsWrap = document.createElement('div');
    dotsWrap.className = 'testi-dots';
    testimonials.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'testi-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', `Testimonial ${i + 1}`);
      dot.addEventListener('click', () => showTesti(i));
      dotsWrap.appendChild(dot);
    });
    author?.after(dotsWrap);

    let current = 0;
    let timer;

    function showTesti(idx) {
      const dots = dotsWrap.querySelectorAll('.testi-dot');
      // Fade out
      quote.style.transition = 'opacity .4s';
      quote.style.opacity = '0';
      if (author) { author.style.transition = 'opacity .4s'; author.style.opacity = '0'; }
      setTimeout(() => {
        const t = testimonials[idx];
        quote.innerHTML = t.text;
        if (author) {
          author.querySelector('.testi-avatar').textContent = t.initials;
          author.querySelector('.testi-name').textContent   = t.name;
          author.querySelector('.testi-title').textContent  = t.title;
        }
        quote.style.opacity = '1';
        if (author) author.style.opacity = '1';
        dots.forEach((d, i) => d.classList.toggle('active', i === idx));
        current = idx;
      }, 420);
    }

    function autoRotate() {
      const next = (current + 1) % testimonials.length;
      showTesti(next);
    }

    function startTimer() { timer = setInterval(autoRotate, 6000); }
    function stopTimer()  { clearInterval(timer); }

    startTimer();

    // Pause on hover
    section.addEventListener('mouseenter', stopTimer);
    section.addEventListener('mouseleave', startTimer);

    // Pause when tab is hidden — prevents batched rapid-fire rotations
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopTimer(); else startTimer();
    });
  }


  /* ── CLIENT LOGO MIDSCREEN COLOUR CELEBRATION ──────────── */
  function initClientCelebration() {
    const ticker = document.querySelector('.ticker');
    if (!ticker) return;

    const MID_ZONE = 140; // px either side of viewport centre counts as "centre"
    let rafId;
    let active = false;

    let frameCount = 0;
    function checkMidscreen() {
      frameCount++;
      if (frameCount % 4 !== 0) { rafId = requestAnimationFrame(checkMidscreen); return; }
      const vpCx = window.innerWidth / 2;
      ticker.querySelectorAll('.client-pill').forEach(pill => {
        const rect = pill.getBoundingClientRect();
        const pillCx = rect.left + rect.width / 2;
        const dist = Math.abs(pillCx - vpCx);
        const inZone = dist < MID_ZONE;

        if (inZone && !pill.dataset.celebrating) {
          pill.dataset.celebrating = '1';
          // Colour in
          const img = pill.querySelector('img');
          const span = pill.querySelector('span');
          if (img) { img.style.filter = 'grayscale(0)'; img.style.opacity = '1'; img.style.transform = 'scale(1.04)'; }
          if (span) span.style.color = 'var(--ink)';
          pill.style.borderColor = 'var(--volt)';
          pill.style.boxShadow = '0 4px 20px rgba(106,184,37,.15)';
        } else if (!inZone && pill.dataset.celebrating) {
          delete pill.dataset.celebrating;
          // Revert
          const img = pill.querySelector('img');
          const span = pill.querySelector('span');
          if (img) { img.style.filter = ''; img.style.opacity = ''; img.style.transform = ''; }
          if (span) span.style.color = '';
          pill.style.borderColor = '';
          pill.style.boxShadow = '';
        }
      });
      rafId = requestAnimationFrame(checkMidscreen);
    }

    // Only run when ticker is visible
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { active = true; checkMidscreen(); }
        else { active = false; cancelAnimationFrame(rafId); }
      });
    }, { threshold: 0.1 });
    obs.observe(ticker);
  }


  /* ── SECTION NUMBER INDICATOR ──────────────────────────── */
  function initSectionNumber() {
    if (window.innerWidth < 1024) return;

    const sections = [
      { id: 'capabilities', label: '01 · Capabilities' },
      { id: 'work',     label: '02 · Work'     },
      { id: 'about',    label: '03 · About'    },
      { id: 'team',     label: '04 · Team'     },
      { id: 'contact',  label: '05 · Contact'  },
    ];

    // Build indicator
    const wrap = document.createElement('div');
    wrap.className = 'section-num-indicator';
    wrap.innerHTML = '<div class="section-num-line"></div><div class="section-num-text"></div><div class="section-num-line"></div>';
    document.body.appendChild(wrap);
    const text = wrap.querySelector('.section-num-text');

    // Observe sections
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const match = sections.find(s => s.id === e.target.id);
        if (match) {
          text.textContent = match.label;
          text.classList.add('active');
          setTimeout(() => text.classList.remove('active'), 1200);
        }
      });
    }, { threshold: 0.4 });

    sections.forEach(s => {
      const el = document.getElementById(s.id);
      if (el) obs.observe(el);
    });
  }


  /* ── GALLERY STRIP — homepage taster ───────────────────── */
  function initGalleryStrip() {
    const strip = document.querySelector('.gallery-strip');
    if (!strip) return;

    const items = strip.querySelectorAll('.gallery-strip-item');
    const progress = strip.querySelector('.gallery-progress');
    if (!items.length) return;

    let current = 0;
    let timer;
    const DURATION = 5000;

    function show(idx) {
      items.forEach((item, i) => item.classList.toggle('active', i === idx));
      // Progress bar
      if (progress) {
        progress.classList.remove('animating');
        progress.style.width = '0';
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            progress.classList.add('animating');
          });
        });
      }
    }

    function next() {
      current = (current + 1) % items.length;
      show(current);
    }

    function startAuto() {
      clearInterval(timer);
      timer = setInterval(next, DURATION);
    }

    show(0);
    startAuto();

    // Click any strip item opens gallery page at that index
    items.forEach((item, i) => {
      item.addEventListener('click', () => {
        window.location.href = `gallery.html?item=${i}`;
      });
      item.style.cursor = 'pointer';
    });

    // Pause on hover
    strip.addEventListener('mouseenter', () => clearInterval(timer));
    strip.addEventListener('mouseleave', startAuto);

    // Pause when tab hidden
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) clearInterval(timer); else startAuto();
    });
  }

  /* ── GALLERY LIGHTBOX ───────────────────────────────────── */
  function initGallery() {
    const grid = document.querySelector('.gallery-grid');
    if (!grid) return;

    const items = Array.from(grid.querySelectorAll('.gallery-item'));
    if (!items.length) return;

    // Observe items for entrance animation
    const obsGallery = new IntersectionObserver((ents, obs) => {
      ents.forEach((e, i) => {
        if (e.isIntersecting) {
          setTimeout(() => e.target.classList.add('visible'), (items.indexOf(e.target) % 3) * 80);
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.1 });
    items.forEach(item => obsGallery.observe(item));

    // Build lightbox — arrows appended to BODY directly
    // This is critical: fixed children of pointer-events:none parents
    // don't receive events on iOS Safari. Body-level elements are safe.
    const overlay = document.createElement('div');
    overlay.className = 'lightbox-overlay';

    const lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.innerHTML = `
      <div class="lightbox-counter" id="lb-counter"></div>
      <div class="lightbox-img-wrap">
        <img src="" alt="" id="lb-img">
        <div class="lightbox-caption-wrap" id="lb-caption-wrap">
          <div class="lightbox-caption-line"></div>
          <div class="lightbox-caption" id="lb-caption"></div>
        </div>
      </div>
    `;

    // Arrows and close button appended directly to body — never inside lb
    const lbClose = document.createElement('button');
    lbClose.className = 'lightbox-close';
    lbClose.setAttribute('aria-label', 'Close');
    lbClose.innerHTML = `<svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

    const lbPrev = document.createElement('button');
    lbPrev.className = 'lightbox-prev';
    lbPrev.setAttribute('aria-label', 'Previous');
    lbPrev.innerHTML = `<svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

    const lbNext = document.createElement('button');
    lbNext.className = 'lightbox-next';
    lbNext.setAttribute('aria-label', 'Next');
    lbNext.innerHTML = `<svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

    document.body.appendChild(overlay);
    document.body.appendChild(lb);
    document.body.appendChild(lbClose);
    document.body.appendChild(lbPrev);
    document.body.appendChild(lbNext);

    // Show/hide all lightbox UI together
    function setLbUiVisible(v) {
      [lbClose, lbCounter, lbPrev, lbNext].forEach(el => {
        el.style.opacity = v ? '1' : '0';
        el.style.pointerEvents = v ? 'all' : 'none';
      });
    }
    setLbUiVisible(false); // hidden until lightbox opens

    const lbImg        = lb.querySelector('#lb-img');
    const lbCaption    = lb.querySelector('#lb-caption');
    const lbCaptionWrap = lb.querySelector('#lb-caption-wrap');
    const lbCounter    = lb.querySelector('#lb-counter');
    let lbCurrent = 0;

    // Get only image items (not video)
    const imageItems = items.filter(item => item.querySelector('img'));

    function openLb(idx) {
      lbCurrent = idx;
      const item = imageItems[idx];
      const img  = item.querySelector('img');
      const cap  = item.querySelector('.gallery-item-label');
      lbImg.src = img.src;
      lbImg.alt = img.alt || '';
      lbCaption.textContent = cap ? cap.textContent : '';
      if (lbCaptionWrap) lbCaptionWrap.style.display = cap ? '' : 'none';
      lbCounter.textContent = `${idx + 1} / ${imageItems.length}`;
      overlay.classList.add('open');
      lb.classList.add('open');
      setLbUiVisible(true);
      lockBody();
    }
    function closeLb() {
      overlay.classList.remove('open');
      lb.classList.remove('open');
      lbClose.classList.remove('lb-visible');
      lbPrev.classList.remove('lb-visible');
      lbNext.classList.remove('lb-visible');
      unlockBody();
    }
    function prevLb() { openLb((lbCurrent - 1 + imageItems.length) % imageItems.length); }
    function nextLb() { openLb((lbCurrent + 1) % imageItems.length); }

    // Only close when clicking directly on overlay — not on children
    overlay.addEventListener('click', e => {
      if (e.target === overlay) closeLb();
    });
    lbClose.addEventListener('click', e => { e.stopPropagation(); closeLb(); });
    lbPrev.addEventListener('click',  e => { e.stopPropagation(); prevLb(); });
    lbNext.addEventListener('click',  e => { e.stopPropagation(); nextLb(); });

    document.addEventListener('keydown', e => {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape')     closeLb();
      if (e.key === 'ArrowLeft')  prevLb();
      if (e.key === 'ArrowRight') nextLb();
    });

    // Touch swipe
    let touchStartX = 0;
    lb.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend',   e => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 50) { dx < 0 ? nextLb() : prevLb(); }
    });

    // Wire up image items
    imageItems.forEach((item, i) => {
      item.addEventListener('click', () => openLb(i));
    });

    // Filter buttons
    const filterBtns = document.querySelectorAll('.gallery-filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.dataset.filter;
        items.forEach(item => {
          const type = item.dataset.type || 'photo';
          const show = filter === 'all' || type === filter;
          item.style.display = show ? '' : 'none';
        });
      });
    });

    // Handle ?item= param from homepage strip
    const params = new URLSearchParams(window.location.search);
    const startItem = parseInt(params.get('item') || '0', 10);
    if (startItem > 0 && startItem < imageItems.length) {
      setTimeout(() => openLb(startItem), 600);
    }
  }


  /* ── PAGE TRANSITIONS ───────────────────────────────────── */
  function initPageTransitions() {
    // Skip if View Transitions API is available (CSS handles it natively)
    const hasVT = !!document.startViewTransition;

    function navigateTo(href) {
      if (hasVT) {
        document.startViewTransition(() => {
          window.location.href = href;
        });
      } else {
        // JS fallback: fade out, then navigate
        document.body.classList.add('page-leaving');
        setTimeout(() => { window.location.href = href; }, 230);
      }
    }

    // Intercept all internal page-to-page links (not anchors, not same page)
    document.querySelectorAll('a[href]').forEach(a => {
      const href = a.getAttribute('href');
      // Only intercept: relative html links between pages (not anchors, not external)
      if (!href) return;
      if (href.startsWith('#')) return;           // same-page anchor
      if (href.startsWith('http')) return;        // external
      if (href.startsWith('tel:')) return;        // phone
      if (href.startsWith('mailto:')) return;     // email
      if (href.includes('.html') && !href.includes('#')) {
        // Pure page navigation — intercept
        a.addEventListener('click', e => {
          e.preventDefault();
          navigateTo(href);
        });
      } else if (href.includes('.html') && href.includes('#')) {
        // Page + anchor — navigate with hash, browser handles scroll
        a.addEventListener('click', e => {
          e.preventDefault();
          navigateTo(href);
        });
      }
    });

    // Fade in on arrival
    if (!hasVT) {
      document.body.classList.add('page-entering');
    }
  }

  /* ── INIT ───────────────────────────────────────────────── */
  // Page load fade — add class before DOMContentLoaded fires
  document.body.classList.add('page-loading');

  document.addEventListener('DOMContentLoaded', async () => {
    // Remove page-loading after fade completes so theme toggle doesn't retrigger it
    setTimeout(() => document.body.classList.remove('page-loading'), 450);
    initTheme();
    initCookies();
    initHeroRotation(); // runs immediately, no GSAP needed
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
    initWorkModal();
    initModals();
    initFloatingCta();
    initAnchors();
    initForms();
    initA11y();
    initLegalTabs();
    initFooterEntrance();
    initProofMagnetic();
    initClientCelebration();
    initSectionNumber();
    initFooterServiceLinks();
    initTestiRotation();
    initPageTransitions();
    initGalleryStrip();
    initGallery();

    document.fonts?.ready.then(() => {
      if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
    });
    window.addEventListener('resize', () => {
      if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
    });
  });

})();
