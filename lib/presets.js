// Curated per-window accent palette.
//
// Each preset carries a `dark` and `light` hex so the accent keeps adequate
// contrast against whichever business theme is active. The colors are tuned to
// sit alongside the tranquil-business accent (#78A4FF dark / a comparable blue
// light) without clashing — mid-saturation, legible as a thin indicator strip.
//
// `key` is what we persist in config (stable, never shown); `name` is the label
// shown in the picker.

const PRESETS = [
  { key: 'blue',   name: 'Blue',   dark: '#78A4FF', light: '#155DFF' },
  { key: 'teal',   name: 'Teal',   dark: '#64D1C8', light: '#0E9E92' },
  { key: 'green',  name: 'Green',  dark: '#79D89D', light: '#1F9D57' },
  { key: 'amber',  name: 'Amber',  dark: '#F2C86B', light: '#B7791F' },
  { key: 'orange', name: 'Orange', dark: '#F3A15B', light: '#C2560B' },
  { key: 'rose',   name: 'Rose',   dark: '#FF8A86', light: '#D63A4E' },
  { key: 'purple', name: 'Purple', dark: '#B69CFF', light: '#6D3EE0' },
  { key: 'gray',   name: 'Gray',   dark: '#7F776D', light: '#8A857C' }
];

const BY_KEY = new Map(PRESETS.map(p => [p.key, p]));

function getPreset(key) {
  return BY_KEY.get(key) || null;
}

module.exports = { PRESETS, getPreset };
