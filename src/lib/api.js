import { API_HOST } from './config.js';
import { mapServerMessage } from './messageShape.js';

async function request(path, { method = 'GET', token, body, fallback = 'Request failed' } = {}) {
  let res;
  try {
    res = await fetch(`${API_HOST}${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
  } catch {
    // only when theres NOTHING
    throw new Error('Could not reach server');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || fallback);
  return data;
}

export const fetchSpaces = (token) => request('/api/spaces', { token, fallback: 'Could not load spaces' });

export const fetchChats = (token, spaceId) =>
  request(`/api/spaces/${spaceId}/chats`, { token, fallback: 'Could not load chats' });

export async function fetchMessages(token, chatId, before) {
  const params = new URLSearchParams({ chat_id: chatId });
  if (before) {
    params.set('before_at', before.createdAt);
    params.set('before_id', before.id);
  }
  const data = await request(`/api/messages?${params}`, { token, fallback: 'Could not load messages' });
  return { messages: (data.messages || []).map(mapServerMessage), hasMore: !!data.hasMore };
}

export const createSpace = (token, name, visibility) =>
  request('/api/spaces', { method: 'POST', token, body: { name, visibility }, fallback: 'Could not create space' });

export const createChat = (token, spaceId, name, type) =>
  request(`/api/spaces/${spaceId}/chats`, { method: 'POST', token, body: { name, type }, fallback: 'Could not create chat' });

export const acceptInvite = (token, code) =>
  request(`/api/invites/${encodeURIComponent(code)}/accept`, { method: 'POST', token, fallback: 'Could not join with that invite' });

export const deleteMessage = (token, messageId) =>
  request(`/api/messages/${encodeURIComponent(messageId)}`, { method: 'DELETE', token, fallback: 'Could not delete message' });


export async function uploadAttachment(token, chatId, file) {
  const res = await fetch(`${API_HOST}/api/chats/${chatId}/attachments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/octet-stream',
      'X-File-Name': encodeURIComponent(file.name),
      'X-File-Type': file.type || 'application/octet-stream'
    },
    body: file
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Could not upload attachment');
}
