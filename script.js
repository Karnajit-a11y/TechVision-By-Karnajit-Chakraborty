

(() => {
  'use strict';
  const CONFIG = {
    formEndpoint: '',
    preloaderMaxMs: 2500,
  };

  /* ---------- Helpers ---------- */
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer  = window.matchMedia('(pointer: fine)').matches;
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

 
  const safe = (name, fn) => {
    try {
      fn();
      return true;
    } catch (err) {
      console.warn(`[TechVision] ${name} failed:`, err);
      return false;
    }
  };


  function initPreloader() {
    const loader = document.createElement('div');
    loader.className = 'site-loader';
    loader.setAttribute('role', 'status');
    loader.setAttribute('aria-label', 'Loading website');
    loader.innerHTML = `
      <div class="site-loader-inner">
        <div class="site-loader-logo">TV</div>
        <div class="site-loader-bar"><span></span></div>
        <div class="site-loader-percent">0%</div>
      </div>`;
    document.body.prepend(loader);
    document.body.classList.add('is-loading');

    const bar   = $('.site-loader-bar span', loader);
    const label = $('.site-loader-percent', loader);
    let value = 0;
    let timer = null;
    let finished = false;

    const render = () => {
      const v = Math.round(value);
      bar.style.transform = `scaleX(${v / 100})`;
      label.textContent = `${v}%`;
    };

    const finish = () => {
      if (finished) return;
      finished = true;
      clearInterval(timer);
      value = 100;
      render();

      setTimeout(() => {
        loader.classList.add('is-done');
        document.body.classList.remove('is-loading');
        document.body.classList.add('is-ready');   // hero animation শুরু
        setTimeout(() => loader.remove(), reduceMotion ? 0 : 900);
      }, reduceMotion ? 0 : 350);
    };

   
    setTimeout(finish, CONFIG.preloaderMaxMs);

    if (reduceMotion) {
      finish();
      return;
    }

    timer = setInterval(() => {
      if (value < 90) value = Math.min(90, value + 3 + Math.random() * 7);
      render();
    }, 90);

    if (document.readyState === 'complete') finish();
    else window.addEventListener('load', finish, { once: true });
  }


  function initHero() {
    const hero = $('.hero');
    if (!hero) return;

    const h1 = $('h1', hero);
    if (h1) {
      const text = h1.textContent.trim();
      h1.setAttribute('aria-label', text);
      h1.textContent = '';

      const words = text.split(/\s+/);
      words.forEach((word, i) => {
        const outer = document.createElement('span');
        outer.className = 'word';
        outer.setAttribute('aria-hidden', 'true');

        const inner = document.createElement('span');
        inner.textContent = word;
        inner.style.setProperty('--i', i);

        outer.appendChild(inner);
        h1.appendChild(outer);
        if (i < words.length - 1) h1.appendChild(document.createTextNode(' '));
      });
    }

    [$('p', hero), $('.hero-buttons', hero)].forEach((el, i) => {
      if (!el) return;
      el.classList.add('hero-anim');
      el.style.setProperty('--d', i + 2);
    });
  }


  function initNavigation() {
    const menu  = document.getElementById('navbarNav');
    const links = $$('.navbar-nav .nav-link[href^="#"]');

  
    links.forEach(link => {
      link.addEventListener('click', () => {
        if (menu?.classList.contains('show') && window.bootstrap) {
          bootstrap.Collapse.getOrCreateInstance(menu).hide();
        }
      });
    });

    if (!('IntersectionObserver' in window)) return;

    const linkById = new Map(links.map(l => [l.getAttribute('href').slice(1), l]));
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        links.forEach(l => l.classList.remove('active'));
        linkById.get(entry.target.id)?.classList.add('active');
      });
    }, { rootMargin: '-40% 0px -55% 0px' });

    linkById.forEach((_, id) => {
      const section = document.getElementById(id);
      if (section) io.observe(section);
    });
  }

  function initScrollEffects() {
    const navbar = $('.navbar');
    const hero   = $('.hero');

    // Scroll progress bar
    const progress = document.createElement('div');
    progress.className = 'scroll-progress';
    progress.setAttribute('aria-hidden', 'true');

    // Back to top button
    const toTop = document.createElement('button');
    toTop.type = 'button';
    toTop.className = 'back-to-top';
    toTop.setAttribute('aria-label', 'Back to top');
    toTop.innerHTML = '<i class="fas fa-arrow-up" aria-hidden="true"></i>';
    toTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });

    document.body.append(progress, toTop);

    let ticking = false;
    const update = () => {
      const y   = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;

      progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
      navbar?.classList.toggle('is-scrolled', y > 40);
      toTop.classList.toggle('is-visible', y > 600);

      if (hero && !reduceMotion && y < hero.offsetHeight) {
        hero.style.backgroundPosition = `center calc(50% + ${(y * 0.3).toFixed(1)}px)`;
      }
      ticking = false;
    };

    const requestUpdate = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    update();
  }


  function initReveal() {
  
    if (reduceMotion || !('IntersectionObserver' in window)) return;

    const selector = [
      '.section-header', '.about-text', '.about-image-wrapper', '.founder-section',
      '.service-card', '.feature-card', '.stat-item', '.team-card',
      '.resource-card', '.testimonial-card', '.accordion-item',
      '.contact-wrapper', '.contact-item'
    ].join(',');

    const io = new IntersectionObserver((entries, observer) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (!isIntersecting) return;

        observer.unobserve(target);
        target.classList.add('is-visible');


        const cleanup = () => {
          target.classList.remove('reveal', 'is-visible');
          target.style.removeProperty('--reveal-delay');
        };
        target.addEventListener('transitionend', e => {
          if (e.target === target && e.propertyName === 'opacity') cleanup();
        }, { once: true });
        setTimeout(cleanup, 1600);   // fallback
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    $$(selector).forEach((el, i) => {
      el.classList.add('reveal');
      el.style.setProperty('--reveal-delay', `${(i % 4) * 100}ms`);
      io.observe(el);
    });
  }


  function initCounters() {
    if (reduceMotion || !('IntersectionObserver' in window)) return;

    const counters = $$('.stat-number')
      .map(el => {
        const match = el.textContent.trim().match(/^(\d+)(.*)$/);
        return match ? { el, end: Number(match[1]), suffix: match[2] } : null;
      })
      .filter(Boolean);

    if (!counters.length) return;

  
    counters.forEach(c => { c.el.textContent = `0${c.suffix}`; });

    const run = ({ el, end, suffix }) => {
      const duration = 1600;
      const start = performance.now();
      const frame = now => {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);   // easeOutCubic
        el.textContent = `${Math.round(end * eased)}${suffix}`;
        if (p < 1) requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    };

    const io = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const counter = counters.find(c => c.el === entry.target);
        if (counter) run(counter);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.5 });

    counters.forEach(c => io.observe(c.el));
  }


  function initPointerEffects() {
    if (reduceMotion || !finePointer) return;

    $$('.btn-primary-custom, .btn-secondary-custom').forEach(btn => {
      btn.addEventListener('pointermove', e => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.2;
        const y = (e.clientY - r.top - r.height / 2) * 0.25;
        btn.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      });
      btn.addEventListener('pointerleave', () => {
        btn.style.transform = '';
      });
    });

    $$('.service-card, .feature-card, .resource-card, .testimonial-card').forEach(card => {
      card.classList.add('spotlight');
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - r.left}px`);
        card.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    });
  }


  function initImages() {
    $$('img').forEach(img => {
      // Above-the-fold image বাদে সব lazy
      const aboveFold = img.closest('.hero, .about');
      if (!aboveFold && !img.hasAttribute('loading')) img.loading = 'lazy';
      img.decoding = 'async';

      const markBroken = () => img.classList.add('is-broken');
      img.addEventListener('error', markBroken, { once: true });

   
      if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) {
        markBroken();
      }
    });
  }


  function initContactForm() {
    const form = $('.contact-form form');
    if (!form) return;

    form.noValidate = true;   

    const fields = {
      name:    $('#name', form),
      email:   $('#email', form),
      message: $('#message', form),
    };


    Object.entries(fields).forEach(([key, field]) => {
      if (field && !field.name) field.name = key;
    });

    const rules = {
      name:    v => (v.trim().length >= 2 ? '' : 'Please enter your name (at least 2 characters).'),
      email:   v => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Please enter a valid email address.'),
      message: v => (v.trim().length >= 10 ? '' : 'Message should be at least 10 characters.'),
    };

    // Status message box
    const status = document.createElement('div');
    status.className = 'form-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    form.appendChild(status);

    const showStatus = (type, text) => {
      status.className = `form-status is-${type}`;
      status.textContent = text;
    };

    const setFieldError = (field, message) => {
      const errorId = `${field.id}-error`;
      let error = document.getElementById(errorId);

      if (!error) {
        error = document.createElement('div');
        error.id = errorId;
        error.className = 'invalid-feedback';
        field.insertAdjacentElement('afterend', error);
      }

      error.textContent = message;
      field.classList.toggle('is-invalid', Boolean(message));
      field.setAttribute('aria-invalid', String(Boolean(message)));

      if (message) field.setAttribute('aria-describedby', errorId);
      else field.removeAttribute('aria-describedby');
    };

    const validateField = key => {
      const field = fields[key];
      if (!field) return true;
      const message = rules[key](field.value);
      setFieldError(field, message);
      return !message;
    };

 
    Object.keys(fields).forEach(key => {
      fields[key]?.addEventListener('blur', () => validateField(key));
    });

    form.addEventListener('submit', async e => {
      e.preventDefault();
      status.className = 'form-status';
      status.textContent = '';

      let firstInvalid = null;
      Object.keys(fields).forEach(key => {
        const valid = validateField(key);
        if (!valid && !firstInvalid) firstInvalid = fields[key];
      });

      if (firstInvalid) {
        firstInvalid.focus();
        showStatus('error', 'Please correct the highlighted fields.');
        return;
      }

    
      if (!CONFIG.formEndpoint) {
        showStatus('info', 'Form submission is not connected yet. Please reach us using the phone or email details on this page.');
        return;
      }

      const submitBtn = $('button[type="submit"]', form);
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';

      try {
        const res = await fetch(CONFIG.formEndpoint, {
          method: 'POST',
          headers: { Accept: 'application/json' },
          body: new FormData(form),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        form.reset();
        showStatus('success', 'Thank you! Your message has been sent. We will get back to you within 24 hours.');
      } catch (err) {
        console.warn('[TechVision] form submit failed:', err);
        showStatus('error', 'Something went wrong. Please try again or contact us directly.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }

 
  const boot = () => {
    document.documentElement.classList.add('js-enabled');

    const loaderOk = safe('preloader', initPreloader);
    safe('hero',         initHero);
    safe('navigation',   initNavigation);
    safe('scroll',       initScrollEffects);
    safe('reveal',       initReveal);
    safe('counters',     initCounters);
    safe('pointer',      initPointerEffects);
    safe('images',       initImages);
    safe('contact-form', initContactForm);

  
    if (!loaderOk) document.body.classList.add('is-ready');
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();


