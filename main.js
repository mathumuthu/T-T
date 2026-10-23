/* STACKLY shared UI behavior */
(function () {
  'use strict';

  function $(selector, scope) {
    return (scope || document).querySelector(selector);
  }

  function $$(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  /* Toast notifications */
  window.showToast = function showToast(message, type) {
    const container = $('#toast-container');
    if (!container || !message) return;

    const toastType = ['success', 'error', 'warning'].includes(type) ? type : 'success';
    const toast = document.createElement('div');
    toast.className = 'toast ' + toastType;
    toast.setAttribute('role', 'status');

    const text = document.createElement('span');
    text.textContent = message;

    const close = document.createElement('button');
    close.type = 'button';
    close.setAttribute('aria-label', 'Dismiss notification');
    close.textContent = '×';
    close.addEventListener('click', function () {
      toast.remove();
    });

    toast.appendChild(text);
    toast.appendChild(close);
    container.appendChild(toast);

    window.setTimeout(function () {
      if (toast.parentNode) toast.remove();
    }, 4200);
  };

  /* Page loader */
  function hidePageLoader() {
    const loader = $('#page-loader');
    if (loader) loader.classList.add('loader-hidden');
  }

  window.addEventListener('load', function () {
    window.setTimeout(hidePageLoader, 180);
  });
  window.setTimeout(hidePageLoader, 1400);

  /* Mobile navigation */
  function initMobileNavigation() {
    const hamburger = $('.nav-hamburger');
    const menu = $('.mobile-menu');
    if (!hamburger || !menu) return;

    hamburger.addEventListener('click', function () {
      const isOpen = menu.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', String(isOpen));
      document.body.classList.toggle('nav-open', isOpen);
    });

    $$('a', menu).forEach(function (link) {
      link.addEventListener('click', function () {
        menu.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('nav-open');
      });
    });
  }

  /* Reveal-on-scroll animation */
  function initAnimations() {
    const elements = $$('[data-anim]');
    if (!elements.length) return;

    document.documentElement.classList.add('js-enabled');

    elements.forEach(function (element) {
      const delay = parseInt(element.getAttribute('data-delay') || '0', 10);
      element.style.setProperty('--anim-delay', delay + 'ms');
    });

    if (!('IntersectionObserver' in window)) {
      elements.forEach(function (element) { element.classList.add('in-view'); });
      return;
    }

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });

    elements.forEach(function (element) { observer.observe(element); });
  }

  /* Hero carousel */
  function initHeroCarousel() {
    const hero = $('.hero');
    if (!hero) return;

    const slides = $$('.hero-slide', hero);
    const dots = $$('.hero-dot', hero);
    if (!slides.length || !dots.length) return;

    let activeIndex = Math.max(0, slides.findIndex(function (slide) { return slide.classList.contains('active'); }));
    let timer = null;

    function setSlide(index) {
      activeIndex = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('active', slideIndex === activeIndex);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('active', dotIndex === activeIndex);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () { setSlide(activeIndex + 1); }, 5200);
    }

    function stop() {
      if (timer) window.clearInterval(timer);
      timer = null;
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener('click', function () {
        setSlide(index);
        start();
      });
    });

    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    setSlide(activeIndex);
    start();
  }

  /* Why-section progress */
  function initWhySection() {
    const section = $('.why-section');
    const cards = $$('.why-card');
    const dots = $$('.why-progress-dot');
    if (!section || !cards.length || !dots.length) return;

    let activeIndex = 0;

    function setActive(index) {
      activeIndex = clamp(index, 0, cards.length - 1);
      cards.forEach(function (card, cardIndex) {
        card.classList.toggle('active', cardIndex === activeIndex);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('active', dotIndex === activeIndex);
      });
    }

    function updateFromScroll() {
      const rect = section.getBoundingClientRect();
      const scrollable = Math.max(rect.height - window.innerHeight, 1);
      const progress = clamp(-rect.top / scrollable, 0, 0.999);
      setActive(Math.floor(progress * cards.length));
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener('click', function () {
        const top = window.pageYOffset + cards[index].getBoundingClientRect().top - 90;
        window.scrollTo({ top: top, behavior: 'smooth' });
        setActive(index);
      });
    });

    window.addEventListener('scroll', updateFromScroll, { passive: true });
    window.addEventListener('resize', updateFromScroll);
    updateFromScroll();
    setActive(0);
  }

  /* Dashboard sidebar accessibility helpers */
  function initDashboardSidebar() {
    const sidebar = $('#sidebar');
    if (!sidebar) return;

    const openButton = $('#openSidebar');
    const closeButton = $('#closeSidebar');

    function openSidebar() { sidebar.classList.add('open'); }
    function closeSidebar() { sidebar.classList.remove('open'); }

    if (openButton) openButton.addEventListener('click', openSidebar);
    if (closeButton) closeButton.addEventListener('click', closeSidebar);

    $$('.sidebar-link', sidebar).forEach(function (link) {
      link.addEventListener('click', function () {
        if (window.innerWidth < 992) closeSidebar();
      });
    });

    document.addEventListener('click', function (event) {
      if (window.innerWidth >= 992 || !sidebar.classList.contains('open')) return;
      if (sidebar.contains(event.target) || (openButton && openButton.contains(event.target))) return;
      closeSidebar();
    });
  }

  /* Animated counters used by About page */
  window.animateCounters = function animateCounters() {
    $$('[data-count]').forEach(function (element) {
      const target = String(element.getAttribute('data-count') || '').trim();
      if (!target || target === '24/7' || element.dataset.counted === 'true') {
        if (target === '24/7') element.textContent = target;
        return;
      }

      element.dataset.counted = 'true';
      const match = target.match(/^(\d+(?:\.\d+)?)(.*)$/);
      if (!match) {
        element.textContent = target;
        return;
      }

      const finalValue = parseFloat(match[1]);
      const suffix = match[2] || '';
      const duration = 1200;
      const start = performance.now();

      function frame(now) {
        const progress = clamp((now - start) / duration, 0, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = finalValue * eased;
        element.textContent = (Number.isInteger(finalValue) ? Math.round(value) : value.toFixed(1)) + suffix;
        if (progress < 1) requestAnimationFrame(frame);
        else element.textContent = target;
      }

      requestAnimationFrame(frame);
    });
  };

  function initDashboardStatsObserver() {
    const statsGrid = $('#statsGrid');
    if (!statsGrid || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          window.animateCounters();
          observer.disconnect();
        }
      });
    }, { threshold: 0.2 });
    observer.observe(statsGrid);
  }

  function init() {
    initMobileNavigation();
    initAnimations();
    initHeroCarousel();
    initWhySection();
    initDashboardSidebar();
    initDashboardStatsObserver();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();