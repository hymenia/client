<script>
  let { theme = 'light', onToggleTheme } = $props();
</script>

<div class="theme-panel">
  <div class="setting-block">
    <h3>Appearance</h3>
    <p>Select interface appearance:</p>
    <div class="theme-options">
      <button
        type="button"
        class="theme-btn"
        class:active={theme === 'light'}
        onclick={() => onToggleTheme('light')}
      >
        Light mode
      </button>
      <button
        type="button"
        class="theme-btn"
        class:active={theme === 'dark'}
        onclick={() => onToggleTheme('dark')}
      >
        Dark mode
      </button>
    </div>
  </div>

  <div class="setting-block">
    <h3>Accent color</h3>
    <p>Be back soon!</p>
  </div>
</div>
