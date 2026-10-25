<script>
  import { getTokens, resetTokens, setToken } from '$lib/tokens.js';

  let { theme = 'light', onToggleTheme } = $props();

  let mode = $derived(theme === 'dark' ? 'dark' : 'light');
  let version = $state(0);
  let tokens = $derived.by(() => {
    void version;
    return getTokens(mode);
  });

  function edit(name, value) {
    setToken(mode, name, value);
    version += 1;
  }

  function reset() {
    resetTokens(mode);
    version += 1;
  }

  function isColor(value) {
    return /^(#|rgb|hsl|linear-gradient|radial-gradient)/i.test(value);
  }
</script>

<div class="theme-panel">
  <div class="setting-block">
    <h3>Appearance</h3>
    <p>Select interface appearance:</p>
    <div class="theme-options">
      <button type="button" class="theme-btn" class:active={theme === 'light'} onclick={() => onToggleTheme('light')}>
        Light mode
      </button>
      <button type="button" class="theme-btn" class:active={theme === 'dark'} onclick={() => onToggleTheme('dark')}>
        Dark mode
      </button>
    </div>
  </div>

  <div class="setting-block">
    <div class="tokens-head">
      <h3>Theme values</h3>
      <button type="button" class="theme-btn" onclick={reset}>Reset</button>
    </div>

    <div class="token-list">
      {#each Object.keys(tokens) as name (name)}
        <label class="token-row">
          <span class="token-name">{name}</span>
          <span class="token-swatch" style:--swatch={isColor(tokens[name]) ? tokens[name] : 'transparent'}></span>
          <input type="text" value={tokens[name]} onchange={(e) => edit(name, e.currentTarget.value)} />
        </label>
      {/each}
    </div>
  </div>
</div>
