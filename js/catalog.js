/* Built-in product catalog. The admin page (admin.html) can export a
   replacement for this file to make its changes permanent.
   type:     'shoe' (uses image if set, otherwise drawn from colors) or 'tee' (uses color + layout from layouts.js)
   tag:      badge on the card ('New', 'Best seller', 'Limited', 'Sale'), optional
   featured: true puts the product in the scroll showcase at the top of the page
             (one shoe and one tee; if none is marked, the first of each type is used)
   image:    photo path or data URL (transparent cut-out), optional
   details:  bullet points for the product page, optional */
const DEFAULT_PRODUCTS = [
  {
    id: 'aero-runner', type: 'shoe', name: 'Aero Runner', price: 139, tag: 'Best seller', featured: true,
    image: 'images/red-runner.png',
    colors: { upper: '#e8402a', accent: '#1d1d1f', sole: '#f59e0b', lace: '#e8402a' },
    desc: 'Our everyday trainer, refined over four seasons of testing. A single-layer knit upper breathes on long summer miles, and the sunset-gradient foam midsole gives back energy without feeling mushy.',
    details: ['Weight 236 g (US 9)', '8 mm heel-to-toe drop', 'Engineered knit upper, 60% recycled polyester', 'Supercritical EVA midsole', 'Recycled rubber outsole with flex grooves']
  },
  {
    id: 'cloud-mesh', type: 'shoe', name: 'Cloud Mesh', price: 119, tag: 'New',
    image: 'images/grey-mesh.png',
    colors: { upper: '#b9bcbf', accent: '#2b2d31', sole: '#f5f5f5', lace: '#d4d6d8' },
    desc: 'The pair you reach for without thinking. Open-weave mesh in a soft concrete grey, a cushioned midsole for long days on your feet, and a pull tab that makes slipping them on effortless.',
    details: ['Open-weave recycled mesh upper', 'Dual-density cushioned midsole', 'Padded collar with heel pull tab', 'Removable recycled-foam insole', 'Weight 252 g (US 9)']
  },
  {
    id: 'halo-trainer', type: 'shoe', name: 'Halo Trainer', price: 149, tag: 'Limited',
    image: 'images/modern-runner.png',
    colors: { upper: '#f5f5f4', accent: '#a8a29e', sole: '#ffffff', lace: '#f5f5f4' },
    desc: 'All white, all considered. Sculpted overlays wrap the midfoot for support without stiffness, and a rocker-shaped midsole rolls you forward from heel to toe. Made in a single run.',
    details: ['Sculpted TPU overlays on breathable mesh', 'Rocker-shaped foam midsole', '6 mm heel-to-toe drop', 'Reflective heel detail', 'Limited production run']
  },
  {
    id: 'sunset-tee', type: 'tee', name: 'Golden Hour Tee', price: 34, tag: 'New', featured: true,
    color: '#f6efe4', layout: 'sunset',
    desc: 'Named for the last light on our Saturday long runs. Heavyweight organic jersey with a soft-hand print that feels like part of the fabric rather than sitting on top of it.',
    details: ['240 gsm organic cotton jersey', 'Relaxed fit, dropped shoulder', 'Water-based screen print', 'Pre-shrunk, garment washed', 'Made in Portugal']
  },
  {
    id: 'grid-tee', type: 'tee', name: 'Index Tee', price: 32,
    color: '#15171c', layout: 'grid',
    desc: 'A quiet study in order, printed tone on tone with a single point of color. Cut boxy and slightly cropped to sit right over high-waisted trousers.',
    details: ['240 gsm organic cotton jersey', 'Boxy, slightly cropped fit', 'Water-based screen print', 'Ribbed crew neck with a taped seam', 'Made in Portugal']
  },
  {
    id: 'wild-tee', type: 'tee', name: 'Stay Wild Tee', price: 32,
    color: '#2f5d50', layout: 'wild',
    desc: 'Garment dyed in small batches, so every piece is a fraction different from the next. The print fades gently with washing, the way a favorite tee should.',
    details: ['240 gsm organic cotton jersey', 'Garment dyed in small batches', 'Relaxed fit', 'Water-based discharge print', 'Made in Portugal']
  },
  {
    id: 'bloom-tee', type: 'tee', name: 'Bloom Tee', price: 34, tag: 'Best seller',
    color: '#ead0d2', layout: 'bloom',
    desc: 'A single line drawing from our studio sketchbook, printed small and centred. Washed dusty rose with a soft, broken-in hand from day one.',
    details: ['240 gsm organic cotton jersey', 'Enzyme washed for softness', 'Relaxed fit', 'Water-based screen print', 'Made in Portugal']
  }
];
