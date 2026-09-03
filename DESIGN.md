---
name: Oidrune
description: Operator-controlled relay for GitHub Actions notifications.
colors:
  night-console: "#121a2b"
  oidrune-lime: "#d8f366"
  operator-paper: "#f6f7f9"
  surface-white: "#fff"
  surface-subtle: "#f9fafc"
  surface-table-header: "#fafbfd"
  surface-hover: "#f1f4f8"
  surface-secondary-hover: "#f2f5f8"
  surface-nav-hover: "#202c43"
  surface-nav-selected: "#26344f"
  relay-blue: "#175bcc"
  relay-blue-deep: "#124ba9"
  focus-blue: "#1769e0"
  text-ink: "#162033"
  text-input: "#17243a"
  text-strong: "#1d2a3d"
  text-icon: "#314056"
  text-code: "#344766"
  text-button: "#26354b"
  text-body: "#3e4c61"
  text-label: "#42516a"
  text-dialog: "#536278"
  text-readiness: "#596a42"
  text-secondary: "#617087"
  text-breadcrumb: "#667085"
  text-muted: "#68758b"
  text-quiet: "#657389"
  text-destination: "#718096"
  text-release: "#77849a"
  text-subtle: "#68758b"
  text-warning-dialog: "#815700"
  text-faint: "#667085"
  text-nav: "#9cadc8"
  text-error-notice: "#a12b24"
  text-metric-amber: "#a54e00"
  text-error: "#ad2f29"
  text-destructive: "#b42318"
  text-success-notice: "#166534"
  text-metric-green: "#16804a"
  text-success: "#176c3c"
  text-info: "#34507c"
  text-warning: "#9a5a05"
  text-nav-strong: "#d9e2f1"
  text-nav-hover: "#f7faff"
  border-default: "#dce1e8"
  border-soft: "#e1e6ed"
  border-row: "#e5e9ef"
  border-strong: "#c8d0dc"
  border-input: "#c9d1dd"
  border-icon-hover: "#99a7bb"
  border-icon: "#d4dae3"
  border-nav-active: "#384965"
  readiness-accent: "#8aa84b"
  readiness-border: "#cfdbb4"
  readiness-surface: "#fbfdf5"
  readiness-ready: "#5d9130"
  readiness-ring: "#294331"
  presence-green: "#8ddd77"
  metric-blue-surface: "#e7f0ff"
  metric-green-surface: "#e5f7ec"
  metric-amber-surface: "#fff0cf"
  success-surface: "#e7f8ee"
  success-notice-surface: "#eaf8ee"
  success-border: "#a9dfb7"
  error-surface: "#fff0ef"
  error-border: "#f6bab5"
  warning-surface: "#fff2d8"
  warning-dialog-surface: "#fff1ca"
  info-surface: "#eaf1fc"
  dialog-overlay: "rgb(16 24 40 / 0.44)"
  dialog-shadow: "rgb(16 24 40 / 0.28)"
typography:
  display:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "31px"
    fontWeight: 700
    letterSpacing: "0"
  headline:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "29px"
    fontWeight: 700
    lineHeight: "1.15"
    letterSpacing: "0"
  title:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "21px"
    fontWeight: 700
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "1.55"
  compact:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "12px"
  readiness:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "15px"
    fontWeight: 700
  section:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "18px"
    fontWeight: 700
  dialog-title:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "20px"
    fontWeight: 700
  headline-mobile:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "25px"
    fontWeight: 700
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "13px"
    fontWeight: 650
  code:
    fontFamily: "SFMono-Regular, Consolas, monospace"
    fontSize: "13px"
    fontWeight: 400
rounded:
  input: "5px"
  control: "6px"
  dialog: "8px"
  pill: "999px"
  circle: "50%"
spacing:
  xs: "4px"
  icon-gap: "6px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  2xl: "24px"
  3xl: "30px"
  4xl: "38px"
  mobile-page-x: "18px"
  desktop-page-x: "clamp(20px, 4vw, 64px)"
