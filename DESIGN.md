---
name: BanyanBoard
description: Self-hosted kanban for small teams — silent infrastructure, zero overhead.
colors:
  signal-violet: "#aa3bff"
  signal-violet-dark: "#c084fc"
  text-body: "#6b6375"
  text-heading: "#08060d"
  bg-page: "#ffffff"
  bg-board: "#f4f5f7"
  bg-column: "#ebecf0"
  bg-card: "#ffffff"
  bg-dark: "#16171d"
  text-muted: "#5e6c84"
  text-board: "#172b4d"
  border: "#e5e4e7"
  border-dark: "#2e303a"
  focus-ring: "#0052cc"
  warning: "#b26a00"
typography:
  display:
    fontFamily: "system-ui, 'Segoe UI', Roboto, sans-serif"
    fontSize: "56px"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "-1.68px"
  headline:
    fontFamily: "system-ui, 'Segoe UI', Roboto, sans-serif"
    fontSize: "24px"
    fontWeight: 500
    lineHeight: "118%"
    letterSpacing: "-0.24px"
  body:
    fontFamily: "system-ui, 'Segoe UI', Roboto, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: "145%"
    letterSpacing: "0.18px"
  label:
    fontFamily: "system-ui, 'Segoe UI', Roboto, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    letterSpacing: "0.05em"
  mono:
    fontFamily: "ui-monospace, Consolas, monospace"
    fontSize: "15px"
    lineHeight: "135%"
rounded:
  none: "0"
  sm: "4px"
  md: "6px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  card:
    backgroundColor: "{colors.bg-card}"
    rounded: "{rounded.sm}"
    padding: "10px 12px"
  card-dragging:
    backgroundColor: "{colors.bg-card}"
    rounded: "{rounded.sm}"
    padding: "10px 12px"
  column:
    backgroundColor: "{colors.bg-column}"
    rounded: "{rounded.md}"
    padding: "12px"
  button-add-card:
    backgroundColor: "transparent"
    textColor: "{colors.text-muted}"
    rounded: "{rounded.sm}"
    padding: "6px 8px"
  button-submit:
    backgroundColor: "{colors.signal-violet}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    padding: "6px 16px"
  button-cancel:
    backgroundColor: "transparent"
    textColor: "{colors.text-body}"
    rounded: "{rounded.sm}"
    padding: "6px 16px"
  input-card-title:
    backgroundColor: "{colors.bg-card}"
    textColor: "{colors.text-board}"
    rounded: "{rounded.sm}"
    padding: "8px 10px"
---

# Design System: BanyanBoard

## 1. Overview

**Creative North Star: "The Clear Desk"**

BanyanBoard is a workspace that earns trust by disappearing. The interface is sparse and intentional — every element present because it reduces the next drag, not because it fills space. The visual vocabulary is inherited from familiar tools (system fonts, standard controls, Atlassian-adjacent board colors) on purpose: novelty would only slow the user down.

The color palette is muted by design. Signal Violet appears on actions and focus states only, never decoration. The board's grays (#f4f5f7 → #ebecf0 → #ffffff) read as a natural depth stack — column lighter than board background, card lighter than column — without any shadows at rest. The system's restraint is its personality.

This system explicitly rejects the Jira pattern: no dense chrome, no sidebar trees, no configuration forms masquerading as collaboration. It also rejects the opposite trap — the over-designed productivity aesthetic where the interface is the product. BanyanBoard has no hero metrics, no illustrated empty states, no onboarding sequences. Work begins at card-zero.

**Key Characteristics:**
- Muted neutral ground, one functional accent
- System font stack — familiar, not designed
- Structural depth without visual weight
- Shadows only on interaction, never at rest
- Focus states are explicit and unmissable

## 2. Colors: The Receding Palette

Every color earns less than one second of attention. The neutrals do the work; Signal Violet marks what's actionable.

### Primary
- **Signal Violet** (`#aa3bff` / dark mode `#c084fc`): The single accent. Used exclusively for primary CTA buttons, focus rings in the index-level UI, and hover states. Never decorative. Dark mode variant is lighter to maintain contrast against `#16171d`.

