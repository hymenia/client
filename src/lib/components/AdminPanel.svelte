<script>
  import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';
  import Users from '@lucide/svelte/icons/users';
  import X from '@lucide/svelte/icons/x';
  import DashboardTab from './admin/DashboardTab.svelte';
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
          {/if}
        </div>
      </section>
    </div>
  </div>
{/if}