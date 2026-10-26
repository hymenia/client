<script>
  import { goto } from '$app/navigation';
  import { API_HOST } from '$lib/config.js';
  import { auth } from '$lib/stores.js';
  import Search from '@lucide/svelte/icons/search';
  import { onMount } from 'svelte';

  const PAGE_SIZE = 50;
  const ROLES = ['admin', 'verified', 'developer'];

  let users = $state([]);
  let total = $state(0);
  let summary = $state({ total: 0, verified: 0, apps: 0, admins: 0 });
  let query = $state('');
  let loading = $state(false);
  let error = $state('');
  let busyUserId = $state(null);

  function hasRole(user, role) {
    return (user.global_roles || []).includes(role);
  }

  function avatarSrc(username) {
    return `${API_HOST}/api/avatar/${encodeURIComponent(username)}`;
  }

  function formatDate(value) {
    if (!value) return 'Never';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Unknown';
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  async function loadUsers(reset = false) {
    if (!$auth.token) return;
    if (reset) users = [];
    error = '';
    loading = true;
    try {
      const params = new URLSearchParams({
        query,
        limit: String(PAGE_SIZE),
        offset: String(reset ? 0 : users.length)
      });
      const res = await fetch(`${API_HOST}/api/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${$auth.token}` }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        error = data.error || 'Could not load users';
        return;
      }
      users = reset ? data.users || [] : [...users, ...(data.users || [])];
      total = data.total || 0;
      if (data.summary) summary = data.summary;
    } catch (e) {
      error = 'Could not reach server';
    } finally {
      loading = false;
    }
  }

  function search(event) {
    event.preventDefault();
    loadUsers(true);
  }

  async function setRole(user, role, enabled) {
    if (busyUserId || user.is_bot) return;
    const previousRoles = user.global_roles || [];
    const nextRoles = new Set(previousRoles);
    if (enabled) nextRoles.add(role);
    else nextRoles.delete(role);
    const roles = [...nextRoles];

    busyUserId = user.id;
    error = '';
    users = users.map((item) => (
      item.id === user.id ? { ...item, global_roles: roles } : item
    ));

    try {
      const res = await fetch(`${API_HOST}/api/admin/users/${user.id}/roles`, {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          Authorization: `Bearer ${$auth.token}`
        },
        body: JSON.stringify({ roles })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        users = users.map((item) => (
          item.id === user.id ? { ...item, global_roles: previousRoles } : item
        ));
        error = data.error || 'Could not update roles';
        return;
      }

      const wasAdmin = previousRoles.includes('admin');
      const isAdmin = roles.includes('admin');
      if (wasAdmin !== isAdmin) {
        summary = {
          ...summary,
          admins: Math.max(0, summary.admins + (isAdmin ? 1 : -1))
        };
      }
    } catch (e) {
      users = users.map((item) => (
        item.id === user.id ? { ...item, global_roles: previousRoles } : item
      ));
      error = 'Could not reach server';
    } finally {
      busyUserId = null;
    }
  }

  async function deleteUser(user) {
    if (busyUserId || user.is_instance_owner) return;
    const self = user.id === $auth.user?.id;
    const label = user.display_name || user.username;
    const kind = user.is_bot ? 'app' : 'user';
    const prompt = self
      ? `Delete your own account ${label} (@${user.username})? You will be signed out and this cannot be undone.`
      : `Delete ${kind} ${label} (@${user.username})? This cannot be undone.`;
    if (!confirm(prompt)) return;

    busyUserId = user.id;
    error = '';
    try {
      const res = await fetch(`${API_HOST}/api/admin/users/${user.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${$auth.token}` }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        error = data.error || `Could not delete ${kind}`;
        return;
      }

      if (self) {
        auth.set({ user: null, token: null });
        goto('/login');
        return;
      }

      users = users.filter((item) => item.id !== user.id);
      total = Math.max(0, total - 1);
      summary = {
        ...summary,
        total: Math.max(0, summary.total - 1),
        verified: Math.max(0, summary.verified - (user.email_verified ? 1 : 0)),
        apps: Math.max(0, summary.apps - (user.is_bot ? 1 : 0)),
        admins: Math.max(0, summary.admins - (hasRole(user, 'admin') ? 1 : 0))
      };
    } catch (e) {
      error = 'Could not reach server';
    } finally {
      busyUserId = null;
    }
  }

  onMount(() => {
    loadUsers(true);
  });
