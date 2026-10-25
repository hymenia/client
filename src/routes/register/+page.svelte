<script>
  import { goto } from '$app/navigation';
  import ServerSwitcher from '$lib/components/ServerSwitcher.svelte';
  import { API_HOST } from '$lib/config.js';
  import { auth } from '$lib/stores.js';
  import 'altcha';
  import { onMount } from 'svelte';

  let username = $state('');
  let password = $state('');
  let email = $state('');
  let birthday = $state('');
  let agreedToPolicies = $state(false);
  let err = $state('');
  let altchaPayload = $state('');
  let widget = $state(null);

  const challengeUrl = `${API_HOST}/api/auth/altcha/challenge`;

  const MIN_AGE = Number(import.meta.env.PUBLIC_MIN_AGE) || 13;
  const today = new Date().toISOString().split('T')[0];

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

  function resetCaptcha() {
    altchaPayload = '';
    widget?.reset?.();
  }

  async function submitauth() {
    err = '';

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
    if (!altchaPayload) {
      err = 'Please complete the captcha';
      return;
    }

    try {
      let res = await fetch(`${API_HOST}/api/auth/register`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          email: email.trim(),
          altcha: altchaPayload
        })
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
        <div class="hcaptcha-wrap">
          <altcha-widget bind:this={widget} challenge={challengeUrl}></altcha-widget>
        </div>
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