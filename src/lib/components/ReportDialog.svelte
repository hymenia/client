<script>
  import { API_HOST } from '$lib/config.js';
  import { auth } from '$lib/stores.js';
  import X from '@lucide/svelte/icons/x';

  let { targetType, targetId, label = '', onClose } = $props();

  const REASONS = [
    ['spam', 'Spam (with the intent to scam or waste server resources)'],
    ['harassment', 'Harassment or bullying'],
    ['hate', 'Hate speech'],
    ['nsfw', 'Sexual or graphic content'],
    ['self_harm', 'Self-harm'],
    ['illegal', 'Illegal activity'],
    ['impersonation', 'Impersonation'],
    ['csa', 'Child safety or exploitation'],
    ['copyright', 'Copyright infringement'],
    ['other', 'Something else']
  ];

  let reason = $state('');
  let details = $state('');
  let busy = $state(false);
  let error = $state('');
  let sent = $state(false);

  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    if (!reason) {
      error = 'Pick a reason first';
      return;
    }
    busy = true;
    error = '';
    try {
      const res = await fetch(`${API_HOST}/api/reports`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          Authorization: `Bearer ${$auth.token}`
        },
        body: JSON.stringify({ targetType, targetId, reason, details })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        error = data.error || 'Could not send report';
        return;
      }
      sent = true;
    } catch (err) {
      error = 'Could not reach server';
    } finally {
      busy = false;
    }
  }
</script>

<div
  class="sidebar-dialog-backdrop"
  role="presentation"
  onclick={(event) => {
    if (event.target === event.currentTarget) onClose?.();
  }}
>
  <div class="sidebar-dialog" role="dialog">
    <button type="button" class="close-btn" onclick={() => onClose?.()}>
      <X size={20} />
    </button>

    {#if sent}
      <h2 class="sidebar-dialog-title">Report sent</h2>
      <p class="empty-item">Thank you. An admin will take a look soon.</p>
      <button type="button" class="theme-btn" onclick={() => onClose?.()}>Done</button>
    {:else}
      <h2 class="sidebar-dialog-title">Report {targetType}</h2>
      {#if label}
        <p class="empty-item report-label">{label}</p>
      {/if}
      <form class="report-form" onsubmit={submit}>
        <select bind:value={reason}>
          <option value="" disabled>Select a reason</option>
          {#each REASONS as [value, text]}
            <option {value}>{text}</option>
          {/each}
        </select>
        <textarea
          bind:value={details}
          maxlength="500"
          rows="3"
          placeholder="Anything else we should know? (optional)"
        ></textarea>
        <button type="submit" class="theme-btn" disabled={busy}>
          {busy ? 'Sending...' : 'Send report'}
        </button>
      </form>
      {#if error}
        <div class="empty-item err">{error}</div>
      {/if}
    {/if}
  </div>
</div>
