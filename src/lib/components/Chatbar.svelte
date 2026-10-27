<script>
  import EmojiPicker from '$lib/components/EmojiPicker.svelte';
  import EmojiSuggest from '$lib/components/EmojiSuggest.svelte';
  import MessageList from '$lib/components/MessageList.svelte';
  import Paperclip from '@lucide/svelte/icons/paperclip';
  import SendHorizontal from '@lucide/svelte/icons/send-horizontal';
  import Smile from '@lucide/svelte/icons/smile';
  import X from '@lucide/svelte/icons/x';
  import { tick } from 'svelte';

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
    onDelete = undefined,
    onEdit = undefined,
    onReport = undefined,
    onReact = undefined,
    emailVerified = true,
    chatError = ''
  } = $props();

  let composerEl = $state(null);
  let fileInput = $state(null);
  let uploading = $state(false);
  let attachmentError = $state('');
  let suggestKey = $state(null);
  let caret = $state(0);

  let showEmoji = $state(false);

  function updateCaret(e) {
    caret = e.currentTarget.selectionStart ?? 0;
  }

  async function onAccept(newText, newCaret) {
    txt = newText;
    await tick();
    autoGrow();
    composerEl?.focus();
    composerEl?.setSelectionRange(newCaret, newCaret);
    caret = newCaret;
  }

  async function insertEmoji(emoji) {
    const el = composerEl;
    const start = el?.selectionStart ?? txt.length;
    const end = el?.selectionEnd ?? txt.length;
    txt = txt.slice(0, start) + emoji + txt.slice(end);
    await tick();
    el?.focus();
    el?.setSelectionRange(start + emoji.length, start + emoji.length);
  }

  function handleSend() {
    if (!emailVerified) return;
    onSend?.();
  }

  function handleKeyDown(event) {
    if (suggestKey?.(event)) {
      event.preventDefault();
      return;
    }
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
    {onEdit}
    {onReport}
    {onReact}
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
    <button
      type="button"
      class="attachment-btn"
      title={!emailVerified ? 'Please verify your email to attach files' : 'Attach file'}
      disabled={uploading || !emailVerified}
      onclick={() => fileInput?.click()}
    >
      <Paperclip size={16} />
    </button>

    <div class="composer-field">
      <EmojiSuggest bind:keyHandler={suggestKey} text={txt} {caret} {onAccept} />
      <textarea
        bind:value={txt}
        bind:this={composerEl}
        placeholder={!emailVerified ? 'Please verify your email address to send messages' : 'Type a message'}
        disabled={!emailVerified}
        rows="1"
        onkeydown={handleKeyDown}
        oninput={(e) => {
          autoGrow();
          updateCaret(e);
        }}
        onclick={updateCaret}
        onkeyup={updateCaret}
      ></textarea>
    </div>

    <div class="composer-emoji">
      <button
        type="button"
        class="emoji-toggle attachment-btn"
        disabled={!emailVerified}
        onclick={() => (showEmoji = !showEmoji)}
      >
        <Smile size={18} />
      </button>
      {#if showEmoji}
        <div class="emoji-popover">
          <EmojiPicker onPick={insertEmoji} onClose={() => (showEmoji = false)} />
        </div>
      {/if}
    </div>
    <button type="submit" disabled={!emailVerified || !txt.trim()}><SendHorizontal size={16} /></button>
  </form>
  {#if chatError}
    <div class="chat-bar-error">{chatError}</div>
  {/if}
  {#if attachmentError}
    <div class="attachment-error">{attachmentError}</div>
  {/if}
</div>