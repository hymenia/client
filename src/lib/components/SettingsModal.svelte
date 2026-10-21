<script>
  import X from '@lucide/svelte/icons/x';
import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
import User from '@lucide/svelte/icons/user';
import Palette from '@lucide/svelte/icons/palette';
import Code from '@lucide/svelte/icons/code';
import LogOut from '@lucide/svelte/icons/log-out';
  import AccountPanel from './settings/AccountPanel.svelte';
  import ThemePanel from './settings/ThemePanel.svelte';
  import GeneralPanel from './settings/GeneralPanel.svelte';
  import DeveloperTab from './DeveloperTab.svelte';

  let {
    show = $bindable(false),
    onClose,
    onLogout,
    theme = 'light',
    onToggleTheme,
    onAvatarChanged,
    avatarVersion = 0,
    restoreLastLocation = $bindable(true),
    enterToSend = $bindable(true)
  } = $props();

  let settingsTab = $state('account');
</script>

{#if show}
  <div class="settings-backdrop" role="dialog">
    <div class="settings-modal">
      <aside class="settings-sidebar">
        <button
          type="button"
          class="settings-nav-item"
          class:active={settingsTab === 'settings'}
          onclick={() => settingsTab = 'settings'}
        >
          <SlidersHorizontal size={16} /> General
        </button>
        <button
          type="button"
          class="settings-nav-item"
          class:active={settingsTab === 'account'}
          onclick={() => settingsTab = 'account'}
        >
          <User size={16} /> Account
        </button>
        <button
          type="button"
          class="settings-nav-item"
          class:active={settingsTab === 'theme'}
          onclick={() => settingsTab = 'theme'}
        >
          <Palette size={16} /> Theme
        </button>
        <button
          type="button"
          class="settings-nav-item"
          class:active={settingsTab === 'developer'}
          onclick={() => settingsTab = 'developer'}
        >
          <Code size={16} /> Developer
        </button>
        <div class="settings-nav-spacer flex-grow"></div>
        <button
          type="button"
          class="settings-nav-item logout-tab"
          onclick={() => { show = false; onLogout(); }}
        >
          <LogOut size={16} /> Log out
        </button>
      </aside>

      <section class="settings-content">
        <button type="button" class="close-btn" onclick={onClose}>
          <X size={20} />
        </button>

        <div class="settings-inner-body">
          {#if settingsTab === 'account'}
            <AccountPanel {onClose} {onLogout} {onAvatarChanged} {avatarVersion} />
          {:else if settingsTab === 'theme'}
            <ThemePanel {theme} {onToggleTheme} />
          {:else if settingsTab === 'developer'}
            <DeveloperTab />
          {:else}
            <GeneralPanel bind:restoreLastLocation bind:enterToSend />
          {/if}
        </div>
      </section>
    </div>
  </div>
{/if}