### Neutral
- **Board Ground** (`#f4f5f7`): The board surface. Slightly blue-gray — cooler than white, calmer than cream. Sets the container below all columns.
- **Column Gray** (`#ebecf0`): Column background. Slightly darker than the board, creating a natural lift without a shadow.
- **Card White** (`#ffffff`): Cards sit at the lightest value, creating the tonal depth stack: board → column → card.
- **Body Text** (`#6b6375`): Muted purple-gray. Body copy, secondary labels. Carries a faint hue toward the Signal Violet axis — the system's only nod to warmth.
- **Heading Near-Black** (`#08060d`): Headings at the page level. Near-black with an almost imperceptible purple undertone.
- **Board Text** (`#172b4d`): Dark navy for board-level body text. Atlassian-lineage; high contrast against the gray board surfaces.
- **Muted Label** (`#5e6c84`): Column headers, secondary labels. Blue-gray — reads as structural, not editorial.
- **Border Hairline** (`#e5e4e7` / dark `#2e303a`): Dividers. One pixel, never decorative.
- **Page Dark** (`#16171d`): Dark mode page background. Slightly blue-shifted, not neutral-black.
- **Warning Amber** (`#b26a00`): API error notices only. Not part of the interaction vocabulary.
- **Focus Blue** (`#0052cc`): Keyboard focus ring on cards. Opinionated, accessible (4.5:1+ on white), deliberate contrast with Signal Violet so focus state reads differently from selection state.

### Named Rules
**The One Accent Rule.** Signal Violet appears on ≤2 interactive elements per screen. If you find yourself reaching for it as a background, a badge fill, or a section header — stop. That color's power is its scarcity.

**The Tonal Stack Rule.** Board → Column → Card is a lightness sequence: `#f4f5f7` → `#ebecf0` → `#ffffff`. Do not break this order. A column whiter than a card destroys the spatial model.

## 3. Typography

**Body/UI Font:** system-ui, 'Segoe UI', Roboto, sans-serif
**Monospace:** ui-monospace, Consolas, monospace

**Character:** A single-family system stack. No custom webfonts, no pairing decisions, no loading delay. The choice says: this tool is for working, not for looking at. Headings and body share the same family; hierarchy is carried by size and weight, not contrast.

### Hierarchy
- **Display** (500 weight, 56px / 36px mobile, −1.68px tracking): Board-level title only. Tight tracking pulls it away from the UI noise below. Appears once per view.
- **Headline** (500 weight, 24px / 20px mobile, −0.24px tracking, 118% line-height): Section headings. Slightly tighter than neutral to read as deliberate.
- **Body** (400 weight, 18px / 16px tablet, 145% line-height, +0.18px tracking): Primary reading text. Positive letter-spacing at this size aids legibility on body copy, compensating for system-font hinting variance.
- **Label** (600 weight, 14px, +0.05em tracking, uppercase): Column headers. All-caps + tracking encodes "structural label" — a type signal, not an aesthetic choice. Never use this style for editable or user-generated content.
- **Mono** (15px, 135% line-height, 4px radius background): Code and counters only. Always on `--code-bg` (`#f4f3ec`). Size down from body (18→15px) to optically match x-height.

### Named Rules
**The System Stack Rule.** Never replace the system font stack with a webfont without updating `--sans`, `--heading`, and the frontmatter `typography` tokens simultaneously. One-off font-family overrides create an uncanny valley between the token system and the rendered UI.

## 4. Elevation

BanyanBoard uses **tonal depth as the default and shadows as a state signal**. At rest, depth is entirely expressed through background color steps: the board (ground), column (raised), card (surface). No shadows in resting state — the tonal stack does the work.

Shadows appear exclusively as interaction feedback: a card under cursor during drag lifts off the column surface; a dialog or popover appears above the board layer.

### Shadow Vocabulary
- **Card Lift** (`box-shadow: 0 1px 2px rgba(9, 30, 66, 0.15)`): Default card shadow — nearly imperceptible at rest but included for definition against same-hue backgrounds when the tonal difference is subtle on high-gamut displays.
- **Card Drag** (`box-shadow: 0 8px 24px rgba(9, 30, 66, 0.25)`): Applied during active drag. The elevation jump is the motion — the card leaving the surface is the feedback.
- **Page Ambient** (`box-shadow: rgba(0,0,0,0.1) 0 10px 15px −3px, rgba(0,0,0,0.05) 0 4px 6px −2px`): Floating elements (dialogs, dropdowns). Dual-layer — diffuse + tight — for a natural appearance. Dark mode variant doubles the opacity on both layers.

### Named Rules
**The Flat-by-Default Rule.** Surfaces are flat at rest. A card that looks lifted before you touch it has lost the ability to signal drag state. Elevation is reserved for things that move.

## 5. Components

### Cards
The primary interactive unit. Minimal by design — title, drag handle affordance, nothing else.
- **Shape:** Gently squared (4px radius). Rounds the corners without softening the edges. Cards should feel like objects, not badges.
- **Background:** Card White (`#ffffff`) on Column Gray (`#ebecf0`). No border at rest — the tonal contrast is sufficient.
- **Shadow at rest:** Near-invisible lift (`0 1px 2px rgba(9,30,66,0.15)`). Insurance for displays where #fff/##ebecf0 reads as identical.
- **Focus:** 2px solid Focus Blue (`#0052cc`), 2px offset. Unmissable, deliberate contrast with Signal Violet.
- **Dragging:** Shadow steps up to `0 8px 24px rgba(9,30,66,0.25)`. `cursor: grabbing`. This is the only state change the card communicates.
- **Typography:** 0.9rem body, 1.4 line-height. User-generated content — never uppercase, never tracked.

