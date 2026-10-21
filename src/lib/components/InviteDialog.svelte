<script>
  import { auth } from '$lib/stores.js';
  import { API_HOST } from '$lib/config.js';
  import X from '@lucide/svelte/icons/x';
import Copy from '@lucide/svelte/icons/copy';
import Trash2 from '@lucide/svelte/icons/trash-2';
import UserPlus from '@lucide/svelte/icons/user-plus';

  let { show = $bindable(), spaceId = undefined, spaceRole = undefined } = $props();

  let inviteLinks = $state([]);
  let inviteErr = $state('');
  let inviteRole = $state('member');
  let inviteMaxUses = $state('');
  let inviteExpiresHours = $state('');
  let inviteCopiedId = $state(null);

  let apps = $state([]);
  let addAppErr = $state('');
  let addAppSuccess = $state('');

  function inviteUrl(code) {
    if (typeof window === 'undefined') return code;
    return `${window.location.origin}/invite/${code}`;
  }

  async function loadInvites() {
    if (!spaceId) return;
    try {
      const res = await fetch(`${API_HOST}/api/spaces/${spaceId}/invites`, {
        headers: { Authorization: `Bearer ${$auth.token}` }
      });
      if (res.ok) inviteLinks = await res.json();
    } catch (e) {
      console.error('failed to load invites', e);
    }
  }

  async function loadApps() {
    try {
      const res = await fetch(`${API_HOST}/api/apps`, {
        headers: { Authorization: `Bearer ${$auth.token}` }
      });
      if (res.ok) apps = await res.json();
    } catch (e) {
      console.error('failed to load apps', e);
    }
  }

  $effect(() => {
    if (show) {
      inviteErr = '';
      addAppErr = '';
      addAppSuccess = '';
      loadInvites();
      loadApps();
    }
  });

  async function createInvite() {
    inviteErr = '';
    const body = { role: inviteRole };
    if (inviteMaxUses) body.maxUses = Number(inviteMaxUses);
    if (inviteExpiresHours) body.expiresInHours = Number(inviteExpiresHours);

    try {
      const res = await fetch(`${API_HOST}/api/spaces/${spaceId}/invites`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', Authorization: `Bearer ${$auth.token}` },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) {
        inviteErr = data.error || 'Could not create invite';
        return;
      }
      inviteMaxUses = '';
      inviteExpiresHours = '';
      await loadInvites();
    } catch (e) {
      inviteErr = 'Could not reach server';
    }
  }

  async function revokeInvite(id) {
    try {
      await fetch(`${API_HOST}/api/spaces/${spaceId}/invites/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${$auth.token}` }
      });
      await loadInvites();
    } catch (e) {
      console.error('failed to revoke invite', e);
    }
  }

  async function copyInviteLink(inv) {
    try {
      await navigator.clipboard.writeText(inviteUrl(inv.code));
      inviteCopiedId = inv.id;
      setTimeout(() => { if (inviteCopiedId === inv.id) inviteCopiedId = null; }, 1500);
    } catch (e) {
      console.error('clipboard write failed', e);
    }
  }

  async function addAppToSpace(app) {
    addAppErr = '';
    addAppSuccess = '';
    try {
      const res = await fetch(`${API_HOST}/api/spaces/${spaceId}/members`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', Authorization: `Bearer ${$auth.token}` },
        body: JSON.stringify({ username: app.username, role: 'member' })
      });
      const data = await res.json();
      if (!res.ok) {
        addAppErr = data.error || 'Could not add app to this space';
        return;
      }
      addAppSuccess = `${app.username} added to this space`;
    } catch (e) {
      addAppErr = 'Could not reach server';
    }
  }
</script>

{#if show}
  <div class="settings-backdrop" role="dialog">
    <div class="settings-modal invite-modal">
      <section class="settings-content">
        <button type="button" class="close-btn" onclick={() => show = false}>
          <X size={20} />
        </button>
        <div class="settings-inner-body">
          <h3>Invite people</h3>
          <p class="invite-subtitle">Anyone with the link can join this space.</p>

          <form class="invite-create-row" onsubmit={(e) => { e.preventDefault(); createInvite(); }}>
            <select bind:value={inviteRole}>
              <option value="member">Member</option>
              {#if spaceRole === 'owner'}
                <option value="admin">Admin</option>
              {/if}
            </select>
            <input type="number" min="1" bind:value={inviteMaxUses} placeholder="Max uses (optional)" />
            <input type="number" min="1" bind:value={inviteExpiresHours} placeholder="Expires in hours (optional)" />
            <button type="submit" class="theme-btn">Create link</button>
          </form>
          {#if inviteErr}
            <p class="err">{inviteErr}</p>
          {/if}

          <div class="invite-list">
            {#each inviteLinks as inv (inv.id)}
              <div class="invite-row">
                <span class="invite-code">{inviteUrl(inv.code)}</span>
                <span class="invite-meta">
                  {inv.role}{#if inv.max_uses} | {inv.uses_count}/{inv.max_uses} uses{/if}{#if inv.expires_at} | expires {new Date(inv.expires_at).toLocaleString()}{/if}
                </span>
                <button type="button" class="theme-btn" onclick={() => copyInviteLink(inv)}>
                  <Copy size={14} /> {inviteCopiedId === inv.id ? 'Copied!' : 'Copy'}
                </button>
                <button type="button" class="theme-btn delete-btn icon-btn" onclick={() => revokeInvite(inv.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            {/each}
            {#if inviteLinks.length === 0}
              <p class="empty-item">No active invites</p>
            {/if}
          </div>

          <div class="invite-apps-section">
            <h4>Add a app</h4>
            <p class="invite-subtitle">You need to add the app directly.</p>
            {#if addAppErr}
              <p class="err">{addAppErr}</p>
            {/if}
            {#if addAppSuccess}
              <p class="info">{addAppSuccess}</p>
            {/if}
            <div class="app-list">
              {#each apps as app (app.id)}
                <div class="app-row">
                  <span class="app-name">{app.username}</span>
                  <button type="button" class="theme-btn" onclick={() => addAppToSpace(app)}>
                    <UserPlus size={14} /> Add to space
                  </button>
                </div>
              {/each}
              {#if apps.length === 0}
                <p class="empty-item">You haven't created any apps yet. Do that in Settings -> Developer.</p>
              {/if}
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
{/if}
