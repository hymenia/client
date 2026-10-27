<script>
  import { API_HOST } from '$lib/config.js';
  import { auth } from '$lib/stores.js';
  import { renderMarkdown } from '$lib/md.js';
  import BadgeCheck from '@lucide/svelte/icons/badge-check';
  import Code from '@lucide/svelte/icons/code';
  import Pencil from '@lucide/svelte/icons/pencil';
  import X from '@lucide/svelte/icons/x';

  let {
    show = $bindable(),
    username = '',
    avatarVersion = 0,
    onEditProfile = undefined
  } = $props();

  let profile = $state(null);
  let loading = $state(false);
  let error = $state('');

  function avatarSrc(name) {
    return `${API_HOST}/api/avatar/${encodeURIComponent(name)}?v=${avatarVersion}`;
  }

  async function loadProfile(name) {
    loading = true;
    error = '';
    profile = null;
    try {
      const res = await fetch(`${API_HOST}/api/profile/${encodeURIComponent(name)}`);
      const data = await res.json();
      if (!res.ok) {
        error = data.error || 'Could not load profile';
        return;
      }
      profile = data;
    } catch (e) {
      error = 'Could not reach server';
    } finally {
      loading = false;
    }
  }

  $effect(() => {
    if (show && username) {
      loadProfile(username);
    }
  });
</script>

{#if show}
  <div class="profile-backdrop" role="presentation" onclick={(event) => { if (event.target === event.currentTarget) show = false; }}>
    <div class="profile-card" role="dialog">
      <button type="button" class="close-btn" onclick={() => show = false}>
        <X size={20} />
      </button>

      {#if loading}
        <div class="profile-body">
          <p class="profile-state">Loading profile...</p>
        </div>
      {:else if error}
        <div class="profile-body">
          <p class="err">{error}</p>
        </div>
      {:else if profile}
        <img src={avatarSrc(profile.username)} alt={profile.username} class="profile-avatar" />
        <div class="profile-body">
          <h2 class="profile-display-name">{profile.display_name || profile.username}</h2>
          <p class="profile-username">
            @{profile.username}
            {#if profile.is_bot}<span class="profile-app-tag">APP</span>{/if}
          </p>
          {#if profile.global_roles?.length}
            <div class="profile-roles">
              {#each profile.global_roles as role}
                {#if role === 'verified'}
                  <span class="global-role-badge" title="Verified"><BadgeCheck size={16} /></span>
                {:else if role === 'developer'}
                  <span class="global-role-badge" title="Developer"><Code size={16} /></span>
                {:else if role === 'glee'}
                  <span class="global-role-badge" title="Glee"><img src="/global_roles/glee.png" alt="Glee" width="16" height="16" /></span>
                {/if}
              {/each}
            </div>
          {/if}
          <div class="profile-section">
            <span class="profile-section-label">About me</span>
            <p class="profile-bio">{@html renderMarkdown(profile.bio || 'I\'m too cool to write a bio. Try talking to me directly!')}</p>
          </div>
        </div>
        {#if onEditProfile && profile.username === $auth.user?.username}
          <div class="profile-footer">
            <button type="button" class="profile-edit-btn" onclick={onEditProfile}>
              <Pencil size={16} /> Edit profile
            </button>
          </div>
        {/if}
      {/if}
    </div>
  </div>
{/if}
