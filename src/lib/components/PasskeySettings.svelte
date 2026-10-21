<script>
  import { API_HOST } from '$lib/config.js';
  import { auth } from '$lib/stores.js';
  import KeyRound from '@lucide/svelte/icons/key-round';
  import { startRegistration } from '@simplewebauthn/browser';

  let adding = $state(false);
  let error = $state('');
  let success = $state('');

  async function addPasskey() {
    adding = true;
    error = '';
    success = '';
    try {
      const optionsRes = await fetch(`${API_HOST}/api/auth/passkey/register/options`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${$auth.token}` }
      });
      const options = await optionsRes.json();
      if (!optionsRes.ok) {
        error = options.error || 'Could not start passkey registration';
        return;
      }

      const response = await startRegistration({ optionsJSON: options });
      const verifyRes = await fetch(`${API_HOST}/api/auth/passkey/register/verify`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', Authorization: `Bearer ${$auth.token}` },
        body: JSON.stringify(response)
      });
      const data = await verifyRes.json();
      if (!verifyRes.ok) {
        error = data.error || 'Passkey registration failed';
        return;
      }

      success = 'Passkey added! You can now use it to log in.';
    } catch (e) {
      if (e.name === 'NotAllowedError') {
        error = 'Passkey registration was cancelled';
      } else if (e.name === 'InvalidStateError') {
        error = 'This device already has a passkey for your account';
      } else {
        error = 'Passkey registration failed';
      }
    } finally {
      adding = false;
    }
  }
</script>

<div class="passkey-settings">
  <div class="setting-block">
    <h3><KeyRound size={18} /> Passkeys</h3>
    <p class="passkey-hint">
      Log in without your password using your device's lock screen or a physical security key.
    </p>
    <button
      type="button"
      class="theme-btn"
      onclick={addPasskey}
      disabled={adding}
    >
      {adding ? 'Adding...' : 'Add passkey'}
    </button>

    {#if error}
      <p class="error">{error}</p>
    {/if}
    {#if success}
      <p class="success">{success}</p>
    {/if}
  </div>
</div>
