<script>
  import { API_HOST } from '$lib/config.js';
  import { copyText } from '$lib/contextMenu.svelte.js';
  import { renderMarkdown } from '$lib/md.js';
  import { auth } from '$lib/stores.js';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import ChevronUp from '@lucide/svelte/icons/chevron-up';
  import Copy from '@lucide/svelte/icons/copy';
  import Paperclip from '@lucide/svelte/icons/paperclip';
  import Reply from '@lucide/svelte/icons/reply';
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
    currentUsername = null,
    canDeleteAny = false,
    onDelete = undefined
  } = $props();

  let previewUrls = $state({});
  const loadingPreviewIds = new Set();
  let scrolledUp = $state(false);
  let contextMenu = $state(null);
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
       const height = 8 + 40 * (canDelete ? 3 : 2);
    contextMenu = {
      message,
      canDelete,
      x: Math.max(8, Math.min(event.clientX, window.innerWidth - 176)),
      y: Math.max(8, Math.min(event.clientY, window.innerHeight - height - 8)),
      error: ''
    };
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

  function replyFromMenu() {
    const message = contextMenu?.message;
    contextMenu = null;
    if (message) onReply?.(message);
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

  function closeContextMenu(event) {
    if (event?.key && event.key !== 'Escape') return;
    contextMenu = null;
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
    const objectUrl = await fetchAttachment(attachment);
    if (!objectUrl) return;
    window.open(objectUrl, '_blank', 'noopener,noreferrer');
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

<div class="message-list">
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
      <div class="msg" class:msg-grouped={grouped} role="group" tabindex="0" oncontextmenu={(event) => showContextMenu(event, m)} onkeydown={(event) => showKeyboardMenu(event, m)} onpointerdown={(event) => startLongPress(event, m)} onpointermove={moveLongPress} onpointerup={cancelLongPress} onpointercancel={cancelLongPress} onpointerleave={cancelLongPress} onclickcapture={handleMessageClickCapture}>
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
          <div class="msg-content">{@html renderMarkdown(m.content)}</div>
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
        </div>
      </div>
    {/each}
  </div>
  {#if contextMenu}
    <!-- svelte-ignore a11y_interactive_supports_focus -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div
      class="message-context-menu"
      role="menu"
      style:left={`${contextMenu.x}px`}
      style:top={`${contextMenu.y}px`}
      onclick={(event) => event.stopPropagation()}
      oncontextmenu={(event) => event.preventDefault()}
    >
      <button type="button" role="menuitem" onclick={replyFromMenu}>
        <Reply size={14} />
        <span>Reply</span>
      </button>
      {#if contextMenu.canDelete}
        <button type="button" role="menuitem" class="message-context-delete" onclick={deleteFromMenu}>
          <span>Delete message</span>
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
      {#if contextMenu.error}<p role="alert">{contextMenu.error}</p>{/if}
    </div>
  {/if}
</div>
