<script>
  import Flag from '@lucide/svelte/icons/flag';
  import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';
  import Shield from '@lucide/svelte/icons/shield';
  import Users from '@lucide/svelte/icons/users';
  import X from '@lucide/svelte/icons/x';
  import DashboardTab from './admin/DashboardTab.svelte';
  import ModerationTab from './admin/ModerationTab.svelte';
  import ReportsTab from './admin/ReportsTab.svelte';
  import UsersTab from './admin/UsersTab.svelte';

  let { show = $bindable(false) } = $props();

  let adminTab = $state('overview');
</script>

{#if show}
  <div class="settings-backdrop" role="dialog" aria-label="Admin panel">
    <div class="settings-modal">
      <aside class="settings-sidebar">
        <button
          type="button"
          class="settings-nav-item"
          class:active={adminTab === 'overview'}
          onclick={() => adminTab = 'overview'}
        >
          <LayoutDashboard size={16} /> Overview
        </button>
        <button
          type="button"
          class="settings-nav-item"
          class:active={adminTab === 'users'}
          onclick={() => adminTab = 'users'}
        >
          <Users size={16} /> Users
        </button>
        <button
          type="button"
          class="settings-nav-item"
          class:active={adminTab === 'reports'}
          onclick={() => adminTab = 'reports'}
        >
          <Flag size={16} /> Reports
        </button>
        <button
          type="button"
          class="settings-nav-item"
          class:active={adminTab === 'moderation'}
          onclick={() => adminTab = 'moderation'}
        >
          <Shield size={16} /> Moderation
          </button>
      </aside>

      <section class="settings-content">
        <button type="button" class="close-btn" onclick={() => show = false}>
          <X size={20} />
        </button>

        <div class="settings-inner-body admin-inner-body">
          {#if adminTab === 'overview'}
            <DashboardTab />
          {:else if adminTab === 'users'}
            <UsersTab />
          {:else if adminTab === 'reports'}
            <ReportsTab />
          {:else if adminTab === 'moderation'}
            <ModerationTab />
          {/if}
        </div>
      </section>
    </div>
  </div>
{/if}