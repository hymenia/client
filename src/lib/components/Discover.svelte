<script>
  import { API_HOST } from '$lib/config.js';
  import { auth } from '$lib/stores.js';
  import Search from '@lucide/svelte/icons/search';
  import { onMount } from 'svelte';

  let { onJoined } = $props();

  let spaces = $state([]);
  let query = $state('');
  let loading = $state(false);
  let error = $state('');
  let busyId = $state(null);

  let filtered = $derived(
    spaces.filter((s) => s.name.toLowerCase().includes(query.trim().toLowerCase()))
  );

  function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function ownerOf(space) {
    return space.owner_username ?? space.username ?? null;
  }

  async function load() {
    if (!$auth.token) return;
    error = '';
    loading = true;
    try {
      const res = await fetch(`${API_HOST}/api/spaces/discover`, {
        headers: { Authorization: `Bearer ${$auth.token}` }
      });
      const data = await res.json().catch(() => ([]));
      if (!res.ok) {
        error = data.error || 'Could not load spaces';
        return;
      }
      spaces = data;
    } catch (e) {
      error = 'Could not reach server';
    } finally {
      loading = false;
    }
  }

  async function join(space) {
    if (busyId) return;
    busyId = space.id;
    error = '';
    try {
      const res = await fetch(`${API_HOST}/api/spaces/${space.id}/join`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${$auth.token}` }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        error = data.error || 'Could not join space';
        return;
      }
      spaces = spaces.filter((s) => s.id !== space.id);
      onJoined?.(space);
    } catch (e) {
      error = 'Could not reach server';
    } finally {
      busyId = null;
    }
  }

  onMount(load);
</script>

<div class="discover">
  <div class="discover-heading">
    <h3>Discover spaces</h3>
  </div>

  <label class="admin-search-field discover-search">
    <Search size={16} />
    <input bind:value={query} aria-label="Search spaces" placeholder="Search public spaces" />
  </label>

  {#if error}
    <p class="err">{error}</p>
  {/if}

  {#if loading && spaces.length === 0}
    <p class="empty-item">Loading spaces...</p>
  {:else if filtered.length === 0}
    <p class="empty-item">{query ? 'No spaces match that search.' : 'No public spaces to join right now.'}</p>
  {:else}
    <div class="discover-list">
      {#each filtered as space (space.id)}
        <article class="discover-card">
          <div class="discover-info">
            <strong>{space.name}</strong>
            {#if space.description}
              <span class="discover-desc">{space.description}</span>
            {/if}
            <span class="admin-detail-muted">
              {#if space.member_count != null}
                {space.member_count} member{space.member_count === 1 ? '' : 's'} |
              {/if}
              {#if ownerOf(space)}
                by @{ownerOf(space)} |
              {/if}
              {formatDate(space.created_at)}
            </span>
          </div>
          <button
            type="button"
            class="theme-btn"
            onclick={() => join(space)}
            disabled={busyId === space.id}
          >
            {busyId === space.id ? 'Joining...' : 'Join'}
          </button>
        </article>
      {/each}
    </div>
  {/if}
</div>
