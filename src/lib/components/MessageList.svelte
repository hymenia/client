<script>
  import { API_HOST } from '$lib/config.js';
  import { renderMarkdown } from '$lib/md.js';
  import { auth } from '$lib/stores.js';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import ChevronUp from '@lucide/svelte/icons/chevron-up';
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
    onReply = undefined
  } = $props();

  let previewUrls = $state({});
  const loadingPreviewIds = new Set();
  let scrolledUp = $state(false);

  onDestroy(() => {
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

  function avatarSrc(username) {
    if (!username) return '';
    return `${API_HOST}/api/avatar/${encodeURIComponent(username)}?v=${avatarVersion}`;
  }

  function isGroupedMessage(previous, current) {
    if (!previous || previous.sender !== current.sender) return false;
    if (previous.senderIsApp !== current.senderIsApp) return false;
    if (previous.senderDisplayName !== current.senderDisplayName) return false;

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
      <div class="msg" class:msg-grouped={grouped}>
        {#if grouped}
          <div class="msg-avatar-spacer" aria-hidden="true"></div>
        {:else}
          <button type="button" class="msg-avatar-button" onclick={() => onProfileClick?.(m.sender)}>
            <img src={avatarSrc(m.sender)} alt={m.sender} class="msg-avatar" />
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
        <button type="button" class="msg-reply-btn" title="Reply" onclick={() => onReply?.(m)} disabled={!m.id}>
          <Reply size={14} />
        </button>
      </div>
    {/each}
  </div>
</div>
