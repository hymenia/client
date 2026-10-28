<script>
  import EmojiPicker from '$lib/components/EmojiPicker.svelte';
  import { API_HOST } from '$lib/config.js';
  import { copyText } from '$lib/contextMenu.svelte.js';
  import { renderMarkdown } from '$lib/md.js';
  import { auth } from '$lib/stores.js';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import ChevronUp from '@lucide/svelte/icons/chevron-up';
  import Copy from '@lucide/svelte/icons/copy';
  import Ellipsis from '@lucide/svelte/icons/ellipsis';
  import Flag from '@lucide/svelte/icons/flag';
  import Paperclip from '@lucide/svelte/icons/paperclip';
  import Pencil from '@lucide/svelte/icons/pencil';
  import Reply from '@lucide/svelte/icons/reply';
  import SmilePlus from '@lucide/svelte/icons/smile-plus';
  import twemoji from '@twemoji/api';
  import { onDestroy } from 'svelte';

  let {
    msgs = [],
    box = $bindable(),
    avatarVersion = 0,
    chatId = null,
    hasOlder = false,
    loadingOlder = false,
    onLoadOlder = undefined,
    onProfileClick = undefined,
    onReply = undefined,
    onReport = undefined,
    onEdit = undefined,
    onReact = undefined,
    currentUsername = null,
    canDeleteAny = false,
    onDelete = undefined
  } = $props();

  const MENU_WIDTH = 176;

  let previewUrls = $state({});
  const loadingPreviewIds = new Set();
  let scrolledUp = $state(false);
  let contextMenu = $state(null);
  let editing = $state(null);
  let tappedId = $state(null);
  let picker = $state(null);
  let longPressTimer = null;
  let longPressTriggered = false;
  let longPressStart = null;

  onDestroy(() => {
    clearTimeout(longPressTimer);
    for (const url of Object.values(previewUrls)) URL.revokeObjectURL(url);
  });

  function onScroll() {
    if (!box) return;
    scrolledUp = box.scrollHeight - box.scrollTop - box.clientHeight > 80;
  }

  function backToBottom() {
    scrolledUp = false;
    box?.scrollTo({ top: box.scrollHeight, behavior: 'smooth' });
  }

  $effect(() => {
    chatId;
    scrolledUp = false;
    tappedId = null;
  });

  function avatarSrc(username, overrideUrl = null) {
    if (overrideUrl) return overrideUrl;
    if (!username) return '';
    return `${API_HOST}/api/avatar/${encodeURIComponent(username)}?v=${avatarVersion}`;
  }

  function showContextMenu(event, message) {
    if (!message.id) return;
    event.preventDefault();
    const canDelete = message.sender === currentUsername || canDeleteAny;
    const canReport = !!onReport && message.sender !== currentUsername && !message.senderIsApp;
    const canEdit = !!onEdit && message.sender === currentUsername && !message.senderIsApp;
    const items = 3 + (canDelete ? 1 : 0) + (canReport ? 1 : 0) + (canEdit ? 1 : 0) + (onReact ? 1 : 0); // reply + 2 copy items
    const height = 8 + 40 * items;
    contextMenu = {
      message,
      canDelete,
      canReport,
      canEdit,
      x: Math.max(8, Math.min(event.clientX, window.innerWidth - MENU_WIDTH)),
      y: Math.max(8, Math.min(event.clientY, window.innerHeight - height - 8)),
      error: ''
    };
  }

  function openMenuFromButton(event, message) {
    event.stopPropagation();
    if (contextMenu?.message === message) {
      contextMenu = null;
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    showContextMenu(
      { preventDefault() {}, clientX: rect.right - MENU_WIDTH, clientY: rect.bottom },
      message
    );
  }

  function startLongPress(event, message) {
    if (event.pointerType !== 'touch' || !message.id) return;
    clearTimeout(longPressTimer);
    longPressTriggered = false;
    longPressStart = { x: event.clientX, y: event.clientY };
    longPressTimer = setTimeout(() => {
      longPressTriggered = true;
      showContextMenu({ preventDefault() {}, clientX: longPressStart.x, clientY: longPressStart.y }, message);
    }, 500);
  }

  function moveLongPress(event) {
    if (!longPressStart || event.pointerType !== 'touch') return;
    if (Math.hypot(event.clientX - longPressStart.x, event.clientY - longPressStart.y) > 12) {
      cancelLongPress();
    }
  }

  function cancelLongPress() {
    clearTimeout(longPressTimer);
    longPressTimer = null;
    longPressStart = null;
  }

  function handleMessageClickCapture(event) {
    if (!longPressTriggered) return;
    longPressTriggered = false;
    event.preventDefault();
    event.stopPropagation();
  }

  function showKeyboardMenu(event, message) {
    if (event.key !== 'ContextMenu' && !(event.shiftKey && event.key === 'F10')) return;
    const rect = event.currentTarget.getBoundingClientRect();
    showContextMenu({ preventDefault() {}, clientX: rect.left, clientY: rect.bottom }, message);
  }

  const PICKER_WIDTH = 340;
  const PICKER_HEIGHT = 380;

  function placePicker(message, x, y) {
    picker = {
      message,
      x: Math.max(8, Math.min(x, window.innerWidth - PICKER_WIDTH - 8)),
      y: Math.max(8, Math.min(y, window.innerHeight - PICKER_HEIGHT - 8))
    };
  }

  function reactFromMenu() {
    const menu = contextMenu;
    contextMenu = null;
    if (menu) placePicker(menu.message, menu.x, menu.y);
  }

  function openPickerFromPill(event, message) {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    placePicker(message, rect.left, rect.bottom + 4);
  }

  function pickReaction(emoji) {
    const message = picker?.message;
    picker = null;
    if (message && emoji) onReact?.(message, emoji);
  }

  // reactions come from the server (validated but we escape anyway)
  function emojiHtml(emoji) {
    const safe = String(emoji).replace(/[&<>"']/g, '');
    return twemoji.parse(safe, { folder: 'svg', ext: '.svg', className: 'emoji' });
  }

  function replyFromMenu() {
    const message = contextMenu?.message;
    contextMenu = null;
    if (message) onReply?.(message);
  }

  function reportFromMenu() {
    const message = contextMenu?.message;
    contextMenu = null;
    if (message) onReport?.(message);
  }

  function startEdit() {
    const message = contextMenu?.message;
    contextMenu = null;
    if (!message) return;
    editing = { id: message.id, text: message.content ?? '', busy: false, error: '' };
  }

  function cancelEdit() {
    editing = null;
  }

  async function saveEdit() {
    if (!editing || editing.busy) return;
    const message = msgs.find((m) => m.id === editing.id);
    const text = editing.text.trim();
    if (!message) {
      editing = null;
      return;
    }
    if (!text) {
      editing.error = 'Message cannot be empty';
      return;
    }
    if (text === (message.content ?? '').trim()) {
      editing = null; // nothing changed
      return;
    }
    editing.busy = true;
    editing.error = '';
    try {
      await onEdit?.(message, text);
      if (editing?.id === message.id) editing = null;
    } catch (error) {
      if (editing) {
        editing.busy = false;
        editing.error = error.message || 'Could not edit message';
      }
    }
  }

  function editKeydown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      saveEdit();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      cancelEdit();
    }
  }

  async function deleteFromMenu() {
    if (!contextMenu?.message) return;
    try {
      await onDelete?.(contextMenu.message);
      contextMenu = null;
    } catch (error) {
      contextMenu = { ...contextMenu, error: error.message || 'Could not delete message' };
    }
  }

  function toggleTapped(event, message) {
    if (!message.id || !window.matchMedia('(hover: none)').matches) return;
    if (event.target.closest?.('button, a, textarea, input, video, audio')) return;
    tappedId = tappedId === message.id ? null : message.id;
  }

  function closeContextMenu(event) {
    if (event?.key && event.key !== 'Escape') return;
    if (event?.type === 'click' && !event.target?.closest?.('.msg')) tappedId = null;
    contextMenu = null;
    picker = null;
  }

  function copyUserId() {
    const id = contextMenu?.message?.userId;
    contextMenu = null;
    if (id) copyText(id);
  }

  function copyMessageText() {
    const text = contextMenu?.message?.content;
    contextMenu = null;
    if (text) copyText(text);
  }

  function isGroupedMessage(previous, current) {
    if (!previous || previous.sender !== current.sender) return false;
    if (previous.senderIsApp !== current.senderIsApp) return false;
    if (previous.senderDisplayName !== current.senderDisplayName) return false;
    if (previous.senderAvatarUrl !== current.senderAvatarUrl) return false;

    const previousTime = Date.parse(previous.createdAt || '');
    const currentTime = Date.parse(current.createdAt || '');
    return Number.isFinite(previousTime)
      && Number.isFinite(currentTime)
      && currentTime >= previousTime
      && currentTime - previousTime <= 5 * 60 * 1000;
  }

  function isAudioAttachment(attachment) {
    return attachment.mimeType?.startsWith('audio/') || attachment.mimeType === 'video/webm';
  }

  function isVideoAttachment(attachment) {
    return attachment.mimeType?.startsWith('video/') && !isAudioAttachment(attachment);
  }

  async function fetchAttachment(attachment) {
    const response = await fetch(`${API_HOST}${attachment.url}`, {
      headers: { Authorization: `Bearer ${$auth.token}` }
    });
    if (!response.ok) return null;
    return URL.createObjectURL(await response.blob());
  }

async function openAttachment(attachment) {
  const cached = previewUrls[attachment.id];
  const objectUrl = cached ?? (await fetchAttachment(attachment));
  if (!objectUrl) return;

  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = attachment.name || 'attachment';
  document.body.appendChild(link);
  link.click();
  link.remove();

  if (!cached) setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
}

  $effect(() => {
    for (const message of msgs) {
      for (const attachment of message.attachments || []) {
        const previewable = attachment.mimeType?.startsWith('image/') || isVideoAttachment(attachment) || isAudioAttachment(attachment);
        if (!previewable || previewUrls[attachment.id] || loadingPreviewIds.has(attachment.id)) continue;
        loadingPreviewIds.add(attachment.id);
        fetchAttachment(attachment).then((url) => {
          if (url) previewUrls = { ...previewUrls, [attachment.id]: url };
        }).finally(() => loadingPreviewIds.delete(attachment.id));
      }
    }
  });
</script>

<svelte:window onclick={closeContextMenu} onkeydown={closeContextMenu} onresize={closeContextMenu} onscroll={closeContextMenu} />

<div class="message-list" class:menu-open={!!contextMenu}>
  {#if scrolledUp}
    <div class="msg-nav-bar">
      {#if hasOlder}
        <button type="button" class="msg-nav-btn" onclick={() => onLoadOlder?.()} disabled={loadingOlder}>
          <ChevronUp size={14} />
          <span>{loadingOlder ? 'Loading...' : 'Load more messages'}</span>
        </button>
      {/if}
      <button type="button" class="msg-nav-btn" onclick={backToBottom}>
        <ChevronDown size={14} />
        <span>Back to bottom</span>
      </button>
    </div>
  {/if}
  <div class="list" bind:this={box} onscroll={onScroll}>
    {#each msgs as m, i (m.id || m.tempId || m.timestamp)}
      {@const grouped = isGroupedMessage(msgs[i - 1], m)}
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
      <div class="msg" class:msg-grouped={grouped} class:msg-tapped={tappedId === m.id} role="group" tabindex="0" onclick={(event) => toggleTapped(event, m)} oncontextmenu={(event) => showContextMenu(event, m)} onkeydown={(event) => showKeyboardMenu(event, m)} onpointerdown={(event) => startLongPress(event, m)} onpointermove={moveLongPress} onpointerup={cancelLongPress} onpointercancel={cancelLongPress} onpointerleave={cancelLongPress} onclickcapture={handleMessageClickCapture}>
        {#if grouped}
          <div class="msg-avatar-spacer" aria-hidden="true"></div>
        {:else}
          <button type="button" class="msg-avatar-button" onclick={() => onProfileClick?.(m.sender)}>
            <img src={avatarSrc(m.sender, m.senderAvatarUrl)} alt={m.senderDisplayName || m.sender} class="msg-avatar" />
          </button>
        {/if}
        <div class="msg-body">
          {#if m.replyToSender}
            <div class="msg-reply-quote">
              <span class="msg-reply-quote-sender">{m.replyToSender}</span>
              <span class="msg-reply-quote-content">{m.replyToContent}</span>
            </div>
          {/if}
          {#if !grouped}
            <div class="msg-header">
              <span class="msg-sender" title={m.sender}>{m.senderDisplayName || m.sender}</span>
              {#if m.senderIsApp}<span class="msg-app-badge">APP</span>{/if}
            </div>
          {/if}
          {#if editing?.id === m.id}
            <div class="msg-edit">
              <!-- svelte-ignore a11y_autofocus -->
              <textarea
                class="msg-edit-input"
                bind:value={editing.text}
                rows="2"
                autofocus
                onkeydown={editKeydown}
                onpointerdown={(event) => event.stopPropagation()}
              ></textarea>
              <div class="msg-edit-actions">
                <span class="msg-edit-hint">Enter to save | Esc to cancel</span>
                <button type="button" class="theme-btn" onclick={cancelEdit} disabled={editing.busy}>Cancel</button>
                <button type="button" class="theme-btn" onclick={saveEdit} disabled={editing.busy}>
                  {editing.busy ? 'Saving...' : 'Save'}
                </button>
              </div>
              {#if editing.error}<p class="err" role="alert">{editing.error}</p>{/if}
            </div>
          {:else}
            <div class="msg-content">{@html renderMarkdown(m.content)}{#if m.editedAt}<span class="msg-edited"> (edited)</span>{/if}</div>
          {/if}
          {#if m.attachments?.length}
            <div class="msg-attachments">
              {#each m.attachments as attachment}
                {#if attachment.mimeType?.startsWith('image/') && previewUrls[attachment.id]}
                  <img class="attachment-image-preview" src={previewUrls[attachment.id]} alt={attachment.name} />
                {:else if isVideoAttachment(attachment) && previewUrls[attachment.id]}
                  <!-- svelte-ignore a11y_media_has_caption -->
                  <video class="attachment-video-preview" src={previewUrls[attachment.id]} controls playsinline preload="metadata" aria-label={attachment.name}>
                    <a href={previewUrls[attachment.id]}>{attachment.name}</a>
                  </video>
                {:else if isAudioAttachment(attachment) && previewUrls[attachment.id]}
                  <audio class="attachment-audio-preview" src={previewUrls[attachment.id]} controls preload="metadata" aria-label={attachment.name}></audio>
                {/if}
                {#if !((attachment.mimeType?.startsWith('image/') || isVideoAttachment(attachment) || isAudioAttachment(attachment)) && previewUrls[attachment.id])}
                  <button type="button" class="msg-attachment" onclick={() => openAttachment(attachment)}>
                    <Paperclip size={14} />
                    <span>{attachment.name}</span>
                  </button>
                {/if}
              {/each}
            </div>
          {/if}
          {#if m.reactions?.length}
            <div class="msg-reactions">
              {#each m.reactions as r (r.emoji)}
                <button
                  type="button"
                  class="reaction"
                  class:reaction-mine={r.me}
                  aria-pressed={r.me}
                  aria-label={`${r.emoji} ${r.count}`}
                  onclick={() => onReact?.(m, r.emoji)}
                >
                  <span class="reaction-emoji">{@html emojiHtml(r.emoji)}</span>
                  <span class="reaction-count">{r.count}</span>
                </button>
              {/each}
              {#if onReact}
                <button
                  type="button"
                  class="reaction reaction-add"
                  aria-label="Add reaction"
                  onclick={(event) => openPickerFromPill(event, m)}
                >
                  <SmilePlus size={14} />
                </button>
              {/if}
            </div>
          {/if}
        </div>
        {#if m.id}
          <button
            type="button"
            class="msg-more"
            aria-label="Message actions"
            aria-haspopup="menu"
            onclick={(event) => openMenuFromButton(event, m)}
          >
            <Ellipsis size={16} />
          </button>
        {/if}
      </div>
    {/each}
  </div>
  {#if contextMenu}
    <!-- svelte-ignore a11y_interactive_supports_focus -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div
      class="message-context-menu"
      role="menu"
      style:--menu-x={`${contextMenu.x}px`}
      style:--menu-y={`${contextMenu.y}px`}
      onclick={(event) => event.stopPropagation()}
      oncontextmenu={(event) => event.preventDefault()}
    >
      {#if onReact}
        <button type="button" role="menuitem" onclick={reactFromMenu}>
          <SmilePlus size={14} />
          <span>Add reaction</span>
        </button>
      {/if}
      <button type="button" role="menuitem" onclick={replyFromMenu}>
        <Reply size={14} />
        <span>Reply</span>
      </button>
      {#if contextMenu.canEdit}
        <button type="button" role="menuitem" onclick={startEdit}>
          <Pencil size={14} />
          <span>Edit message</span>
        </button>
      {/if}
      <button type="button" role="menuitem" onclick={copyUserId}>
        <Copy size={14} />
        <span>Copy user ID</span>
      </button>
      <button type="button" role="menuitem" onclick={copyMessageText}>
        <Copy size={14} />
        <span>Copy text</span>
      </button>
      {#if contextMenu.canReport}
        <button type="button" role="menuitem" class="message-context-delete" onclick={reportFromMenu}>
          <Flag size={14} />
          <span>Report message</span>
        </button>
      {/if}
      {#if contextMenu.canDelete}
        <button type="button" role="menuitem" class="message-context-delete" onclick={deleteFromMenu}>
          <span>Delete message</span>
        </button>
      {/if}
      {#if contextMenu.error}<p role="alert">{contextMenu.error}</p>{/if}
    </div>
  {/if}
  {#if picker}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="reaction-picker"
      style:--picker-x={`${picker.x}px`}
      style:--picker-y={`${picker.y}px`}
      onclick={(event) => event.stopPropagation()}
    >
      <EmojiPicker onPick={pickReaction} onClose={() => (picker = null)} />
    </div>
  {/if}
</div>