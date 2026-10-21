/* Shared page behaviour for every store page: smooth scroll, header color,
   reveal-on-scroll, magnetic buttons and the footer year. */
const Site = (() => {
  const $ = s => document.querySelector(s);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer: fine)').matches;

  /* ---------- Smooth scroll (Lenis, if it loaded) ---------- */
  let lenis = null;
  if (window.Lenis && !reduced) {
    lenis = new Lenis({ duration: 1.15, easing: t => 1 - Math.pow(1 - t, 4), smoothWheel: true });
    const raf = time => { lenis.raf(time); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);

    // in-page anchor links glide instead of jumping
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const target = a.getAttribute('href') === '#top' ? 0 : document.querySelector(a.getAttribute('href'));
      if (target === null) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: target === 0 ? 0 : -70 });
    });

    // pause smooth scrolling while a modal or the bag is open
    new MutationObserver(() => {
      document.body.classList.contains('lock') ? lenis.stop() : lenis.start();
    }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  }

  function scrollTo(target) {
    if (lenis) lenis.scrollTo(target, { offset: -70 });
    else target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  }

  /* ---------- Header: light or dark depending on what's under it ---------- */
  const header = $('.nav');
  const onScroll = () => {
    header.classList.toggle('scrolled', scrollY > 20);
    const under = document.elementFromPoint(innerWidth / 2, header.offsetHeight + 2);
    header.classList.toggle('on-dark', !!under?.closest('.dark'));
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Reveal on scroll ---------- */
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: 0.15, rootMargin: '0px 0px -5% 0px' });
  const observeReveals = (root = document) => root.querySelectorAll('.reveal:not(.in)').forEach(el => io.observe(el));
  observeReveals();

  /* ---------- Magnetic buttons ---------- */
  if (finePointer && !reduced) {
    document.addEventListener('pointermove', e => {
      const b = e.target.closest('.btn');
      if (!b) return;
      const r = b.getBoundingClientRect();
      b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.22}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`;
    });
    document.addEventListener('pointerout', e => {
      const b = e.target.closest('.btn');
      if (b && !b.contains(e.relatedTarget)) b.style.transform = '';
    });
  }

  /* ---------- Account link (only when accounts are set up) ---------- */
  const account = $('#account-link');
  if (account && (typeof Backend !== 'undefined' && Backend.enabled)) {
    const update = user => { account.textContent = user ? 'Account' : 'Sign in'; };
    account.hidden = false;
    Backend.ready.then(update);
    Backend.onAuth(update);
  }

  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  return { lenis, scrollTo, observeReveals, refreshHeader: onScroll };
})();

// Link to a product's own page
const productURL = p => `product.html?id=${encodeURIComponent(p.id)}`;
