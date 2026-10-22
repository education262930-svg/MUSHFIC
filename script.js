/* ==========================================================================
   Mushfick Jahan Mojahid — Personal Portfolio
   Vanilla JS: navigation, smooth scroll, reveal animations, scroll spy,
   progress indicator, back-to-top. No dependencies.
   ========================================================================== */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;

  var reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  function prefersReducedMotion() {
    return reducedMotionQuery.matches;
  }

  /* ----------------------------------------------------------------------
     Header: stuck state + reading progress
  ---------------------------------------------------------------------- */
  var header = doc.getElementById('site-header');
  var headerProgress = doc.getElementById('header-progress');
  var scrollBar = doc.getElementById('scroll-progress-bar');

  function headerOffset() {
    return (header ? header.getBoundingClientRect().height : 68) + 12;
  }

  /* ----------------------------------------------------------------------
     Mobile navigation
  ---------------------------------------------------------------------- */
  var navToggle = doc.getElementById('nav-toggle');
  var primaryNav = doc.getElementById('primary-nav');
  var navScrim = doc.getElementById('nav-scrim');

  function setNavState(open) {
    if (!primaryNav || !navToggle) return;
    primaryNav.classList.toggle('is-open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
    doc.body.classList.toggle('is-locked', open);

    if (navScrim) {
      if (open) {
        navScrim.hidden = false;
        window.requestAnimationFrame(function () { navScrim.classList.add('is-open'); });
      } else {
        navScrim.classList.remove('is-open');
        window.setTimeout(function () { navScrim.hidden = true; }, 320);
      }
    }
  }

  function isNavOpen() {
    return primaryNav && primaryNav.classList.contains('is-open');
  }

  if (navToggle && primaryNav) {
    navToggle.addEventListener('click', function (event) {
      event.stopPropagation();
      setNavState(!isNavOpen());
    });

    // Close after choosing an in-page destination.
    primaryNav.addEventListener('click', function (event) {
      var link = event.target.closest ? event.target.closest('a') : null;
      if (link) setNavState(false);
    });

    // Close when tapping the scrim.
    if (navScrim) {
      navScrim.addEventListener('click', function () {
        setNavState(false);
        navToggle.focus();
      });
    }

    doc.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && isNavOpen()) {
        setNavState(false);
        navToggle.focus();
      }
    });

    // If the viewport grows past the mobile breakpoint, reset the menu.
    window.addEventListener('resize', function () {
      if (window.innerWidth > 820 && isNavOpen()) setNavState(false);
    });
  }

  /* ----------------------------------------------------------------------
     Smooth scrolling with a fixed-header offset
  ---------------------------------------------------------------------- */
  function scrollToTarget(target) {
    var top = target.getBoundingClientRect().top + window.pageYOffset - headerOffset();
    if (top < 0) top = 0;
    try {
      window.scrollTo({ top: top, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    } catch (err) {
      window.scrollTo(0, top);
    }
  }

  doc.addEventListener('click', function (event) {
    var link = event.target.closest ? event.target.closest('a[href^="#"]') : null;
    if (!link) return;

    var href = link.getAttribute('href');
    if (!href || href === '#' || href.length < 2) return;
    if (link.target === '_blank') return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    var target = doc.querySelector(href);
    if (!target) return;

    event.preventDefault();
    scrollToTarget(target);

    // Keep keyboard users where the eye is.
    if (!target.hasAttribute('tabindex')) {
      target.setAttribute('tabindex', '-1');
    }
    target.focus({ preventScroll: true });
    if (history.replaceState) history.replaceState(null, '', href);
  });

  /* ----------------------------------------------------------------------
     Scroll-triggered reveal animations
  ---------------------------------------------------------------------- */
  var revealItems = doc.querySelectorAll('.reveal');

  function revealAll() {
    for (var i = 0; i < revealItems.length; i++) {
      revealItems[i].classList.add('is-visible');
    }
  }

  if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
    revealAll();
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });

    for (var r = 0; r < revealItems.length; r++) {
      revealObserver.observe(revealItems[r]);
    }
  }

  // If the user turns reduced motion on mid-session, show everything at once.
  var onMotionChange = function () {
    if (prefersReducedMotion()) revealAll();
  };
  if (typeof reducedMotionQuery.addEventListener === 'function') {
    reducedMotionQuery.addEventListener('change', onMotionChange);
  } else if (typeof reducedMotionQuery.addListener === 'function') {
    reducedMotionQuery.addListener(onMotionChange);
  }

  /* ----------------------------------------------------------------------
     Scroll spy + progress + back-to-top (rAF throttled)
  ---------------------------------------------------------------------- */
  var navLinks = Array.prototype.slice.call(doc.querySelectorAll('[data-nav]'));
  var sections = navLinks
    .map(function (link) {
      var id = link.getAttribute('href');
      return id && id.length > 1 ? doc.querySelector(id) : null;
    })
    .filter(Boolean);

  var toTopFab = doc.getElementById('to-top-fab');
  if (toTopFab) toTopFab.hidden = false;

  var ticking = false;

  function updateOnScroll() {
    var scrollY = window.pageYOffset || root.scrollTop;
    var docHeight = doc.documentElement.scrollHeight - window.innerHeight;
    var ratio = docHeight > 0 ? Math.min(1, Math.max(0, scrollY / docHeight)) : 0;

    if (headerProgress) headerProgress.style.width = (ratio * 100).toFixed(2) + '%';
    if (scrollBar) scrollBar.style.width = (ratio * 100).toFixed(2) + '%';
    if (header) header.classList.toggle('is-stuck', scrollY > 24);
    if (toTopFab) toTopFab.classList.toggle('is-visible', scrollY > 520);

    // Active section = the last one whose top has passed the header line.
    var line = scrollY + headerOffset() + 24;
    var activeIndex = -1;
    for (var i = 0; i < sections.length; i++) {
      var top = sections[i].getBoundingClientRect().top + scrollY;
      if (top <= line) activeIndex = i;
    }
    if (activeIndex === -1 && sections.length) activeIndex = 0;

    // Near the bottom, always highlight the last section.
    if (docHeight > 0 && ratio > 0.985) activeIndex = sections.length - 1;

    for (var j = 0; j < navLinks.length; j++) {
      navLinks[j].classList.toggle('is-active', j === activeIndex);
    }

    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(updateOnScroll);
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  updateOnScroll();

  if (toTopFab) {
    toTopFab.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
      var home = doc.getElementById('home');
      if (home) {
        if (!home.hasAttribute('tabindex')) home.setAttribute('tabindex', '-1');
        home.focus({ preventScroll: true });
      }
    });
  }

  /* ----------------------------------------------------------------------
     Subtle portrait parallax (desktop, motion allowed)
  ---------------------------------------------------------------------- */
  var portraitWrap = doc.getElementById('portrait-wrap');
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

  if (portraitWrap && finePointer.matches && !prefersReducedMotion() && 'IntersectionObserver' in window) {
    var parallaxTicking = false;
    var parallaxObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var apply = function () {
          var rect = portraitWrap.getBoundingClientRect();
          var offset = (window.innerHeight / 2) - (rect.top + rect.height / 2);
          portraitWrap.style.transform = 'translate3d(0,' + (offset * 0.045).toFixed(2) + 'px,0)';
          parallaxTicking = false;
        };
        if (!parallaxTicking) {
          window.requestAnimationFrame(apply);
          parallaxTicking = true;
        }
      });
    }, { threshold: 0 });
    parallaxObserver.observe(portraitWrap);
  }

  /* ----------------------------------------------------------------------
     Footer year
   ---------------------------------------------------------------------- */
  var yearEl = doc.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ----------------------------------------------------------------------
     Travel Memories lightbox
     Click any gallery frame to open it large. Arrow keys move through the
     set, Escape closes, and focus returns to the frame that opened it.
   ---------------------------------------------------------------------- */
  var lightbox = doc.getElementById('lightbox');
  var lbImage = doc.getElementById('lightbox-image');
  var lbCaption = doc.getElementById('lightbox-caption');
  var lbCounter = doc.getElementById('lightbox-counter');
  var lbClose = lightbox ? lightbox.querySelector('.lightbox__close') : null;
  var lbPrev = lightbox ? lightbox.querySelector('[data-lightbox-prev]') : null;
  var lbNext = lightbox ? lightbox.querySelector('[data-lightbox-next]') : null;

  var frames = Array.prototype.slice.call(doc.querySelectorAll('[data-lightbox]'));

  if (lightbox && lbImage && frames.length) {
    var currentIndex = 0;
    var opener = null;

    function frameSource(frame) {
      return frame.getAttribute('data-full') || frame.getAttribute('href') || '';
    }

    function frameAlt(frame) {
      var img = frame.querySelector('img');
      return frame.getAttribute('data-alt') || (img ? img.getAttribute('alt') : '') || '';
    }

    function render(index) {
      currentIndex = (index + frames.length) % frames.length;
      var frame = frames[currentIndex];
      var source = frameSource(frame);

      lbImage.setAttribute('src', source);
      lbImage.setAttribute('alt', frameAlt(frame));
      if (lbCaption) lbCaption.textContent = frame.getAttribute('data-caption') || '';
      if (lbCounter) lbCounter.textContent = (currentIndex + 1) + ' / ' + frames.length;
    }

    function openLightbox(index, trigger) {
      opener = trigger || null;
      render(index);
      lightbox.hidden = false;
      // Force a reflow so the fade-in transition runs from the hidden state.
      void lightbox.offsetWidth;
      lightbox.classList.add('is-open');
      doc.body.classList.add('is-locked');
      if (lbClose) lbClose.focus();
    }

    function closeLightbox() {
      lightbox.classList.remove('is-open');
      doc.body.classList.remove('is-locked');
      var finish = function () {
        lightbox.hidden = true;
        lbImage.removeAttribute('src');
      };
      window.setTimeout(finish, prefersReducedMotion() ? 0 : 320);
      if (opener && typeof opener.focus === 'function') opener.focus();
      opener = null;
    }

    for (var f = 0; f < frames.length; f++) {
      (function (frame, index) {
        frame.addEventListener('click', function (event) {
          event.preventDefault();
          openLightbox(index, frame);
        });
      })(frames[f], f);
    }

    var closers = lightbox.querySelectorAll('[data-lightbox-close]');
    for (var c = 0; c < closers.length; c++) {
      closers[c].addEventListener('click', closeLightbox);
    }
    if (lbPrev) lbPrev.addEventListener('click', function () { render(currentIndex - 1); });
    if (lbNext) lbNext.addEventListener('click', function () { render(currentIndex + 1); });

    doc.addEventListener('keydown', function (event) {
      if (lightbox.hidden || !lightbox.classList.contains('is-open')) return;

      if (event.key === 'Escape' || event.key === 'Esc') {
        event.preventDefault();
        closeLightbox();
        return;
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        render(currentIndex - 1);
        return;
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        render(currentIndex + 1);
        return;
      }

      // Keep keyboard focus inside the viewer while it is open.
      if (event.key === 'Tab') {
        var focusables = lightbox.querySelectorAll('button:not([disabled]), a[href]');
        if (!focusables.length) return;
        var first = focusables[0];
        var last = focusables[focusables.length - 1];
        if (event.shiftKey && doc.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && doc.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });
  }
})();
