<script>
  import { onMount } from 'svelte';
  import './styles/app.css';

  let { children = undefined } = $props();

  onMount(() => {
    if (typeof localStorage !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      document.body.classList.toggle('dark', savedTheme === 'dark');
    }
  });
</script>

{@render children()}