<script>
  import { goto } from '$app/navigation';
  import ServerSwitcher from '$lib/components/ServerSwitcher.svelte';
  import { API_HOST } from '$lib/config.js';
  import { auth } from '$lib/stores.js';
  import { onMount } from 'svelte';

  let username = $state('');
  let password = $state('');
  let email = $state('');
  let birthday = $state('');
  let agreedToPolicies = $state(false);
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

  const MIN_AGE = 13;
  const today = new Date().toISOString().split('T')[0];

  // does nothing server side
  function isOldEnough(value) {
    const dob = new Date(`${value}T00:00:00`);
    if (Number.isNaN(dob.getTime())) return false;
    const now = new Date();
    let age = now.getFullYear() - dob.getFullYear();
    const monthDiff = now.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) age -= 1;
    return age >= MIN_AGE;
  }

  async function submitauth() {
    err = '';
    let body = { username, password };

    if (!birthday) {
      err = 'Please enter your date of birth';
      return;
    }
    if (!isOldEnough(birthday)) {
      err = `You must be at least ${MIN_AGE} years old to register`;
      return;
    }

    if (!agreedToPolicies) {
      err = 'Please agree to the Terms of Service and Privacy Policy before registering';
      return;
    }
    if (!email.trim()) {
      err = 'Email is required';
      return;
    }
    body.email = email.trim();

    if (hcaptchaEnabled) {
      body.hcaptcha = hcaptchaToken;
    }

    try {
      let res = await fetch(`${API_HOST}/api/auth/register`, {
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
</script>

<div class="auth-page">
  <div class="auth">
    <img class="auth-logo" src="/authlogo.svg" alt="authlogo" />

    <div class="auth-content">
      <form
        onsubmit={(e) => {
          e.preventDefault();
          submitauth();
        }}
      >
        <input type="text" bind:value={username} placeholder="Username" />
        <input type="password" bind:value={password} placeholder="Password" />
        <input type="email" bind:value={email} placeholder="Email" />
        <input type="date" bind:value={birthday} max={today} title="Date of birth" aria-label="Date of birth" />
        <label class="auth-policy">
          <input type="checkbox" bind:checked={agreedToPolicies} required />
          <span>I agree to the <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>.</span>
        </label>
        {#if hcaptchaEnabled}
          <div class="hcaptcha-wrap">
            <div id="hcaptcha-widget"></div>
          </div>
        {/if}
        <button type="submit">Register</button>
      </form>

      {#if err}
        <p class="err">{err}</p>
      {/if}

      <p>Already have an account? <a href="/login">Log in</a></p>
      <br>
      <ServerSwitcher compact />
    </div>
  </div>
</div>