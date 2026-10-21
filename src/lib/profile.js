import { API_HOST } from '$lib/config.js';
function authHeaders(token, json = false) {
  const headers = { Authorization: `Bearer ${token}` };
  if (json) headers['Content-Type'] = 'application/json';
  return headers;
}

export async function fetchProfile(token) {
  try {
    const res = await fetch(`${API_HOST}/api/account/profile`, {
      headers: authHeaders(token)
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.warn('Failed to fetch profile', e);
    return null;
  }
}

export async function updateProfile(token, displayName, bio) {
  try {
    const res = await fetch(`${API_HOST}/api/account/profile`, {
      method: 'PATCH',
      headers: authHeaders(token, true),
      body: JSON.stringify({ displayName, bio })
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error || 'Failed to update profile' };
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: 'Could not reach server' };
  }
}

export async function changePassword(token, currentPassword, newPassword) {
  try {
    const res = await fetch(`${API_HOST}/api/account/password`, {
      method: 'POST',
      headers: authHeaders(token, true),
      body: JSON.stringify({ currentPassword, newPassword })
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error || 'Failed to change password' };
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: 'Could not connect to server' };
  }
}

export async function deleteAccount(token, password) {
  try {
    const res = await fetch(`${API_HOST}/api/account/delete`, {
      method: 'POST',
      headers: authHeaders(token, true),
      body: JSON.stringify({ password })
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error || 'Failed to delete account' };
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: 'Could not connect to server' };
  }
}

export function resizeImageToDataUrl(file, maxDim = 160) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => { img.src = reader.result; };
    reader.onerror = reject;
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function uploadAvatar(token, file) {
  if (!file.type.startsWith('image/')) {
    return { ok: false, error: 'Please choose an image file' };
  }
  let dataUrl;
  try {
    dataUrl = await resizeImageToDataUrl(file);
  } catch (e) {
    return { ok: false, error: 'Could not process that image' };
  }
  try {
    const res = await fetch(`${API_HOST}/api/account/avatar`, {
      method: 'POST',
      headers: authHeaders(token, true),
      body: JSON.stringify({ avatarUrl: dataUrl })
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error || 'Failed to upload avatar' };
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: 'Could not process that image' };
  }
}

export async function clearAvatar(token) {
  try {
    const res = await fetch(`${API_HOST}/api/account/avatar/delete`, {
      method: 'POST',
      headers: authHeaders(token)
    });
    if (!res.ok) return { ok: false, error: 'Could not remove avatar' };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: 'Could not reach server' };
  }
}
