/* Home page: particle showcases, lookbook art, intro, and deep links
   into the custom studio (index.html?customize=<tee id>#customize) */
CatalogReady.then(() => {
  const $ = s => document.querySelector(s);

  /* ---------- Featured products → showcases + lookbook ---------- */
  // The showcases use whichever products are marked `featured` (see catalog.js / admin.html).
  // If the catalog has no product of a type, that showcase is hidden.
  const shoe = featured('shoe');
  if (shoe) {
    // photos are loaded directly (an image file referenced inside an SVG won't load when that SVG is used as an image)
    new ParticleShowcase($('#shoe-showcase'), shoe.image
      ? { front: { src: shoe.image }, back: { src: shoe.image, flip: true }, aspect: 1 }
      : { front: Art.shoe({ ...shoe.colors, side: 'front' }), back: Art.shoe({ ...shoe.colors, side: 'back' }), aspect: 260 / 400 });
    fill('shoe', shoe, 'New release');
  } else $('#shoe-showcase').hidden = true;

  const tee = featured('tee');
  if (tee) {
    const ink = Art.inkFor(tee.color);
    new ParticleShowcase($('#tee-showcase'), {
      front: Art.shirt({ color: tee.color, side: 'front', print: Layouts.place(tee.layout, 'front', ink) }),
      back: Art.shirt({ color: tee.color, side: 'back', print: Layouts.place('badge', 'back', ink, 1.05) }),
      aspect: 440 / 400
    });
    fill('tee', tee, 'The tee collection');
  } else $('#tee-showcase').hidden = true;

  function fill(type, p, fallbackTag) {
    $(`#${type}-eyebrow`).textContent = `${p.tag || fallbackTag} · ${p.name}`;
    const cta = $(`#${type}-cta`);
    cta.textContent = `Shop ${p.name} · ${money(p.price).replace('.00', '')}`;
    cta.href = productURL(p);
  }

  if (shoe) $('#lb-shoe').innerHTML = productArt(shoe, 'front');
  if (tee) $('#lb-tee').innerHTML = productArt(tee, 'front');
  $('#lb-names').textContent = [shoe, tee].filter(Boolean).map(p => p.name).join(' & ');

  /* ---------- Intro ---------- */
  const finishIntro = () => { document.body.classList.add('intro-done'); Site.refreshHeader(); };
  if (document.documentElement.classList.contains('no-intro')) finishIntro();
  else {
    Site.lenis?.stop();
    setTimeout(() => { finishIntro(); Site.lenis?.start(); }, 1500);
  }

  /* ---------- "Customize this tee" from a product page ---------- */
  const preset = new URLSearchParams(location.search).get('customize');
  const presetTee = preset && PRODUCTS.find(p => p.id === preset && p.type === 'tee');
  if (presetTee) {
    Customizer.load({ color: presetTee.color, layout: presetTee.layout });
    setTimeout(() => Site.scrollTo($('#customize')), 200);
  }
});