### Columns
Structural containers. Read as furniture, not UI.
- **Shape:** 6px radius. Slightly rounder than cards to encode "container".
- **Background:** Column Gray (`#ebecf0`). Width: 280px fixed. Do not make columns fluid — the fixed width is spatial memory; users locate columns by position.
- **Header:** Uppercase label style (14px, 600 weight, 0.05em tracking) in Muted Label (`#5e6c84`). Communicates "this is the column name" via type signal, not position. Never editable inline without explicit edit affordance.
- **Padding:** 12px on all sides. 8px gap between cards.

### Buttons
Two variants in active use: Submit (primary) and ghost-cancel.
- **Primary (Add card submit):** Signal Violet fill, white text, 4px radius, 6px/16px padding. No border. Hover: darken 10%. Focus: 2px Signal Violet outline.
- **Ghost (Cancel / Add card trigger):** Transparent background, `text-muted` or Signal Violet text depending on context, 4px radius. No border at rest. Hover: background tint at 8% opacity.
- **Shape:** Consistently 4px radius across all button variants. A button that rounds differently from cards breaks the shape vocabulary.

### Inputs / Fields
One field type in active use: the card-title input inside CardForm.
- **Style:** White fill, no visible border at rest, 4px radius, 8px/10px padding. Inherits board text color (`#172b4d`).
- **Focus:** Browser default focus ring (or mirrored as `2px solid #0052cc`). Inline input inside a column — keep it minimal; the column provides context.
- **Error:** Inline error span below input, amber/warning palette (`#b26a00` adjacent). Role `alert` for screen readers. No icon — copy carries the message.
- **Validation:** Client-side only. Title required; max 100 chars. Error clears on next submit attempt.

### Activity Feed
Real-time event log. Secondary surface.
- **Role:** `log` with `aria-live="polite"`. Screen readers announce new entries without interrupting.
- **Typography:** Label size, muted palette. Timestamps in mono. Events are system-generated — never user-styled.
- **Layout:** Append-only list. Most recent at bottom. No pagination in MVP.

### Board Container
- **Max-width:** 1126px, centered, `border-inline: 1px solid var(--border)`. The inline border visually bounds the app surface on wide displays. Do not remove it — it defines the content column without a background color difference.
- **Min-height:** `100svh`. Board extends to viewport bottom even with few cards.

## 6. Do's and Don'ts

### Do:
- **Do** keep Signal Violet to focus states, primary action buttons, and hover accents only. One accent color per screen maximum.
- **Do** use the tonal stack (board → column → card: #f4f5f7 → #ebecf0 → #ffffff) to convey depth. Never reverse it.
- **Do** apply Focus Blue (`#0052cc`) for keyboard focus rings — it contrasts with both Signal Violet and the neutral surfaces.
- **Do** keep shadows out of resting states. Shadows are state signals: drag, hover-lift, popover. Not decoration.
- **Do** use the system font stack (`system-ui, 'Segoe UI', Roboto, sans-serif`). Skip webfonts; they add latency and brand none.
- **Do** keep card UI to title + drag affordance. Every field added to a card increases cognitive load by more than its information value.
- **Do** test color contrast: body text (`#6b6375` on `#fff`) is 4.9:1 — on the threshold. Never lighten body text further.
- **Do** provide a `prefers-reduced-motion` alternative for every drag animation and state transition.

### Don't:
- **Don't** add features that require reading docs. If a UI pattern needs explaining, the pattern is wrong.
- **Don't** make this feel like Jira. No sidebar trees, no configuration forms, no dense chrome. If a screen feels like project management software, simplify it.
- **Don't** use border-left greater than 1px as a colored accent stripe on cards, column headers, or callouts. Rewrite with background tints or full borders.
- **Don't** use gradient text or `background-clip: text` with a gradient. Muted system with a single accent — gradients undo both.
- **Don't** add decorative motion. Transitions exist to convey state change: drag lift, add-card form reveal, activity entry arrival. Nothing else earns an animation.
- **Don't** invent new status colors beyond warning amber. The palette has one accent. A second accent for "in progress" or "blocked" states is a design smell — encode state in the column, not the card color.
- **Don't** use modal dialogs as first thought. Card creation is inline; keep it that way. Exhaust in-column, in-card progressive alternatives before reaching for a modal.
- **Don't** add eyebrows, section kickers, or numbered section markers. The board is a tool surface, not a landing page.
- **Don't** break the 1126px container by adding full-bleed sections or edge-to-edge backgrounds. The inline border is the frame; honor it.