components:
  button-primary:
    backgroundColor: "{colors.relay-blue}"
    textColor: "{colors.surface-white}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0 15px"
    height: "44px"
  button-secondary:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.text-button}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0 15px"
    height: "44px"
  text-action:
    backgroundColor: "transparent"
    textColor: "{colors.relay-blue}"
    typography: "{typography.label}"
    height: "36px"
  input:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.text-input}"
    typography: "{typography.body}"
    rounded: "{rounded.input}"
    padding: "0 12px"
    height: "44px"
  nav-item:
    backgroundColor: "transparent"
    textColor: "{colors.text-nav}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 11px"
    height: "44px"
  status-pill:
    backgroundColor: "{colors.success-surface}"
    textColor: "{colors.text-success}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "4px 8px"
  dialog:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.text-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.dialog}"
    padding: "28px"
    width: "min(100%, 460px)"

---

# Design System: Oidrune

## Overview

**Creative North Star: "The Trusted Control Room"**

Oidrune's operator console should feel like a quiet control room for a security-sensitive relay: precise, legible, and ready to explain what happened. The interface gives operational facts the first read, keeps the brand signal deliberate, and uses structure rather than decoration to establish confidence.

The dark navigation rail is the stable outer shell. The work area is a cool paper surface with white working surfaces, restrained borders, and a single reliable action blue. Signal Lime belongs to the Oidrune identity and to carefully chosen readiness moments; it is not a general-purpose fill. The result is a compact operational tool that stays calm when delivery needs attention.

**Key Characteristics:**
- A dark, anchored navigation shell with a light operator work area.
- Dense but breathable information blocks built for scanning and comparison.
- Semantic color cues paired with explicit words and accessible focus states.
- Flat surfaces by default, with elevation reserved for protected confirmation.

## Colors

The palette pairs a high-contrast navy and paper foundation with a bright brand signal, a dependable action blue, and small semantic accents for delivery state.

### Primary
- **Relay Blue** (`#175bcc`): The primary action color for submit, confirm, and text actions. Use the deeper Relay Blue (`#124ba9`) only for hover feedback.

### Secondary
- **Oidrune Lime** (`#d8f366`): The identity signal used by the approved v25 mark assets and reserved readiness cues. It should remain rare enough to retain authority.

### Neutral
- **Night Console** (`#121a2b`): The navigation rail and inverse brand field.
- **Operator Paper** (`#f6f7f9`): The page ground behind the console work area.
- **Surface White** (`#fff`): Working surfaces, controls, tables, and the confirmation dialog.
- **Ink and body text** (`#162033`, `#3e4c61`): Primary and supporting reading colors.
- **Cool borders** (`#dce1e8`, `#e1e6ed`, `#c8d0dc`): Quiet structural separation without card-heavy decoration.

### Named Rules

**The Signal-Then-Label Rule.** Status colors can cue success, failure, warning, or acceptance, but a word label always carries the meaning.

**The Rare Accent Rule.** Keep Oidrune Lime for brand marks and deliberate readiness signals; do not wash ordinary controls or whole sections in lime.

**The Compact Contrast Rule.** Table headers, supporting rows, and placeholders remain readable at a 4.5:1 minimum contrast ratio against their assigned surface.

### Semantic States
- **Success:** `#176c3c` on `#e7f8ee`; used for delivered outcomes and healthy notices.
- **Error:** `#ad2f29` on `#fff0ef`; used for terminal failure and error notices.
- **Warning:** `#9a5a05` on `#fff2d8`; used for retrying or attention states.
- **Informational:** `#34507c` on `#eaf1fc`; used for accepted or skipped states.

## Typography

**Display Font:** Inter (with `ui-sans-serif`, system-ui, and platform sans fallbacks)
**Body Font:** Inter (with the same system fallbacks)
**Label/Mono Font:** SFMono-Regular, Consolas, monospace for immutable IDs, SHAs, and masked destination identifiers.

