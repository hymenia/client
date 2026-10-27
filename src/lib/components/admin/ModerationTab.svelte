<script>
  import { API_HOST } from '$lib/config.js';
  import { auth } from '$lib/stores.js';

  let targetUserId = $state('');
  let selectedStatus = $state(0);
  let reason = $state('');
  let expiresAt = $state('');
  let loading = $state(false);
  let error = $state('');
  let successMessage = $state('');

  async function saveModeration() {
    if (!targetUserId.trim()) {
      error = 'Please enter a valid User ID';
      return;
    }

    loading = true;
    error = '';
    successMessage = '';

    try {
      const res = await fetch(`${API_HOST}/api/admin/users/${targetUserId.trim()}/moderation`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${$auth.token}`
        },
        body: JSON.stringify({
          status: Number(selectedStatus),
          reason: reason.trim() || null,
          expires_at: expiresAt ? new Date(expiresAt).toISOString() : null
        })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        error = data.error || 'Failed to update moderation status';
        return;
      }

      successMessage = `Successfully updated moderation status for user: @${data.username}`;
    } catch (e) {
      error = 'Could not reach server';
    } finally {
      loading = false;
    }
  }
</script>

<div class="admin-users">
  <div class="admin-users-heading">
    <h3>User Moderation Management</h3>
  </div>

  {#if error}
    <p class="err">{error}</p>
  {/if}

  {#if successMessage}
    <p class="success-msg">{successMessage}</p>
  {/if}

  <div class="moderation-form-container">
    <div class="form-group">
      <label for="target-user-id">User ID:</label>
      <input 
        id="target-user-id" 
        type="text" 
        bind:value={targetUserId} 
        placeholder="Paste User UUID here..." 
      />
    </div>

    <div class="form-group">
      <label for="moderation-status-select">Moderation Status:</label>
      <select id="moderation-status-select" class="monospaced" bind:value={selectedStatus}>
        <option value={0}>0 | Normal</option>
        <option value={1}>1 | Limited</option>
        <option value={2}>2 | Banned</option>
        <option value={3}>3 | Suspended (temp ban)</option>
      </select>
    </div>

    {#if selectedStatus > 0}
      <div class="form-group">
        <label for="moderation-reason">Reason:</label>
        <input 
          id="moderation-reason" 
          type="text" 
          bind:value={reason} 
          placeholder="Enter reason for moderation action..." 
        />
      </div>
    {/if}

    {#if selectedStatus === 3}
      <div class="form-group">
        <label for="moderation-expires">Suspension Expires At:</label>
        <input 
          id="moderation-expires" 
          type="datetime-local" 
          bind:value={expiresAt} 
        />
      </div>
    {/if}

    <button type="button" class="theme-btn" onclick={saveModeration} disabled={loading}>
      {loading ? 'Saving...' : 'Apply Moderation Status'}
    </button>
  </div>
</div>