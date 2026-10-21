import { writable } from 'svelte/store';

function loadAuth() {
  if (typeof localStorage === 'undefined') return { user: null, token: null };
  const raw = localStorage.getItem('hymenia_auth');
  if (!raw) return { user: null, token: null };
  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem('hymenia_auth');
    return { user: null, token: null };
  }
}

export const auth = writable(loadAuth());
export const spaces = writable([]);
export const chats = writable([]);
export const messages = writable([]);

auth.subscribe((value) => {
  if (typeof localStorage === 'undefined') return;
  if (value?.token) localStorage.setItem('hymenia_auth', JSON.stringify(value));
  else localStorage.removeItem('hymenia_auth');
});
