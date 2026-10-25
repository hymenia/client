export function shortcodeAtCaret(text, caret) {
  const before = text.slice(0, caret);
  const match = before.match(/(^|\s):([a-z0-9_+-]{2,})$/i);
  if (!match) return null;
  const query = match[2].toLowerCase();
  return { start: caret - query.length - 1, query };
}

export function completeShortcode(text, caret, start, name) {
  const insert = `:${name}:`;
  return {
    text: text.slice(0, start) + insert + text.slice(caret),
    caret: start + insert.length
  };
}