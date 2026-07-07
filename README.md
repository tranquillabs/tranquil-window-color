# tranquil-window-color

Assign a **per-window identity accent color** in Tranquil. Each window already has
its own isolated browser session (`windowSessionId`); this package fills the
**status bar** (bottom band) with your chosen color so you can tell windows apart
at a glance — Peacock / browser-profile style.

## Usage

- **Window Color: Set <color>** (`tranquil-window-color:set-<key>`) — one command per
  preset (Blue, Teal, Green, …). Run from the command palette, or pick from the
  **Window → Window Color** menu.
- **Window Color: Clear Color** (`tranquil-window-color:clear-color`) — remove this
  window's accent.

Colors are keyed to the window's `windowSessionId`, so they persist across restarts
exactly like the window's session does.

## How it works

- Themes in Tranquil are **global** (`core.themes`) and their colors are
  compile-time LESS, so a color can't be varied per-window through the theme system.
  Instead this package injects a small per-window stylesheet — each renderer has its
  own `StyleManager`, so `atom.styles.addStyleSheet(...)` only affects that window —
  setting `--tq-window-accent` (the color) and `--tq-window-accent-fg` (an
  auto-contrasted near-black/white foreground) on `:root`.
- The themes read `var(--tq-window-accent, <fallback>)` on the status bar. With no
  color assigned the fallback wins, so the window looks unchanged. Hooks live in all
  four UI themes (`tranquil-business-dark` / `-light`, `tranquil-theme-dark` /
  `-light`), so the accent works whichever is active.
- Assignments live in one global config map,
  `tranquil-window-color.assignments = { <windowSessionId>: <presetKey> }`.

## Presets

Blue, Teal, Green, Amber, Orange, Rose, Purple, Gray — each with a dark and light
variant so contrast holds under either theme. See `lib/presets.js`.

## Non-goals

- The native macOS title bar is not tinted (`nativeTheme.themeSource` is
  process-global and only toggles light/dark).
- This does not make a window independently light or dark — theme activation is
  global in core. Only the accent is per-window.
