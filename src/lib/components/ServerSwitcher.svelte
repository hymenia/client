<script>
  import { API_HOST, DEFAULT_API_HOST } from '$lib/config.js';
  import { auth, chats, messages, spaces } from '$lib/stores.js';

  let { compact = false } = $props();
  let serverUrl = $state(API_HOST);
  let serverError = $state('');
  let serverStatus = $state('');
  let switchingServer = $state(false);

  function normalizeServerUrl(value) {
    const trimmed = value.trim();
    if (!trimmed) throw new Error('Enter a server address.');
    const withProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const url = new URL(withProtocol);
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('Use an http or https server address.');
    }
    if (url.username || url.password || url.search || url.hash) {
      throw new Error('Enter a normal server address. Do not include any extra text, symbols, or login info.');
    }
    return url.toString().replace(/\/+$/, '');
  }

  function isUsingDefaultServer() {
    try {
      return normalizeServerUrl(API_HOST) === normalizeServerUrl(DEFAULT_API_HOST);
    } catch {
      return false;
    }
  }

  async function connectToServer(event, useDefault = false) {
    event?.preventDefault();
    serverError = '';
    serverStatus = '';

    let nextServer;
    try {
      nextServer = normalizeServerUrl(useDefault ? DEFAULT_API_HOST : serverUrl);
    } catch (error) {
      serverError = error.message;
      return;
    }

    const currentServer = normalizeServerUrl(API_HOST);
    if (nextServer === currentServer && (!useDefault || nextServer === normalizeServerUrl(DEFAULT_API_HOST))) {
      serverStatus = 'You are already connected to this server.';
      return;
    }

    switchingServer = true;
    try {
      const response = await fetch(`${nextServer}/api/auth/hcaptcha`, {
        headers: { Accept: 'application/json' }
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || typeof data?.enabled !== 'boolean') {
        throw new Error('Could not verify this as a Hymenia server. Check the address and try again.');
      }

      if (useDefault) localStorage.removeItem('hymenia_server_url');
      else localStorage.setItem('hymenia_server_url', nextServer);

      auth.set({ user: null, token: null });
      spaces.set([]);
      chats.set([]);
      messages.set([]);
      localStorage.removeItem('last-space-id');
      localStorage.removeItem('last-chat-id');
      window.location.reload();
    } catch (error) {
      serverError = error.message || 'Could not connect to that server.';
    } finally {
      switchingServer = false;
    }
  }
</script>

{#if compact}
  <div class="passkey-settings server-switcher-compact">
    <details>
      <summary>Server: {API_HOST}</summary>
      {@render serverForm()}
    </details>
  </div>
{:else}
  <div class="setting-block passkey-settings">
    <h3>Server</h3>
    <p class="passkey-hint">Current server: <strong>{API_HOST}</strong></p>
    {@render serverForm()}
  </div>
{/if}

{#snippet serverForm()}
  <form onsubmit={connectToServer}>
    <div class="form-group">
      <label for="server-url">Server address</label>
      <input
        id="server-url"
        type="text"
        bind:value={serverUrl}
        placeholder="https://chat.example.com:9070"
        autocomplete="url"
        spellcheck="false"
        disabled={switchingServer}
      />
    </div>
    <div class="server-switch-options">
      <button class="theme-btn" type="submit" disabled={switchingServer}>
        {switchingServer ? 'Checking...' : 'Connect'}
      </button>
      <button
        class="theme-btn"
        type="button"
        disabled={switchingServer || isUsingDefaultServer()}
        onclick={(event) => connectToServer(event, true)}
      >
        Use default
      </button>
    </div>
  </form>
  <p class="passkey-hint server-switcher-hint">Switching servers signs you out on this device.</p>
  {#if serverError}
    <p class="error" role="alert">{serverError}</p>
  {:else if serverStatus}
    <p class="success" role="status">{serverStatus}</p>
  {/if}
{/snippet}

