import data from 'emoji-picker-element-data/en/emojibase/data.json';

const lookup = new Map();

// handles both a flat array and an object of arrays
function entries(d) {
  if (Array.isArray(d)) return d;
  return Object.values(d).flatMap((v) => (Array.isArray(v) ? v : []));
}

for (const entry of entries(data)) {
  const char = entry.emoji ?? entry.unicode;
  if (!char || !Array.isArray(entry.shortcodes)) continue;
  for (const code of entry.shortcodes) {
    if (!lookup.has(code)) lookup.set(code, char);
  }
}

export function shortcodeToEmoji(name) {
  return lookup.get(name);
}

// names that start with the query come first, then names that contain it
export function searchShortcodes(query, limit = 8) {
  const q = query.toLowerCase();
  if (!q) return [];
  const starts = [];
  const contains = [];
  for (const name of lookup.keys()) {
    if (name.startsWith(q)) starts.push(name);
    else if (name.includes(q)) contains.push(name);
  }
  const byLength = (a, b) => a.length - b.length || a.localeCompare(b);
  starts.sort(byLength);
  contains.sort(byLength);
  return [...starts, ...contains].slice(0, limit);
}