**Character:** Inter keeps the console neutral and highly legible at compact sizes. The mono face is a data tool, not a costume: it appears only where exact character sequences matter.

### Hierarchy
- **Display** (700, 31px, normal line-height): Metric values that summarize delivery health.
- **Headline** (700, 29px, 1.15 line-height): The current console section heading.
- **Title** (700, 21px, normal line-height): Intro headings and high-value section titles.
- **Body** (400, 14px, 1.55 line-height): Descriptions, table content, and operational explanations.
- **Compact** (400 or 700, 12px, normal line-height): Table headers, secondary row data, and compact status text.
- **Label** (650, 13px, normal line-height): Field labels, counts, and button text.
- **Readiness** (700, 15px, normal line-height): The active gateway-policy statement.
- **Section** (700, 18px, normal line-height): Repeating section and destination headings.
- **Dialog title** (700, 20px, normal line-height): Protected confirmation titles.
- **Mobile headline** (700, 25px, 1.15 line-height): The compact current-section heading at the mobile breakpoint.

### Named Rules

**The Data-Has-A-Voice Rule.** Use the mono face for code, immutable identifiers, and measurements only; keep prose in Inter.

## Layout

The desktop console is a two-column shell: a fixed 248px navigation rail and a fluid main area capped at 1480px. The main area is centered with horizontal padding that scales from 20px to 64px (`clamp(20px, 4vw, 64px)`), a 38px top inset, and a 64px bottom inset. The top bar separates navigation context from content with a 1px divider and 30px of bottom breathing room.

Content uses a 30px vertical stack rhythm. The overview metric strip is a three-column equal grid; lists and tables use full-width white surfaces with quiet rules. Forms are single-row inline tools on desktop and have a 660px maximum width where they edit a destination. Controls use a stable 44px minimum height so data entry and actions remain easy to target.

At the 760px breakpoint, the rail becomes a sticky horizontal bar with the compact inverse mark, 44px icon targets, and no visible footer status. All five navigation targets fit at 320px without a horizontal scrollbar. The work area uses 18px side padding, metrics stack to one column, forms stack vertically with full-width primary actions, confirmation actions stack, and tables switch to fixed mobile columns with low-priority columns hidden. Long cell values and status labels remain contained within their columns rather than overlapping adjacent data; a dead-letter retry control moves below its status label to preserve both readable labels and its touch target. Reduced-motion users receive no transition or refresh spin.

## Elevation & Depth

The system is flat by default. 1px borders and tonal changes between Night Console, Operator Paper, Surface White, and subtle gray surfaces provide hierarchy. The only broad shadow is the protected confirmation dialog (`0 22px 65px rgb(16 24 40 / 0.28)`); the tiny presence ring is a state indicator, not a card elevation.

### Shadow Vocabulary
- **Dialog lift** (`box-shadow: 0 22px 65px rgb(16 24 40 / 0.28)`): Separates the confirmation dialog from the scrim while preserving a calm surface.
- **Presence ring** (`box-shadow: 0 0 0 3px #294331`): A compact halo around the access-protected presence dot; never reuse it as a panel shadow.

### Named Rules

**The Flat-By-Default Rule.** Surfaces are flat at rest; elevation appears only where a protected confirmation needs clear focus.

## Shapes

Oidrune uses small, controlled corners rather than soft, inflated cards. Inputs use a 5px radius, ordinary controls and navigation items use 6px, dialogs use 8px, and status labels use a 999px pill only because they are compact state markers. Status and presence indicators are circular. Borders are normally 1px, with the readiness band retaining one deliberate 4px lime edge as a singular status marker; do not generalize that edge treatment to other containers.

## Components

### Buttons
- **Shape:** Compact 6px corners, 44px minimum height, 15px horizontal padding, and an 8px icon-to-label gap.
- **Primary:** Relay Blue fill with white text; use for confirming, adding, trusting, or sending.
- **Hover / Focus:** Hover deepens to `#124ba9`; keyboard focus uses the 3px Relay focus ring (`#1769e0`) with a 2px offset. Active buttons move down 1px.
- **Secondary / Ghost / Tertiary:** Secondary buttons are white with a 1px gray border; text actions are borderless Relay Blue with a 36px minimum height.

