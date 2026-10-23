
(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer  = window.matchMedia('(pointer: fine)').matches;
  const THEME_KEY = 'techvision-theme';

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const el = (tag, className) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    return node;
  };

 
  const safe = (name, fn) => {
    try {
      fn();
    } catch (err) {
      console.warn(`[TechVision/fx] ${name} failed:`, err);
    }
  };


  function initTheme() {
    const root = document.documentElement;
    const navList = $('.navbar-nav');
    const current = () => (root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');

    // head-এর script কাজ না করলে এখানে সেট হবে
    if (!root.getAttribute('data-theme')) {
      let saved = null;
      try { saved = localStorage.getItem(THEME_KEY); } catch (e) {}
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.setAttribute('data-theme', saved || (prefersDark ? 'dark' : 'light'));
    }

    if (!navList) return;

    const li = el('li', 'nav-item ms-lg-3');
    const btn = el('button', 'theme-toggle');
    btn.type = 'button';

    const sync = () => {
      const dark = current() === 'dark';
      const label = dark ? 'Switch to light mode' : 'Switch to dark mode';
      btn.innerHTML = `<i class="fas ${dark ? 'fa-sun' : 'fa-moon'}" aria-hidden="true"></i>`;
      btn.setAttribute('aria-label', label);
      btn.title = label;
    };

    btn.addEventListener('click', () => {
      const next = current() === 'dark' ? 'light' : 'dark';

      const apply = () => {
        root.setAttribute('data-theme', next);
        try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
        sync();
      };

      if (document.startViewTransition && !reduceMotion) {
        document.startViewTransition(apply);
      } else {
        apply();
      }
    });

    li.appendChild(btn);
    navList.appendChild(li);
    sync();
  }

  const SCRAMBLE_CHARS = '!<>-_\\/[]{}=+*^?#ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  function scrambleText(node) {
    const finalText = node.textContent;
    node.setAttribute('aria-label', finalText);

    const steps = 18;
    let step = 0;

    const tick = () => {
      step++;
      const progress = step / steps;

      node.textContent = finalText
        .split('')
        .map((ch, i) => {
          if (ch === ' ' || i / finalText.length < progress) return ch;
          return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
        })
        .join('');

      if (step < steps) setTimeout(tick, 40);
      else node.textContent = finalText;
    };

    tick();
  }

  function initScramble() {
    if (reduceMotion || !('IntersectionObserver' in window)) return;

    const io = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        scrambleText(entry.target);
      });
    }, { threshold: 0.6 });

    $$('.section-header h2').forEach(h => io.observe(h));
  }

  function initCursor() {
    if (reduceMotion || !finePointer) return;

    document.documentElement.classList.add('has-custom-cursor');

    const dot  = el('div', 'cursor-dot');
    const ring = el('div', 'cursor-ring');
    dot.setAttribute('aria-hidden', 'true');
    ring.setAttribute('aria-hidden', 'true');
    document.body.append(dot, ring);

    let mx = 0, my = 0, rx = 0, ry = 0;

    window.addEventListener('pointermove', e => {
      mx = e.clientX;
      my = e.clientY;
      dot.style.opacity = '1';
      ring.style.opacity = '1';
    }, { passive: true });

    const loop = () => {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      dot.style.transform  = `translate3d(${mx}px, ${my}px, 0) translate(-50%, -50%)`;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`;
      requestAnimationFrame(loop);
    };
    loop();

    const hoverSel = 'a, button, .service-card, .team-card, .resource-card, .feature-card';

    document.addEventListener('pointerover', e => {
      if (e.target.closest?.(hoverSel)) ring.classList.add('is-hover');
    });

    document.addEventListener('pointerout', e => {
      if (e.target.closest?.(hoverSel) && !e.relatedTarget?.closest?.(hoverSel)) {
        ring.classList.remove('is-hover');
      }
    });
  }

  function initHeroGlow() {
    const hero = $('.hero');
    if (!hero || reduceMotion || !finePointer) return;

    const glow = el('div', 'hero-glow');
    glow.setAttribute('aria-hidden', 'true');
    hero.appendChild(glow);

    let tx = 0, ty = 0, x = 0, y = 0;

    hero.addEventListener('pointermove', e => {
      const r = hero.getBoundingClientRect();
      tx = e.clientX - r.left;
      ty = e.clientY - r.top;
    }, { passive: true });

    const loop = () => {
      x += (tx - x) * 0.08;
      y += (ty - y) * 0.08;
      glow.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      requestAnimationFrame(loop);
    };
    loop();
  }

  function initTilt() {
    if (reduceMotion || !finePointer) return;

    $$('.team-card, .service-card').forEach(card => {
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;   // -0.5 থেকে 0.5
        const py = (e.clientY - r.top) / r.height - 0.5;

        card.style.transform =
          `perspective(900px) translateY(-6px) rotateX(${(-py * 6).toFixed(2)}deg) rotateY(${(px * 8).toFixed(2)}deg)`;
      });

      card.addEventListener('pointerleave', () => {
        card.style.transform = '';
      });
    });
  }


  function initMarquee() {
    const hero = $('.hero');
    if (!hero) return;

    const names = [...new Set($$('#services .service-card h4').map(h => h.textContent.trim()))];
    if (!names.length) return;

    const band = el('div', 'marquee');
    band.setAttribute('aria-hidden', 'true');

    const track = el('div', 'marquee-track');

    const makeGroup = () => {
      const group = el('div', 'marquee-group');
      names.forEach(name => {
        const span = el('span');
        span.textContent = name;
        const dot = el('i', 'fas fa-circle marquee-dot');
        group.append(span, dot);
      });
      return group;
    };

    track.append(makeGroup(), makeGroup());
    band.appendChild(track);
    hero.after(band);
  }


  function initImageReveal() {
    if (reduceMotion || !('IntersectionObserver' in window)) return;

    const images = $$('.about-image, .founder-image img');
    images.forEach(img => img.classList.add('clip-reveal'));

    const io = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-clipped-in');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.2 });

    images.forEach(img => io.observe(img));
  }

  const boot = () => {
    safe('theme',        initTheme);
    safe('scramble',     initScramble);
    safe('cursor',       initCursor);
    safe('hero-glow',    initHeroGlow);
    safe('tilt',         initTilt);
    safe('marquee',      initMarquee);
    safe('image-reveal', initImageReveal);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();