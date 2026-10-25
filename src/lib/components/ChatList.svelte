<script>
  import Hash from '@lucide/svelte/icons/hash';
import Mic from '@lucide/svelte/icons/mic';
import Plus from '@lucide/svelte/icons/plus';
import ArrowLeft from '@lucide/svelte/icons/arrow-left';
import X from '@lucide/svelte/icons/x';
  import { chats as chatsStore } from '$lib/stores.js';

  let {
    width = 190,
    selectedChatId = null,
    voiceChatId = null,
    unreadCounts = {},
    canManageSpace = false,
    spaceSelected = false,
    createErr = '',
    onChatClick,
    onCreateChat,
    onBack,
    newChatName = $bindable(''),
    newChatType = $bindable('text')
  } = $props();

  let showNewChat = $state(false);
</script>

<aside class="col-chats" style:--col-width={`${width}px`}>
  <button type="button" class="mobile-back-btn" onclick={onBack}>
    <ArrowLeft size={18} />
  </button>
  {#if canManageSpace}
    <button type="button" class="sidebar-new-btn" disabled={!spaceSelected} onclick={() => (showNewChat = true)}>
      <Plus size={16} />
      <span>New chat</span>
    </button>
  {/if}
  {#each $chatsStore as chat}
    <button
      type="button"
      class="chat-item"
      class:active={selectedChatId === chat.id || (chat.type === 'voice' && voiceChatId === chat.id)}
      onclick={() => onChatClick(chat)}
    >
      {#if chat.type === 'voice'}
        <Mic size={14} class="text-marker" />
      {:else}
        <Hash size={14} class="text-marker" />
      {/if}
      <span class="chat-name">{chat.name}</span>
      {#if unreadCounts[chat.id]}
        <span class="unread-badge">
          {unreadCounts[chat.id] > 99 ? '99+' : unreadCounts[chat.id]}
        </span>
      {/if}
      {#if chat.type === 'voice' && voiceChatId === chat.id}
        <span class="voice-joined-marker">Connected</span>
      {/if}
    </button>
  {/each}
  {#if $chatsStore.length === 0}
    <div class="empty-item">No chats</div>
  {/if}
</aside>

{#if showNewChat}
  <div class="sidebar-dialog-backdrop" role="presentation" onclick={(event) => { if (event.target === event.currentTarget) showNewChat = false; }}>
    <div class="sidebar-dialog" role="dialog">
      <button type="button" class="close-btn" onclick={() => (showNewChat = false)}>
        <X size={20} />
      </button>
      <h2 class="sidebar-dialog-title">Create a chat</h2>
      <form class="create-form" onsubmit={(e) => { e.preventDefault(); onCreateChat(); }}>
        <input bind:value={newChatName} maxlength="80" placeholder="Chat name" disabled={!spaceSelected} />
        <select bind:value={newChatType} disabled={!spaceSelected}>
          <option value="text">Text</option>
          <option value="voice">Voice</option>
        </select>
        <button type="submit" disabled={!spaceSelected}><Plus size={16} /></button>
      </form>
      {#if createErr}
        <div class="empty-item err">{createErr}</div>
      {/if}
    </div>
  </div>
{/if}
