---
name: Google Fonts in Tailwind v4
description: How to load Google Fonts — CSS @import fails with PostCSS + Tailwind v4.
---

In Tailwind v4, using `@import url('https://fonts.googleapis.com/...')` inside a `.css` file causes a PostCSS error: `@import must precede all other statements`. This happens because Tailwind v4's `@import "tailwindcss"` expands inline CSS before the Google Fonts import can be processed.

**Fix:** Load Google Fonts via `<link>` tags in `index.html` head:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=..." rel="stylesheet">
```

**Why:** The HTML `<link>` approach bypasses PostCSS entirely and loads fonts in parallel with the page.

**How to apply:** Whenever adding a new font family, put the Google Fonts link in `index.html`, not in any CSS file.
