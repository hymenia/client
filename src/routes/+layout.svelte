<script>
  import { browser } from '$app/environment';
  import '@fontsource/adwaita-sans';
  import './styles/app.css';
  import { applyTokens } from '$lib/tokens.js';
  import { loadAppearancePrefs, setTheme } from '$lib/theme.js';
  import { onMount } from 'svelte';

  let { children = undefined } = $props();

  if (browser) {
    applyTokens();
  }

  onMount(() => {
    setTheme(loadAppearancePrefs().theme || 'light');
  });
</script>

{@render children()}