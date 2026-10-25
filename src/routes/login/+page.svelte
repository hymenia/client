<script>
  import { goto } from '$app/navigation';
  import ServerSwitcher from '$lib/components/ServerSwitcher.svelte';
  import { API_HOST } from '$lib/config.js';
  import { auth } from '$lib/stores.js';
  import { startAuthentication } from '@simplewebauthn/browser';
  import 'altcha';
  import { onMount } from 'svelte';

  let username = $state('');
  let password = $state('');
  let err = $state('');
  let altchaPayload = $state('');
  let widget = $state(null);

  const challengeUrl = `${API_HOST}/api/auth/altcha/challenge`;

  onMount(() => {
    if ($auth.token) {
      goto('/');
      return;
    }

    const onState = (e) => {
      if (e.detail.state === 'verified') altchaPayload = e.detail.payload;
      else altchaPayload = '';
    };
    widget?.addEventListener('statechange', onState);
    return () => widget?.removeEventListener('statechange', onState);
  });

  function resetCaptcha() {
    altchaPayload = '';
    widget?.reset?.();
  }

  async function submitauth() {
    err = '';

    if (!altchaPayload) {
      err = 'Please complete the captcha';
      return;
    }

    try {
      let res = await fetch(`${API_HOST}/api/auth/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username, password, altcha: altchaPayload })
      });

      let data = await res.json();

      if (!res.ok) {
        err = data.error || 'Something went wrong... sorry!';
        resetCaptcha();
        return;
      }

      auth.set({
        user: {
          username: data.user?.username || data.username || username,
          avatarUrl: data.user?.avatar_url || data.avatarUrl || null
        },
        token: data.token
      });
      goto('/');
    } catch (e) {
      err = 'Could not reach server';
    }
  }

  async function loginWithPasskey() {
    err = '';
    if (!username.trim()) {
      err = 'Enter your username to log in with passkey';
      return;
    }
    try {
      let optionsRes = await fetch(`${API_HOST}/api/auth/passkey/login/options`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username })
      });
      let options = await optionsRes.json();
      if (!optionsRes.ok) {
        err = options.error || 'Could not start passkey login';
        return;
      }

      let response = await startAuthentication({ optionsJSON: options });
      let verifyRes = await fetch(`${API_HOST}/api/auth/passkey/login/verify`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username, response })
      });
      let data = await verifyRes.json();
      if (!verifyRes.ok) {
        err = data.error || 'Passkey login failed';
        return;
      }

      auth.set({
        user: { username: data.username, avatarUrl: data.avatarUrl || null },
        token: data.token
      });
      goto('/');
    } catch (e) {
      err = e.name === 'NotAllowedError' ? 'Passkey login was cancelled' : 'Passkey login failed';
    }
  }
</script>

<div class="auth-page">
  <div class="auth">
    <img class="auth-logo" src="/authlogo.svg" alt="Logo" />

    <div class="auth-content">
      <h2>Welcome back</h2>

      <form
        onsubmit={(e) => {
          e.preventDefault();
          submitauth();
        }}
      >
        <input type="text" bind:value={username} placeholder="Username" />
        <input type="password" bind:value={password} placeholder="Password" />
        <div class="hcaptcha-wrap">
          <altcha-widget bind:this={widget} challenge={challengeUrl}></altcha-widget>
        </div>
        <button type="submit">Log in</button>
        <button type="button" onclick={loginWithPasskey}>Log in with passkey</button>
      </form>

      {#if err}
        <p class="err">{err}</p>
      {/if}

      <p>Need an account? <a href="/register">Register</a></p>
      <br>
      <ServerSwitcher compact />
    </div>
  </div>
</div>