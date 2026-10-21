const MIN_SPACES = 100, MAX_SPACES = 320;
const MIN_CHATS = 140, MAX_CHATS = 420;

export const columns = $state({ spacesWidth: 140, chatsWidth: 190, resizing: null });

export function startResize(which) {
  return (e) => {
    e.preventDefault();
    columns.resizing = which;
  };
}

export function onPointerMove(e) {
  if (!columns.resizing) return;
  if (columns.resizing === 'spaces') {
    columns.spacesWidth = Math.min(MAX_SPACES, Math.max(MIN_SPACES, e.clientX));
  } else {
    columns.chatsWidth = Math.min(MAX_CHATS, Math.max(MIN_CHATS, e.clientX - columns.spacesWidth));
  }
}

export function onPointerUp() {
  if (!columns.resizing) return;
  columns.resizing = null;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('col-widths', JSON.stringify({
      spacesWidth: columns.spacesWidth,
      chatsWidth: columns.chatsWidth
    }));
  }
}

export function restoreColumnWidths(prefs) {
  const cw = prefs?.colWidths?.chatsWidth;
  if (Number.isFinite(cw)) {
    columns.chatsWidth = Math.min(MAX_CHATS, Math.max(MIN_CHATS, cw));
  }
}
