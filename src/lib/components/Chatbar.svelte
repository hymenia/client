<script>
  import Paperclip from '@lucide/svelte/icons/paperclip';
  import SendHorizontal from '@lucide/svelte/icons/send-horizontal';
  import X from '@lucide/svelte/icons/x';
  import MessageList from '$lib/components/MessageList.svelte';

  let {
    msgs = [],
    txt = $bindable(),
    replyingTo = $bindable(),
    avatarVersion = 0,
    box = $bindable(),
    enterToSend = true,
    chatId = null,
    hasOlder = false,
    loadingOlder = false,
    onLoadOlder = undefined,
    onSend = undefined,
    onAttach = undefined,
    onProfileClick = undefined,
    currentUsername = null,
    canDeleteAny = false,
    onDelete = undefined
  } = $props();

  let composerEl = $state(null);
  let fileInput = $state(null);
  let uploading = $state(false);
  let attachmentError = $state('');

  function handleSend() {
    onSend?.();
  }

  function handleKeyDown(event) {
    if (enterToSend && event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }

  function autoGrow() {
    if (!composerEl) return;
    composerEl.style.height = 'auto';
    composerEl.style.height = `${Math.min(composerEl.scrollHeight, 160)}px`;
  }

  async function handleFileChange(event) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file || !onAttach) return;
    uploading = true;
    attachmentError = '';
    try {
      await onAttach(file);
    } catch (error) {
      attachmentError = error.message || 'Could not upload attachment';
    } finally {
      uploading = false;
    }
  }

  $effect(() => {
    if (txt === '' && composerEl) composerEl.style.height = 'auto';
  });
</script>

<div class="chat-view">
  <MessageList
    {msgs}
    bind:box
    {avatarVersion}
    {chatId}
    {hasOlder}
    {loadingOlder}
    {onLoadOlder}
    {onProfileClick}
    {currentUsername}
    {canDeleteAny}
    {onDelete}
    onReply={(message) => (replyingTo = message)}
  />

  {#if replyingTo}
    <div class="reply-bar">
      <span class="reply-bar-label">
        Replying to <strong>{replyingTo.sender}</strong>: {replyingTo.content}
      </span>
      <button type="button" class="reply-bar-cancel" onclick={() => (replyingTo = null)}>
        <X size={14} />
      </button>
    </div>
  {/if}

  <form
    onsubmit={(event) => {
      event.preventDefault();
      handleSend();
    }}
  >
    <input bind:this={fileInput} type="file" hidden onchange={handleFileChange} />
    <button type="button" class="attachment-btn" title="Attach file" disabled={uploading} onclick={() => fileInput?.click()}>
      <Paperclip size={16} />
    </button>
    <textarea
      bind:value={txt}
      bind:this={composerEl}
      placeholder="Type a message"
      rows="1"
      onkeydown={handleKeyDown}
      oninput={autoGrow}
    ></textarea>
    <button type="submit"><SendHorizontal size={16} /></button>
  </form>
  {#if attachmentError}
    <div class="attachment-error">{attachmentError}</div>
  {/if}
</div>
