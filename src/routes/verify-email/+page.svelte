<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { auth } from '$lib/stores.js';
  import { API_HOST } from '$lib/config.js';

  let token = $derived($page.url.searchParams.get('token'));
  let loading = $state(true);
  let verifying = $state(false);
  let success = $state(false);
  let error = $state('');

  async function verifyEmail() {
    if (!token) return;
    verifying = true;
    error = '';
    try {
      const res = await fetch(`${API_HOST}/api/account/email/verify`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', Authorization: `Bearer ${$auth.token}` },
        body: JSON.stringify({ token })
      });
      const data = await res.json();
      if (!res.ok) {
        error = data.error || 'Verification failed';
        return;
      }
      success = true;
      auth.update((cur) => ({
        ...cur,
        user: cur.user ? { ...cur.user, email_verified: true } : cur.user
      }));
      setTimeout(() => goto('/'), 2000);
    } catch (e) {
      error = 'Could not reach server';
    } finally {
      verifying = false;
    }
  }

  onMount(() => {
    if (!$auth.token) {
      goto('/login');
      return;
    }
    loading = false;
    if (token) {
      verifyEmail();
    }
  });
</script>

<div class="verify-page">
  <div class="verify-card">
    {#if loading}
      <p>Loading...</p>
    {:else if success}
      <div class="setting-block">
        <h3>Email verified!</h3>
        <p class="success">Your email has been verified successfully.</p>
      </div>
      <p class="redirect-msg">Redirecting...</p>
    {:else if error}
      <div class="setting-block">
        <h3>Verification failed</h3>
        <p class="error">{error}</p>
      </div>
      <button type="button" class="theme-btn" onclick={() => goto('/')}>Back to app</button>
    {:else if verifying}
      <p>Verifying email...</p>
    {:else}
      <div class="setting-block">
        <h3>No token provided</h3>
        <p>Click the link in your verification email to verify your address.</p>
      </div>
      <button type="button" class="theme-btn" onclick={() => goto('/')}>Back to app</button>
    {/if}
  </div>
</div>

