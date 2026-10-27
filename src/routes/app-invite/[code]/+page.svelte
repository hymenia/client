<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { auth } from '$lib/stores.js';
  import { API_HOST } from '$lib/config.js';

  let code = $derived($page.params.code);

  let loading = $state(true);
  let notFound = $state(false);
  let app = $state(null);
  let manageableSpaces = $state([]);
  let selectedSpaceId = $state('');
  let submitting = $state(false);
  let err = $state('');
  let success = $state(null);

  async function loadInvite() {
    loading = true;
    notFound = false;
    err = '';
    try {
      const res = await fetch(`${API_HOST}/api/applications/${encodeURIComponent(code)}`, {
        headers: { Authorization: `Bearer ${$auth.token}` }
      });
      if (!res.ok) {
        notFound = true;
        return;
      }
      const data = await res.json();
      app = data.app;

      const spacesRes = await fetch(`${API_HOST}/api/spaces`, {
        headers: { Authorization: `Bearer ${$auth.token}` }
      });
      if (spacesRes.ok) {
        const spaces = await spacesRes.json();
        manageableSpaces = spaces.filter((s) => s.role === 'owner' || s.role === 'admin');
        if (manageableSpaces.length > 0) {
          selectedSpaceId = manageableSpaces[0].id;
        }
      }
    } catch (e) {
      err = 'Could not reach server';
    } finally {
      loading = false;
    }
  }

  async function acceptInvite() {
    if (!selectedSpaceId) return;
    err = '';
    submitting = true;
    try {
      const res = await fetch(`${API_HOST}/api/applications/${encodeURIComponent(code)}/accept`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', Authorization: `Bearer ${$auth.token}` },
        body: JSON.stringify({ spaceId: selectedSpaceId })
      });
      const data = await res.json();
      if (!res.ok) {
        err = data.error || 'Could not add app to that space';
        return;
      }
      success = { appUsername: data.appUsername, spaceName: data.spaceName };
    } catch (e) {
      err = 'Could not reach server';
    } finally {
      submitting = false;
    }
  }

  onMount(() => {
    if (!$auth.token) {
      goto('/login');
      return;
    }
    loadInvite();
  });
</script>

<div class="invite-page">
  <div class="invite-card">
    <img src="/wordmark.svg" alt="Wordmark" />
    {#if loading}
      <p>Loading invite...</p>
    {:else if notFound}
      <div class="setting-block">
        <h3>Invite not found</h3>
        <p>This app invite link doesn't exist or has been revoked.</p>
      </div>
      <button type="button" class="theme-btn" onclick={() => goto('/')}>Back to app</button>
    {:else if success}
      <div class="setting-block">
        <h3>Done!</h3>
        <p class="success"><strong>{success.appUsername}</strong> was added to <strong>{success.spaceName}</strong>.</p>
      </div>
      <button type="button" class="theme-btn" onclick={() => goto('/')}>Back to app</button>
    {:else}
      <div class="setting-block">
        <h3>Add a app</h3>
        <p><strong>{app?.username}</strong> wants to join one of your spaces.</p>
      </div>

      {#if manageableSpaces.length === 0}
        <p class="empty-item">You don't own or admin any spaces yet, so there's nowhere to add this app. Create a space first.</p>
        <button type="button" class="theme-btn" onclick={() => goto('/')}>Back to app</button>
      {:else}
        <div class="form-group">
          <label for="space-select">Choose a space</label>
          <div class="invite-create-row">
            <select id="space-select" bind:value={selectedSpaceId}>
              {#each manageableSpaces as space}
                <option value={space.id}>{space.name} ({space.role})</option>
              {/each}
            </select>
          </div>
        </div>

        {#if err}
          <p class="error">{err}</p>
        {/if}

        <button type="button" class="theme-btn" onclick={acceptInvite} disabled={submitting}>
          {submitting ? 'Adding...' : `Add ${app?.username} to this space`}
        </button>
      {/if}
    {/if}
  </div>
</div>
