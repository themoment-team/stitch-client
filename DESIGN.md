# Stitch UI design system

## Atmosphere & identity
- Direction: **premium / soft — a small pixel-sticker atelier**. Calm, tactile, precise. Keep the existing neumorphism, but reserve its strongest depth for the main workspace and primary action rather than shadowing every label.
- Audience: Korean-speaking visitors drawing, refining, printing, and saving a sticker, often on a phone.
- Signature: four-square stitch mark and a compact numbered progress rail; the pixel drawing itself is the hero artwork. No decorative stock imagery, glass, gradients, or editorial serif treatment.
- Content order: identify the current step, give one clear instruction, show the artwork/workspace, expose the relevant controls, then show the next action. Existing timer, AI quotas, error messages, and print/share behavior remain intact.

## Color
- Ground `#edf0f4`; raised surface `#edf0f4`; inset well `#e9edf2`; paper/canvas `#ffffff`.
- Ink `#222936`, muted `#526073`, subtle `#5d6a7e`; hairline `#c7d0db`.
- Primary coral `#b83e59` with white text; tint `#f8e9ed` for selection. Mint `#dcefe9` only as a supporting progress/accent note. Danger `#b42337` on pale rose.
- Surface shadows use cool light `#ffffff` and cool dark `#cbd2dc`; coral shadows use `#ffffff` and `#e4b9c4`.
- Proportion: mostly neutral ground and paper, restrained coral on one primary action/selected control per block. Maintain WCAG AA text contrast; never use pale accent text on pale surfaces.

## Typography
- Pretendard, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif throughout. No new font dependency.
- Display: 36–60px, 800–900, tight tracking; page heading: 24–32px, 800; section heading: 16–18px, 700; body: 15–16px, 400–600, line-height 1.55–1.7; captions/labels: at least 14px in Korean. Numerals may use tabular figures.
- Korean wraps naturally (`word-break: keep-all`, `overflow-wrap: anywhere` where needed); avoid single-line heading truncation on narrow screens. Uppercase Latin labels are supplementary, never the only explanation.

## Spacing & layout
- Four-pixel base: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64px. Outer shell width 1184px; start/editor/compare/print card max width ~1184px; share/404 card width ~760px.
- Desktop draw workspace: artwork left (dominant), tools right (~320px). Narrow screens: artwork then controls, vertical scrolling on document/body; no fixed-height clipped workspace. Convert cards: responsive peer grid; print: artwork and QR as adjacent peer panels, stacked on mobile.
- At 375px, 768px, and 1440px: no horizontal overflow. On desktop widths of at least 1024px and heights of at least 768px, the normal four-step flow should fit without document scrolling by scaling the canvas and preview to available height. Shorter windows, expanded AI/status content, zoom, and narrow/mobile screens may scroll naturally; never hide overflowing actions. Footer action stays in normal flow, not over content. Print layout retains A4-only `.print-target` behavior.

## Components & states
- `StepCard`: soft raised main surface with thin top edge; narrow/wide variants. `StepLabel`: numbered 4-step rail with current, previous, upcoming semantics. `StepButton`, `ToolButton`, and standard action classes: default raised, hover lighter/lifted, focus-visible solid coral outline, active inset, disabled dim/no shadow. Loading labels stay stable; errors use text plus role=alert, not color alone.
- Editor controls are grouped by purpose (canvas size, tools, colors, AI guide). Canvas/preview and QR sit in inset paper wells. Empty AI result gets a visible placeholder; selected comparison gets coral border and text plus aria-pressed.
- Preserve input values and user artwork when requests fail. The missing-link/404 route uses the same card and offers a clear return-home action; it does not imply a missing drawing can be recovered. All existing user-facing actions keep labels and behavior.

## Motion & interaction
- Shadow/transform transitions only (150–220ms ease-out). No autoplay animation beyond status pulse. `prefers-reduced-motion: reduce` removes transitions and status pulse. Never animate the canvas while drawing.
- Focus rings must remain visible even with shadows; semantic buttons and fieldset legends keep keyboard/touch paths. Touch targets aim for at least 44px.

## Depth & surface
- Raised: main card and primary/secondary buttons, with two-direction soft shadows. Inset: tool trays, preview beds, text input, QR bay. Flat: text groups and informational captions. Main card has a subtle top border for definition; shadow intensity does not encode critical state without text/border.

## Accessibility constraints & accepted debt
- Keep minimum 15px Korean body copy where space permits; 14px for short labels, captions, and status. Contrast, focus-visible states, progress aria-label, disabled states, responsive reflow, and reduced motion are required.
- Pixel canvas currently uses pointer input only; adding keyboard drawing is outside this visual redesign. Browser verification of real AI and database success paths requires configured remote services; a local fixture can verify layout and states, not production integration.
