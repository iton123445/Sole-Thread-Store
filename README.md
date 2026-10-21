# Sole & Thread: demo sneaker & tee store

A portfolio e-commerce demo built with plain HTML, CSS and JavaScript: no frameworks and no build step. The only external script is [Lenis](https://github.com/darkroomengineering/lenis) for smooth scrolling, loaded from a CDN, and the site still works without it.

## Run it
Open `index.html` in a browser. To serve it locally instead, use any static server, for example:

```
npx serve .
```

## Features
- **Scroll particle showcases.** The shoe and the tee are each turned into thousands of canvas particles. As you scroll, they scatter into 3D space, rejoin, then the product turns around from front to back.
- **Shop.** Product grid with a sneaker/tee filter. Cards turn around on hover, and quick view has size, quantity and a turn-around button.
- **Product pages (`product.html?id=…`).** Each product has its own shareable page with a gallery (front, back and two close-ups; drag the image to turn it), a size guide, a details / materials / shipping accordion and related products. "Customize this tee" opens the studio with that tee loaded.
- **Custom tee studio.** Pick any shirt color, then add premade layouts, uploaded images or text to the front and back. Drag to move, use sliders to resize and rotate, or nudge with the arrow keys. Add the shirt to the bag or download a PNG mockup.
- **Admin (`admin.html`, linked in the footer).** Add, edit and delete shoes and tees, with a live front/back preview. Shoes can use a **product photo**: upload it and the background is removed in the browser (plain or fake-checkerboard backgrounds, with a strength slider). The cut-out is used in the shop and the particle hero, and the back view is the mirrored photo. Set badges (New, Best seller, Limited, Sale) and choose the **hero** product for each scroll showcase. Changes are saved in the browser. **Export catalog.js** downloads a file to replace `js/catalog.js` so the changes are permanent. This is a demo with no real login.
- **Bag & checkout.** The cart drawer is saved in `localStorage`. Checkout is a demo flow and takes no payment.

## Structure
| File | Purpose |
| --- | --- |
| `js/art.js` | SVG generators for the shoe and t-shirt (front/back) |
| `js/layouts.js` | Premade print layouts |
| `js/catalog.js` | Built-in product catalog (replace with the admin export) |
| `js/data.js` | Loads the catalog (saved admin changes first) plus shared helpers |
| `js/admin.js` | Admin page |
| `js/bg-remove.js` | In-browser background removal for product photos |
| `js/site.js` | Shared page behavior: smooth scroll, header, reveals, magnetic buttons |
| `js/product.js` | Product page |
| `js/particles.js` | Scroll-driven scatter → rejoin → flip particle engine |
| `js/shop.js` | Product grid and quick view |
| `js/customizer.js` | Custom t-shirt designer |
| `js/cart.js` | Cart drawer, checkout, toast and modal helpers |
| `js/main.js` | Home page: showcases, lookbook, intro, studio deep links |

The three built-in shoes use photo cut-outs in `images/` (credits in `images/CREDITS.md`; originals in `images/source/`). The tees and any shoe without a photo are generated as SVG in code.

**Serve the folder over http** (e.g. `npx serve .`) so the particle hero can read the photo pixels. Opened straight from `file://`, the browser blocks that and the hero falls back to a still image. Product photos uploaded in the admin are stored as compressed WebP data inside the catalog, so there are still no image files to manage.

**Product photos:** use photos you have the rights to (your own, licensed stock or AI-generated). Watermarked previews from stock sites will show their watermark.
