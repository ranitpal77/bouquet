# 🌸 An Infinite Garden for Her

A beautiful, performant, and responsive infinite flower garden built with vanilla HTML5 Canvas, modern CSS, and JavaScript. The page automatically populates with a staggered wave of blooming flowers, customized ambient glowing background, and support for query-driven text greetings in high-quality fonts.

## Features

- **60 FPS Performance:** Fully optimized rendering path utilizing cached stem points, pre-computed leaf coordinates, reduced seed calculation loops (optimized from 200 down to 45 seeds for sunflowers), and no heavy canvas shadow blur filters.
- **Layered Painting:** Employs a layered rendering sequence where stems are drawn first, followed by a soft dark base-mask shadow to hide origin coordinates, and finally the vibrant flower heads on top.
- **Dreamy Ambient Background Glow:** Blends multiple overlapping radial gradients (left indigo, right rose, and center-bottom organic green) in CSS for a GPU-accelerated glow effect.
- **Responsive Layout:** Stores flower coordinate positions as normalized relative values. Automatically scales and recomputes layout paths during screen orientation changes or window resize.
- **Custom Situational Greeting Text:** Custom URL query parameters let you send personalized messages with premium typography loaded dynamically from Google Fonts.

---

## 🛠️ URL Options & Query Parameters

Customize the message and style of the garden simply by modifying the URL parameters:

### 1. Custom Text
Specify any greeting message:
- `?text=Your+Custom+Message` or `?msg=Your+Custom+Message`

### 2. Situational Preset Flags
If no custom text is provided, you can trigger beautiful pre-formatted greetings:
- `?birthday` ➔ *Happy Birthday! Wishing you a beautiful day 🌸🎂*
- `?exam` ➔ *Best wishes for your exam! You've got this! 📝✨*
- `?love` or `?anniversary` ➔ *Thinking of you always... ❤️🌸*
- `?sorry` ➔ *I'm so sorry. Here are some flowers for you... 🌸🥺*
- `?getwell` ➔ *Get well soon! Wishing you a speedy recovery 🌸🍵*
- `?thankyou` or `?thanks` ➔ *Thank you so much! 🌸✨*
- `?cheer` ➔ *Just a little garden to brighten your day! 🌸✨*

### 3. Font Style
Select between two premium fonts:
- Default: **Inter** (sans-serif)
- Monospace option: Append `&font=mono` (or `&font=jetbrains`) to render text in **JetBrains Mono**.

*Example URL:*
`http://bouquet.745482.xyz/?birthday&font=mono`

---

## 📂 File Structure

The project has been separated into clean, modular files for maintainability:
- `index.html` — Main HTML framework importing Google Fonts and linking styles/scripts.
- `style.css` — GPU-accelerated CSS for multi-glow background, animations, and typography.
- `script.js` — Core animation loop, coordinate scaling, precomputation logic, and URL routing.
