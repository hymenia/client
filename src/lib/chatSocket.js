import { WS_HOST } from './config.js';

let sock = null;
let retryTimer = null;
let closed = false;

export function socketOpen() {
  return !!sock && sock.readyState === WebSocket.OPEN;
}

export function socketSend(payload) {
  if (socketOpen()) sock.send(JSON.stringify(payload));
}

export function closeSocket() {
  closed = true;
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
  if (sock) {
    sock.close();
    sock = null;
  }
}

export function connectChatSocket(token, { onOpen, onMessage }) {
  if (!token) {
    closeSocket();
    return () => {};
  }
  closed = false;

  let attempt = 0;

  function open() {
    if (closed) return;
    const ws = new WebSocket(`${WS_HOST}/ws`, [token]);
    sock = ws;

    ws.onopen = () => {
      attempt = 0;
      onOpen?.();
    };
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data && data.sender && (data.content || data.attachments?.length)) {
          onMessage(data);
        }
      } catch {
        console.warn('Non-JSON or invalid WS message received:', event.data);
      }
    };
    ws.onerror = () => {};

    ws.onclose = () => {
      if (closed || sock !== ws) return;
      sock = null;
      const delay = Math.min(30000, 1000 * 2 ** attempt++);
      retryTimer = setTimeout(open, delay);
    };
  }

  open();

  return () => {
    closed = true;
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
    if (sock) {
      sock.close();
      sock = null;
    }
  };
}

export function joinTextChatRooms(chats, activeChatId) {
  for (const chat of chats) {
    if (chat.type === 'text') {
      socketSend({
        action: 'join_room',
        chat_id: chat.id,
        active: String(chat.id) === String(activeChatId)
      });
    }
  }
}

export function leaveTextChatRooms(chats) {
  for (const chat of chats) {
    if (chat.type === 'text') {
      socketSend({ action: 'leave_room', chat_id: chat.id });
    }
  }
}
