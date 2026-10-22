<script>
  import { auth } from '$lib/stores.js';
  import ServerSwitcher from '../ServerSwitcher.svelte';

  let {
    restoreLastLocation = $bindable(true),
    enterToSend = $bindable(true)
  } = $props();
</script>

<div class="general-panel">
  <h3>General</h3>
  <p>Logged in as: <strong>{$auth.user?.username}</strong></p>
  <div class="setting-block">
    <h3>Startup</h3>
    <label class="setting-toggle">
      <input
        type="checkbox"
        bind:checked={restoreLastLocation}
        onchange={() => {
          localStorage.setItem('restore-last-location', String(restoreLastLocation));
          if (!restoreLastLocation) {
            localStorage.removeItem('last-space-id');
            localStorage.removeItem('last-chat-id');
          }
        }}
      />
      Reopen your last space and chat
    </label>
  </div>
  <div class="setting-block">
    <h3>Chat behavior</h3>
    <label class="setting-toggle">
      <input
        type="checkbox"
        bind:checked={enterToSend}
        onchange={() => localStorage.setItem('enter-to-send', String(enterToSend))}
      />
      Press Enter to send messages
    </label>
  </div>
  <ServerSwitcher />
</div>
