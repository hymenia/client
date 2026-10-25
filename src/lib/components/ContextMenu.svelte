<script>
  import { closeMenu, menu } from '$lib/contextMenu.svelte.js';

  function onPointerDown(e) {
    if (!e.target.closest?.('.message-context-menu')) closeMenu();
  }

  function onKeydown(e) {
    if (e.key === 'Escape') closeMenu();
  }
</script>

<svelte:window onpointerdown={onPointerDown} onkeydown={onKeydown} onresize={closeMenu} />

{#if menu.open}
  <div
    class="message-context-menu"
    role="menu"
    style:--menu-x={`${menu.x}px`}
    style:--menu-y={`${menu.y}px`}
  >
    {#each menu.items as item}
      <button
        type="button"
        role="menuitem"
        onclick={() => { item.action(); closeMenu(); }}
      >
        <span>{item.label}</span>
      </button>
    {/each}
  </div>
{/if}