# Flower Bouquet

An interactive digital flower bouquet garden built with vanilla HTML5 Canvas, CSS, and JavaScript. The page populates with blooming flowers, a GPU-accelerated ambient glowing background, and support for URL-customized greetings.

## Quick Links

- Live Site: [bouquet.745482.xyz](https://bouquet.745482.xyz)
- Custom Link Creator: [bouquet.745482.xyz/create](https://bouquet.745482.xyz/create)
- Live Preset Demo: [bouquet.745482.xyz/?love](https://bouquet.745482.xyz/?love)

## Core Interactions

- **Interactive Sway Physics:** Flowers are simulated with a second-order spring-mass-damper system. Moving the mouse generates wind that pushes the flowers away, scaling dynamically with mouse velocity.
- **Mobile Parallax and Motion:** Tilting the device sways the flowers collectively from their base points at the bottom of the screen. Shaking the device triggers a temporary wind gust proportional to acceleration.
- **Constant Breeze:** A gentle, multi-frequency background wave keeps the garden swaying when idle.

## Customization and Presets

You can pass query parameters to customize the text and typography style:

- **Custom message:** `?text=Your+Message`
- **Presets:** `?birthday`, `?love`, `?exam`, `?sorry`, `?getwell`, `?thankyou`, or `?cheer`.
- **Typography:** Append `&font=mono` to use JetBrains Mono (defaults to Inter sans-serif).

For a quick link builder UI, visit the creator page at `/create/`.

## File Structure

- `index.html` - Main entry point and Open Graph metadata.
- `style.css` - Layout, styling, radial background, and SVG noise texture.
- `script.js` - Coordinates caching, animation loop, spring physics, and input listeners.
- `create/index.html` - Brutalist link builder tool.