</script>

<div class="admin-users">
  <div class="admin-users-heading">
    <div>
      <h3>Registered users</h3>
    </div>
    <button type="button" class="theme-btn" onclick={() => loadUsers(true)} disabled={loading}>
      Refresh
    </button>
  </div>

  <div class="admin-summary">
    <span><strong>{summary.total}</strong> total</span>
    <span><strong>{summary.verified}</strong> verified</span>
    <span><strong>{summary.admins}</strong> admins</span>
    <span><strong>{summary.apps}</strong> apps</span>
  </div>

  <form class="admin-search" onsubmit={search}>
    <label class="admin-search-field">
      <Search size={16} />
      <input bind:value={query} aria-label="Search users" placeholder="Search username, display name or email" />
    </label>
    <button type="submit" class="theme-btn" disabled={loading}>Search</button>
  </form>

  {#if error}
    <p class="err">{error}</p>
  {/if}

  {#if loading && users.length === 0}
    <p class="empty-item">Loading users...</p>
  {:else if users.length === 0}
    <p class="empty-item">{query ? 'No users match that search.' : 'No registered users yet.'}</p>
  {:else}
    <p class="admin-users-count">
      Showing {users.length} of {total}
    </p>

    <div class="admin-user-list">
      {#each users as user (user.id)}
        <article class="admin-user-row">
          <img class="admin-user-avatar" src={avatarSrc(user.username)} alt="" />

          <div class="admin-user-main">
            <div class="admin-user-title">
              <strong>{user.display_name || user.username}</strong>
              <span class="admin-user-handle">@{user.username}</span>
              {#if user.is_bot}
                <span class="admin-user-roles">| app</span>
              {/if}
            </div>

            <div class="admin-user-details">
              {#if user.email}
                <span>{user.email}</span>
                <span class:admin-detail-ok={user.email_verified} class:admin-detail-warn={!user.email_verified}>
                  {user.email_verified ? 'verified' : 'unverified'}
                </span>
              {:else}
                <span class="admin-detail-muted">no email</span>
              {/if}
              {#if user.app_owner_username}
                <span>owned by @{user.app_owner_username}</span>
              {/if}
              {#if user.passkey_count > 0}
                <span>{user.passkey_count} passkey{user.passkey_count === 1 ? '' : 's'}</span>
              {/if}
            </div>

            <div class="admin-user-actions">
              {#if !user.is_bot}
                {#each ROLES as role}
                  <label
                    class="admin-role-toggle"
                    title={role === 'admin' && user.id === $auth.user?.id ? 'You cannot remove your own admin role' : null}
                  >
                    <input
                      type="checkbox"
                      checked={hasRole(user, role)}
                      disabled={busyUserId === user.id || (role === 'admin' && user.id === $auth.user?.id)}
                      onchange={(event) => setRole(user, role, event.currentTarget.checked)}
                    />
                    {role}
                  </label>
                {/each}
              {/if}
              <button
                type="button"
                class="theme-btn delete-btn"
                onclick={() => deleteUser(user)}
                disabled={busyUserId === user.id || user.is_instance_owner}
                title={user.is_instance_owner
                  ? 'The first account created on the instance cannot be deleted'
                  : (user.id === $auth.user?.id ? 'This will delete your account and sign you out' : null)}
              >
                {busyUserId === user.id ? 'Working...' : (user.is_bot ? 'Delete app' : (user.id === $auth.user?.id ? 'Delete my account' : 'Delete user'))}
              </button>
            </div>
          </div>

          <dl class="admin-user-stats">
            <div>
              <dt>Joined</dt>
              <dd>{formatDate(user.created_at)}</dd>
            </div>
            <div>
              <dt>Spaces</dt>
              <dd>{user.space_count}</dd>
            </div>
            <div>
              <dt>Messages</dt>
              <dd>{user.message_count}</dd>
            </div>
            <div>
              <dt>Last message</dt>
              <dd>{formatDate(user.last_message_at)}</dd>
            </div>
          </dl>
        </article>
      {/each}
    </div>

    {#if users.length < total}
      <button type="button" class="theme-btn admin-load-more" onclick={() => loadUsers(false)} disabled={loading}>
        {loading ? 'Loading...' : 'Load more'}
      </button>
    {/if}
  {/if}
</div>
