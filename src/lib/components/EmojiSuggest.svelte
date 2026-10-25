<script>
  import { completeShortcode, shortcodeAtCaret } from '$lib/emojiComplete.js';
  import { searchShortcodes, shortcodeToEmoji } from '$lib/shortcodes.js';

  let { text = '', caret = 0, onAccept, keyHandler = $bindable(null) } = $props();

  let active = $derived(shortcodeAtCaret(text, caret));
  let matches = $derived(active ? searchShortcodes(active.query) : []);
  let index = $state(0);
  let dismissed = $state(false);
  let open = $derived(!!active && matches.length > 0 && !dismissed);

  $effect(() => {
    active?.query;
    index = 0;
    dismissed = false;
  });

  $effect(() => {
    keyHandler = handleKey;
  });

  function accept(name) {
    const result = completeShortcode(text, caret, active.start, name);
    onAccept?.(result.text, result.caret);
  }

  // returns true if the key was used
  function handleKey(event) {
    if (!open) return false;
    if (event.key === 'ArrowDown') {
      index = (index + 1) % matches.length;
      return true;
    }
    if (event.key === 'ArrowUp') {
      index = (index - 1 + matches.length) % matches.length;
      return true;
    }
    if (event.key === 'Tab' || event.key === 'Enter') {
      accept(matches[index]);
      return true;
    }
    if (event.key === 'Escape') {
      dismissed = true;
      return true;
    }
    return false;
  }
</script>

{#if open}
  <ul class="emoji-suggest" role="listbox">
    {#each matches as name, i (name)}
      <li
        role="option"
        aria-selected={i === index}
        class:active={i === index}
        onmouseenter={() => (index = i)}
        onmousedown={(e) => {
          // keep focus in the input
          e.preventDefault();
          accept(name);
        }}
      >
        <span class="emoji-char">{shortcodeToEmoji(name)}</span>
        <span class="emoji-name">:{name}:</span>
      </li>
    {/each}
  </ul>
{/if}

