<script>
  import { API_HOST } from '$lib/config.js';
  import ArrowLeft from '@lucide/svelte/icons/arrow-left';

  let { width, members = [], loading = false, error = '', onOpenProfile, onBack } = $props();

  const ROLE_ORDER = { owner: 0, admin: 1, member: 2 }; // will have to change latee

  let sorted = $derived(
    [...members].sort((a, b) => {
      const byRole = (ROLE_ORDER[a.role] ?? 3) - (ROLE_ORDER[b.role] ?? 3);
      if (byRole !== 0) return byRole;
      return (a.display_name || a.username).localeCompare(b.display_name || b.username);
    })
  );

  function avatar(member) {
    return `${API_HOST}/api/avatar/${encodeURIComponent(member.username)}`;
  }
</script>

<aside class="col-chats" style:--col-width={`${width}px`}>
  <button type="button" class="mobile-back-btn" onclick={() => onBack?.()}>
    <ArrowLeft size={18} />
  </button>

  <p class="member-count">
    {members.length} member{members.length === 1 ? '' : 's'}
  </p>

  {#if error}
    <p class="dm-err">{error}</p>
  {/if}

  <ul class="dm-list">
    {#each sorted as member (member.id)}
      <li>
        <button type="button" class="dm-item" onclick={() => onOpenProfile?.(member)}>
          <img src={avatar(member)} alt="" class="dm-avatar" />
          <span class="member-name">{member.display_name || member.username}</span>
          {#if member.is_bot}
            <span class="member-tag">app</span>
          {:else if member.role === 'owner' || member.role === 'admin'}
            <span class="member-tag">{member.role}</span>
          {/if}
        </button>
      </li>
    {:else}
      <li class="dm-empty">{loading ? 'Loading members...' : 'No members'}</li>
    {/each}
  </ul>
</aside>
