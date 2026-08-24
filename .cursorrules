# 🏛️ Core Engineering & Design Principles (Project Skills)

This project strictly adheres to the following four pillars. Any code, architecture, or UI generated must pass these guidelines flawlessly.

## 1. 🎨 Taste (Aesthetic & Typography)
- **Vercel × Anthropic Minimalist Aesthetic:** The UI must feel premium, enterprise-grade, and extremely polished.
- **Color Palette:** Use sophisticated, muted monochromes and pastels. Never use cheap default browser colors (no raw `#FF0000` or `#00FF00`). Stick to tailored HSL values, sleek dark/light mode scales, and smooth gradients.
- **Typography:** Utilize high-contrast, elegant modern typography (e.g., Inter, Geist, or Outfit). Implement strict typographic hierarchies with proper line heights and letter spacing.
- **Spacing & Layout:** Clean, intentional whitespace. Do not use raw, unstyled CSS grids without an explicit design intent. Use a mathematical spacing scale (e.g., 4px, 8px, 12px, 16px, 24px, 32px).

## 2. ⚡ Emil Kowalski (Motion & Micro-interactions)
- **Fluid & Organic Animations:** Every state transition (hover, active, focus, disabled, page load) must have a smooth, organic animation. No abrupt or jarring visual changes.
- **Easing Curves:** Never use default `linear` or `ease`. Strictly use custom spring-like or smooth easing curves, such as:
  - `cubic-bezier(0.32, 0.72, 0, 1)` for general smooth transitions.
  - `cubic-bezier(0.34, 1.56, 0.64, 1)` for bouncy, satisfying micro-interactions.
- **Performance:** All animations must hit a flawless 60 FPS, strictly utilizing GPU-accelerated properties (`transform`, `opacity`) instead of layout-triggering properties (`margin`, `padding`).

## 3. 💎 Impeccable (Engineering Rigor & UX)
- **Pixel-Perfection:** The layout must be mathematically flawless. No misaligned divs, clipped shadows, or overlapping text.
- **Edge-Case Mastery:** You must explicitly handle and design for every possible state:
  - ⏳ *Loading states:* Implement elegant Skeleton loaders or custom spinners. Never leave the user guessing if the app is frozen.
  - 📭 *Empty states:* Beautifully designed empty lists (e.g. "No reservations found yet", accompanied by a subtle illustration or icon).
  - 🛑 *Error rollbacks:* Graceful API failures, form validation feedback, network disconnects, and safe fallback UIs.
- **Robust Integrity:** Explicit handling of unsafe inputs, unauthenticated routes, and database constraints.

## 4. 🚫 Anti-slop (Code Quality & Intent)
- **Zero AI-Boilerplate:** Code must be highly intentional and razor-sharp. Do not generate generic wrapper functions, unnecessary context providers, or redundant variables.
- **Meaningful Comments Only:** Do not write useless comments like `// fetch data` or `// button click`. Only comment *why* a complex decision/workaround was made, never *what* the code does.
- **Concise & DRY:** Every single line of code must justify its existence. If a component, type, or utility function already exists, reuse it. Do not duplicate logic.
- **Native over Abstraction:** Use native CSS over massive utility classes if it becomes unreadable; use native DOM behavior where appropriate. Keep dependencies to an absolute minimum.
