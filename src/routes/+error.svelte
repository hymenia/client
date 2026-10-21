<script>
  import { page } from '$app/stores';
</script>

<div class="error-page">
  <div class="error-card">
    <h1>{$page.status}</h1>
    <p>
      {#if $page.status === 404}
        That page doesn't exist. It may have been moved or deleted, or you may have mistyped the URL.
      {:else}
        {$page.error?.message || 'Something went wrong. You can try again later or go back home.'}
      {/if}
    </p>
    <a href="/">Go back home</a>
  </div>
</div>

