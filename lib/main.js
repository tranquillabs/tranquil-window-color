// tranquil-window-color
//
// Assigns a per-window identity accent color, keyed to each window's durable
// `windowSessionId` (the same id that partitions the window's isolated browser
// session). The color is applied by injecting a tiny per-window stylesheet that
// sets the `--tq-window-accent` custom property on :root; the active business
// theme reads that variable at a few surfaces (top strip, active tab, status
// bar) with a fallback, so windows with no assignment look unchanged.
//
// Storage is a single global config map { <windowSessionId>: <presetKey> }.
// Because the session id is restored on restart, the accent reappears
// automatically on the restored window with no main-process changes. Entries for
// windows that no longer exist are dropped when a window starts (pruneAssignments).
//
// The picker is one command per preset (plus a clear command) — no external UI
// dependency, and every color is discoverable straight from the command palette.

const fs = require('fs');
const path = require('path');
const { CompositeDisposable } = require('atom');
const { PRESETS, getPreset } = require('./presets');

const { PACKAGE, setting } = require('./settings.js');

const CONFIG_KEY = setting('assignments');
// The name Pulsar's StyleManager keeps this generated stylesheet under (as core does with
// 'global-text-editor-styles'), and what DevTools shows as its source-path.
const STYLE_SOURCE_PATH = `${PACKAGE}:window-accent`;

let subscriptions = null;
let styleDisposable = null;

function getSessionId() {
  const settings = atom.getLoadSettings();
  return settings && settings.windowSessionId;
}

function getAssignments() {
  return atom.config.get(CONFIG_KEY) || {};
}

function currentPresetKey() {
  const id = getSessionId();
  if (!id) return null;
  return getAssignments()[id] || null;
}

// Which theme variant is active? Business-light (or any theme whose name reads
// as "light") gets the light hex; everything else gets the dark hex.
function resolveVariant() {
  const themes = atom.config.get('core.themes') || [];
  return themes.some(t => /light/i.test(t)) ? 'light' : 'dark';
}

function hexForPreset(preset) {
  if (!preset) return null;
  return preset[resolveVariant()] || preset.dark;
}

// Readable foreground (near-black or white) for text sitting on `hex`, chosen by
// the accent's relative luminance so status-bar text stays legible on any preset.
function contrastFor(hex) {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex);
  if (!m) return '#ffffff';
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return lum > 0.6 ? '#1a1a1a' : '#ffffff';
}

// Inject (or replace) this window's accent stylesheet. Re-injecting under the
// same sourcePath replaces in place; disposing first keeps the sourcePath map
// clean (see StyleManager.removeStyleElement).
function applyColor() {
  const hex = hexForPreset(getPreset(currentPresetKey()));
  if (styleDisposable) {
    styleDisposable.dispose();
    styleDisposable = null;
  }
  if (!hex) return; // no accent assigned: the theme's fallbacks apply
  const css = `:root { --tq-window-accent: ${hex}; --tq-window-accent-fg: ${contrastFor(hex)}; }`;
  styleDisposable = atom.styles.addStyleSheet(css, {
    sourcePath: STYLE_SOURCE_PATH,
    priority: 2
  });
}

function setColor(key) {
  const id = getSessionId();
  if (!id) {
    atom.notifications.addWarning(
      'Window Color: this window has no session id, so a color cannot be saved.'
    );
    return;
  }
  const assignments = Object.assign({}, getAssignments());
  if (key) {
    assignments[id] = key;
  } else {
    delete assignments[id];
  }
  // Persist globally; the config observer re-applies for this window.
  atom.config.set(CONFIG_KEY, assignments);
}

// Window session ids that still exist: the windows Pulsar saved for restore, which the main
// process rewrites whenever a window opens or closes (storage/application.json, version "1", see
// tranquil-client atom-application.js saveCurrentWindowOptions), plus this window. Null when the
// file cannot be read or has another format, so nothing is dropped on a guess.
function liveSessionIds() {
  try {
    const file = path.join(atom.getConfigDirPath(), 'storage', 'application.json');
    const state = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!state || state.version !== '1' || !Array.isArray(state.windows)) return null;
    const ids = new Set(state.windows.map((w) => w && w.windowSessionId).filter(Boolean));
    const own = getSessionId();
    if (own) ids.add(own);
    return ids;
  } catch (e) {
    return null;
  }
}

// Drop color assignments for windows that are gone, so the map does not grow forever.
function pruneAssignments() {
  const live = liveSessionIds();
  if (!live) return;
  const assignments = getAssignments();
  const kept = {};
  for (const [id, key] of Object.entries(assignments)) if (live.has(id)) kept[id] = key;
  if (Object.keys(kept).length !== Object.keys(assignments).length) atom.config.set(CONFIG_KEY, kept);
}

module.exports = {
  activate() {
    subscriptions = new CompositeDisposable();

    // One command per preset: "Window Color: Blue", "Window Color: Amber", …
    const commands = {
      'tranquil-window-color:clear-color': () => setColor(null)
    };
    for (const preset of PRESETS) {
      commands[`tranquil-window-color:set-${preset.key}`] = () =>
        setColor(preset.key);
    }
    subscriptions.add(atom.commands.add('atom-workspace', commands));

    pruneAssignments();

    // Fires immediately with the current value (initial apply) and on change.
    subscriptions.add(atom.config.observe(CONFIG_KEY, () => applyColor()));

    // Re-pick the light/dark variant when the global theme flips.
    subscriptions.add(
      atom.config.onDidChange('core.themes', () => applyColor())
    );
  },

  deactivate() {
    if (subscriptions) {
      subscriptions.dispose();
      subscriptions = null;
    }
    if (styleDisposable) {
      styleDisposable.dispose();
      styleDisposable = null;
    }
  }
};
