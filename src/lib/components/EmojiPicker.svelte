<script>
  import twemoji from '@twemoji/api';
  import { onMount } from 'svelte';

  let { onPick, onClose } = $props();

  let picker = $state(null);

  const TWEMOJI_OPTIONS = {
    folder: 'svg',
    ext: '.svg',
    className: 'emoji',
    callback: (icon) => (icon.includes('200d') ? false : undefined)
  };

  function ensureStyle(root) {
    if (root.querySelector('style.twemoji-style')) return;
    const style = document.createElement('style');
    style.className = 'twemoji-style';
    style.textContent = 'img.emoji { width: 1.25em; height: 1.25em; vertical-align: -0.2em; }';
    root.appendChild(style);
  }

  onMount(() => {
    let cancelled = false;
    let handler;
    let observer;
    let root;
    let frame = 0;

    function parseRoot() {
      frame = 0;
      observer?.disconnect();
      try {
        twemoji.parse(root, TWEMOJI_OPTIONS);
      } finally {
        observer?.observe(root, { childList: true, subtree: true });
      }
    }

    function schedule() {
      if (!frame) frame = requestAnimationFrame(parseRoot);
    }

    import('emoji-picker-element').then(() => {
      if (cancelled || !picker || !picker.shadowRoot) return;
      picker.classList.add(document.body.classList.contains('dark') ? 'dark' : 'light');

      handler = (event) => onPick?.(event.detail.unicode);
      picker.addEventListener('emoji-click', handler);

      root = picker.shadowRoot;
      ensureStyle(root);

      observer = new MutationObserver(schedule);
      schedule();
    });

    function onPointerDown(event) {
      if (!event.target.closest?.('.emoji-popover, .emoji-toggle')) onClose?.();
    }
    function onKeydown(event) {
      if (event.key === 'Escape') onClose?.();
    }
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeydown);

    return () => {
      cancelled = true;
      if (frame) cancelAnimationFrame(frame);
      observer?.disconnect();
      if (picker && handler) picker.removeEventListener('emoji-click', handler);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeydown);
    };
  });
</script>

<div class="emoji-popover">
  <emoji-picker bind:this={picker}></emoji-picker>
</div>
