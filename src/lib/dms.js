import { API_HOST } from '$lib/config.js';

export async function fetchDms(token) {
  const res = await fetch(`${API_HOST}/api/dms`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('failed to load dms');
  return res.json();
}

export async function openDm(token, username) {
  const res = await fetch(`${API_HOST}/api/dms`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ username })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'could not open dm');
  return data;
}