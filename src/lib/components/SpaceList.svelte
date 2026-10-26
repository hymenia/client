<script>
  import { spaces as spacesStore } from '$lib/stores.js';
  import Compass from '@lucide/svelte/icons/compass';
  import Globe from '@lucide/svelte/icons/globe';
  import Lock from '@lucide/svelte/icons/lock';
  import Mail from '@lucide/svelte/icons/mail';
  import Plus from '@lucide/svelte/icons/plus';
  import X from '@lucide/svelte/icons/x';
  import Discover from './Discover.svelte';

  let {
    width = 140,
    selectedSpaceId = null,
    dmActive = false,
    createErr = '',
    joinErr = '',
    joinSuccess = '',
    onSpaceClick,
    onDmClick,
    onCreateSpace,
    onJoin,
    onSpaceJoined,
    newSpaceName = $bindable(''),
    newSpaceVisibility = $bindable('private'),
    joinCode = $bindable(''),
    emailVerified = true
  } = $props();

  let showNewSpace = $state(false);
  let showDiscover = $state(false);

  function handleJoined(space) {
    showDiscover = false;
    onSpaceJoined?.(space);
  }
</script>

<aside class="col-spaces" style:--col-width={`${width}px`}>
  <button
    type="button"
    class="space-item dm-item-entry"
    class:active={dmActive}
    onclick={() => onDmClick?.()}
  >
    <Mail size={16} />
    <span class="space-name">Messages</span>
  </button>

  <button
    type="button"
    class="space-item dm-item-entry"
    class:active={showDiscover}
    onclick={() => (showDiscover = true)}
  >
    <Compass size={16} />
    <span class="space-name">Discover</span>
  </button>

  <button type="button" class="sidebar-new-btn" onclick={() => (showNewSpace = true)}>
    <Plus size={16} />
    <span>New space</span>
  </button>

  {#each $spacesStore as space}
    <button
      type="button"
      class="space-item"
      class:active={!dmActive && selectedSpaceId === space.id}
      onclick={() => onSpaceClick(space.id)}
    >
      <span class="space-name">{space.name}</span>
      {#if space.visibility === 'private'}
        <Lock size={14} class="space-visibility-marker" />
      {:else}
        <Globe size={14} class="space-visibility-marker" />
      {/if}
    </button>
  {/each}

  {#if $spacesStore.length === 0}
    <div class="empty-item">No spaces</div>
  {/if}
</aside>

{#if showNewSpace}
  <div
    class="sidebar-dialog-backdrop"
    role="presentation"
    onclick={(event) => {
      if (event.target === event.currentTarget) showNewSpace = false;
    }}
  >
    <div class="sidebar-dialog" role="dialog">
      <button type="button" class="close-btn" onclick={() => (showNewSpace = false)}>
        <X size={20} />
      </button>

      <h2 class="sidebar-dialog-title">Create a space</h2>
      <form
        class="create-form"
        onsubmit={(e) => {
          e.preventDefault();
          onCreateSpace();
        }}
      >
        <input bind:value={newSpaceName} maxlength="80" placeholder="Space name" />
        <select bind:value={newSpaceVisibility}>
          <option value="private">Private</option>
          <option value="public">Public</option>
        </select>
        <button type="submit"><Plus size={16} /></button>
      </form>
      {#if createErr}<div class="empty-item err">{createErr}</div>{/if}

      <h2 class="sidebar-dialog-title">Join a space</h2>
      <form
        class="create-form"
        onsubmit={(e) => {
          e.preventDefault();
          onJoin();
        }}
      >
        <input bind:value={joinCode} placeholder="Invite code" />
        <button type="submit"><Plus size={16} /></button>
      </form>
      {#if joinErr}<div class="empty-item err">{joinErr}</div>{/if}
      {#if joinSuccess}<div class="empty-item info">{joinSuccess}</div>{/if}
    </div>
  </div>
{/if}

{#if showDiscover}
  <div
    class="sidebar-dialog-backdrop"
    role="presentation"
    onclick={(event) => {
      if (event.target === event.currentTarget) showDiscover = false;
    }}
  >
    <div class="sidebar-dialog" role="dialog">
      <button type="button" class="close-btn" onclick={() => (showDiscover = false)}>
        <X size={20} />
      </button>
      <Discover onJoined={handleJoined} />
    </div>
  </div>
{/if}