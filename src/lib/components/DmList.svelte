<script>
  import { API_HOST } from '$lib/config.js';
  import ArrowLeft from '@lucide/svelte/icons/arrow-left';
  import Plus from '@lucide/svelte/icons/plus';
  import X from '@lucide/svelte/icons/x';
  import { tick } from 'svelte';

  let { width, dms = [], activeId = null, dmErr = '', onOpen, onStart, onBack } = $props();

  let username = $state('');
  let showNewDm = $state(false);

  function avatar(dm) {
    return `${API_HOST}/api/avatar/${encodeURIComponent(dm.username)}`;
  }

  async function start(e) {
    e.preventDefault();
    const name = username.trim();
    if (!name) return;
    await onStart?.(name);
    await tick();
    if (!dmErr) {
      showNewDm = false;
      username = '';
    }
  }
</script>

<aside class="col-chats" style:--col-width={`${width}px`}>
  <button type="button" class="mobile-back-btn" onclick={() => onBack?.()}>
    <ArrowLeft size={18} />
  </button>

  <button type="button" class="sidebar-new-btn" onclick={() => (showNewDm = true)}>
    <Plus size={16} />
    <span>New message</span>
  </button>

  {#if dmErr && !showNewDm}
    <p class="dm-err">{dmErr}</p>
  {/if}

  <ul class="dm-list">
    {#each dms as dm (dm.id)}
      <li>
        <button
          type="button"
          class="dm-item"
          class:active={dm.id === activeId}
          onclick={() => onOpen?.(dm)}
        >
          <img src={avatar(dm)} alt="" class="dm-avatar" />
          <span>{dm.display_name || dm.username}</span>
        </button>
      </li>
    {:else}
      <li class="dm-empty">No direct messages yet</li>
    {/each}
  </ul>
</aside>

{#if showNewDm}
  <div
    class="sidebar-dialog-backdrop"
    role="presentation"
    onclick={(event) => {
      if (event.target === event.currentTarget) showNewDm = false;
    }}
  >
    <div class="sidebar-dialog" role="dialog">
      <button type="button" class="close-btn" onclick={() => (showNewDm = false)}>
        <X size={20} />
      </button>
      <h2 class="sidebar-dialog-title">New message</h2>
      <form class="create-form" onsubmit={start}>
        <input type="text" bind:value={username} placeholder="Username" autocomplete="off" />
        <button type="submit"><Plus size={16} /></button>
      </form>
      {#if dmErr}
        <div class="empty-item err">{dmErr}</div>
      {/if}
    </div>
  </div>
{/if}