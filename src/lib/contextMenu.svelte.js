export const menu = $state({ open: false, x: 0, y: 0, items: [] });

export function openMenu(event, items) {
  if (!items?.length) return;
  event.preventDefault();
  menu.x = event.clientX;
  menu.y = event.clientY;
  menu.items = items;
  menu.open = true;
}

export function closeMenu() {
  menu.open = false;
}

export async function copyText(text) {
  const value = String(text);
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = value;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
}