### Chips
- **Style:** Status and outcome labels use semantic tinted backgrounds, semantic text, 4px vertical and 8px horizontal padding, and a full pill radius.
- **State:** The color is a cue only; the visible status word remains present and uses sentence capitalization.

### Cards / Containers
- **Corner Style:** Most operational containers are square or 6px; the dialog alone reaches 8px.
- **Background:** White working surfaces sit on Operator Paper or a subtle gray form surface.
- **Shadow Strategy:** Use the Elevation section's dialog lift only for protected confirmation.
- **Border:** 1px cool-gray rules define tables, metrics, forms, and the top bar.
- **Internal Padding:** Common blocks use 16px to 24px; metrics use 23px and the dialog uses 28px.

### Inputs / Fields
- **Style:** White background, `#c9d1dd` 1px border, 5px radius, 44px height, and 12px horizontal padding.
- **Focus:** A visible 3px `#1769e0` outline with 2px offset; never rely on a color shift alone.
- **Error / Disabled:** Preserve the field geometry while using the semantic error treatment or the shared disabled opacity (`0.55`).

### Navigation
- **Style:** The desktop rail is Night Console with a 150px B2-derived lockup. Items are 44px tall, 6px radius, and use muted blue-gray text. Hover uses `#202c43`; the active item uses `#26344f` with a 1px `#384965` border and exposes `aria-current="page"`. On mobile, the rail is sticky and labels are visually hidden but remain accessible to assistive technology; all five icon targets fit at 320px without horizontal scrolling.

### Tables and Lists
- **Style:** White, full-width working surfaces with 1px outer rules, 12px header padding, 15px row padding, and mono text for immutable IDs. Keep the primary value bold and the supporting line muted. On narrow viewports, cell content may wrap but must never cross a neighboring column boundary; keep compact outcome and status labels on one readable line, and stack a dead-letter retry control beneath its status when the dedicated action column is hidden.

### Readiness Band
- **Style:** A quiet `#fbfdf5` band with a single `#8aa84b` left marker, a 9px readiness dot, and a secondary action. This is the console's one explicit readiness callout; keep it singular.

### Confirmation Dialog
- **Style:** A centered 460px maximum white surface with 28px padding, 8px radius, a 44% Night Console scrim, and the dialog lift shadow. Actions align to the end on desktop and stack full-width on mobile.
- **Interaction:** Use only for irreversible or externally visible actions. Opening moves focus to Cancel, makes console content inert, keeps Tab navigation within the dialog, supports Escape to cancel, and restores focus to the invoking control when it closes. Simple in-console navigation happens directly without confirmation.

## Do's and Don'ts

### Do:
- **Do** use the approved B2 console lockup on dark navigation surfaces and the compact inverse mark at the mobile breakpoint.
- **Do** keep Relay Blue for actions and Oidrune Lime for identity or deliberate readiness signals.
- **Do** pair every semantic color cue with an explicit text label and a visible keyboard focus state.
- **Do** consume the documented semantic CSS tokens instead of introducing parallel literal values in console styles.
- **Do** reserve mono typography for immutable IDs, SHAs, and other exact data.
- **Do** preserve flat working surfaces and use borders or tonal layering for ordinary hierarchy.

### Don't:
- **Don't** introduce gradients, decorative blobs, or broad glow effects into the operator console.
- **Don't** use lime as a generic button, panel, or page background.
- **Don't** use status color without the corresponding written outcome or status.
- **Don't** replace the documented small-radius language with oversized soft cards or gratuitous pills.
- **Don't** use a shadow to solve hierarchy that a 1px rule or tonal surface can express.
- **Don't** use a confirmation dialog for simple navigation or a task that has no protected side effect.
