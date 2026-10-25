<script>
  import Mail from '@lucide/svelte/icons/mail';
  import Check from '@lucide/svelte/icons/check';
  import CircleAlert from '@lucide/svelte/icons/circle-alert';
  import { API_HOST } from '$lib/config.js';
  import { auth } from '$lib/stores.js';

  let email = $state('');
  let verified = $state(false);
  let verifiedAt = $state(null);
  let loading = $state(true);
  let sending = $state(false);
  let error = $state('');
  let success = $state('');

  async function loadEmail() {
    loading = true;
    error = '';
    try {
      const res = await fetch(`${API_HOST}/api/account/email`, {
        headers: { Authorization: `Bearer ${$auth.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        email = data.email || '';
        verified = data.verified;
        verifiedAt = data.verifiedAt;
        auth.update((cur) => ({
          ...cur,
          user: cur.user ? { ...cur.user, email_verified: verified } : cur.user
        }));
      }
    } catch (e) {
      console.error('failed to load email', e);
    } finally {
      loading = false;
    }
  }

  async function sendVerification() {
    const newEmail = email.trim();
    if (!newEmail || !newEmail.includes('@')) {
      error = 'Please enter a valid email address';
      return;
    }

    sending = true;
    error = '';
    success = '';
    try {
      const res = await fetch(`${API_HOST}/api/account/email`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', Authorization: `Bearer ${$auth.token}` },
        body: JSON.stringify({ email: newEmail })
      });
      const data = await res.json();
      if (!res.ok) {
        error = data.error || 'Failed to send verification email';
        return;
      }
      success = 'Verification email sent! Check your inbox. You may need to check your spam folder.';
      verified = false;
    } catch (e) {
      error = 'Could not reach server';
    } finally {
      sending = false;
    }
  }

  loadEmail();
</script>

<div class="email-settings">
  <div class="setting-block">
    <h3><Mail size={18} /> Email Address</h3>
    {#if loading}
      <p class="loading">Loading...</p>
    {:else}
      <div class="email-form">
        <input
          type="email"
          bind:value={email}
          placeholder="your@email.com"
          disabled={sending}
        />
        <button
          type="button"
          class="theme-btn"
          onclick={sendVerification}
          disabled={sending || !email.trim()}
        >
          {sending ? 'Sending...' : 'Send verification'}
        </button>
      </div>

      {#if verified && verifiedAt}
        <div class="verified-status">
          <Check size={16} />
          <span>Verified on {new Date(verifiedAt).toLocaleDateString()}</span>
        </div>
      {:else if email}
        <div class="unverified-status">
          <CircleAlert size={16} />
          <span>Not verified yet</span>
        </div>
      {/if}

      {#if error}
        <p class="error">{error}</p>
      {/if}
      {#if success}
        <p class="success">{success}</p>
      {/if}
    {/if}
  </div>
</div>

