<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { auth } from '$lib/stores.js';
  import { API_HOST } from '$lib/config.js';

  let status = $state('joining');
  let message = $state('');

  onMount(async () => {
    const code = $page.params.code;

    if (!$auth.token) {
      goto(`/login?redirect=${encodeURIComponent(`/invite/${code}`)}`);
      return;
    }

    try {
      const res = await fetch(`${API_HOST}/api/invites/${encodeURIComponent(code)}/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${$auth.token}` }
      });
      const data = await res.json();

      if (!res.ok) {
        status = 'error';
        message = data.error || 'Could not join with that invite';
        return;
      }

      status = 'done';
      message = data.alreadyMember ? `You're already in ${data.space.name}` : `Joined ${data.space.name}!`;
      setTimeout(() => goto('/'), 1200);
    } catch (e) {
      status = 'error';
      message = 'Could not reach server';
    }
  });
</script>

<div class="invite-page">
  <div class="invite-card">
    {#if status === 'joining'}
      <p>Joining space...</p>
    {:else if status === 'done'}
      <p class="success">{message}</p>
      <p class="redirect-note">Taking you there now...</p>
    {:else}
      <p class="error">{message}</p>
      <a href="/">Go back home</a>
    {/if}
  </div>
</div>
