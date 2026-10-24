<script>
  import { goto } from '$app/navigation';
  import ServerSwitcher from '$lib/components/ServerSwitcher.svelte';
  import { API_HOST } from '$lib/config.js';
  import { auth } from '$lib/stores.js';
  import { startAuthentication } from '@simplewebauthn/browser';
  import { onMount } from 'svelte';

  let username = $state('');
  let password = $state('');
  let err = $state('');
  let hcaptchaEnabled = $state(!!import.meta.env.PUBLIC_HCAPTCHA_SITEKEY);
  let hcaptchaSitekey = $state(import.meta.env.PUBLIC_HCAPTCHA_SITEKEY || '');
  let hcaptchaToken = $state('');

  async function loadHCaptcha() {
    try {
      let res = await fetch(`${API_HOST}/api/auth/hcaptcha`);
      if (res.ok) {
        let data = await res.json();
        if (data?.sitekey) {
          hcaptchaSitekey = data.sitekey;
        }
        if (typeof data?.enabled === 'boolean') {
          hcaptchaEnabled = data.enabled || !!hcaptchaSitekey;
        }
      }
    } catch (e) {
      console.warn('hcaptcha load failed', e);
    }
    renderHCaptcha();
  }

  function renderHCaptcha() {
    if (!hcaptchaEnabled || !hcaptchaSitekey || typeof window === 'undefined') return;
    if (!window.hcaptcha) {
      setTimeout(renderHCaptcha, 100);
      return;
    }
    try {
      let el = document.getElementById('hcaptcha-widget');
      if (!el || el.children.length > 0) return;
      window.hcaptcha.render('hcaptcha-widget', {
        sitekey: hcaptchaSitekey,
        callback: (token) => { hcaptchaToken = token; },
        'expired-callback': () => { hcaptchaToken = ''; },
        'error-callback': () => { hcaptchaToken = ''; }
      });
    } catch (e) {
      console.warn('hcaptcha render failed', e);
    }
  }

  onMount(async () => {
    if ($auth.token) {
      goto('/');
      return;
    }
    await loadHCaptcha();
  });

  async function submitauth() {
    err = '';
    let body = { username, password };

    if (hcaptchaEnabled) {
      body.hcaptcha = hcaptchaToken;
    }

    try {
      let res = await fetch(`${API_HOST}/api/auth/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body)
      });

      let data = await res.json();

      if (!res.ok) {
        err = data.error || 'Something went wrong... sorry!';
        if (hcaptchaEnabled && typeof window !== 'undefined' && window.hcaptcha) {
          try { window.hcaptcha.reset(); } catch (_) {}
          hcaptchaToken = '';
        }
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
        {#if hcaptchaEnabled}
          <div class="hcaptcha-wrap">
            <div id="hcaptcha-widget"></div>
          </div>
        {/if}
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