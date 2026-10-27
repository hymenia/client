<script>
  import { API_HOST } from '$lib/config.js';
  import { auth } from '$lib/stores.js';
  import { onMount } from 'svelte';

  const PAGE_SIZE = 50;
  const STATUS_TABS = ['open', 'resolved', 'dismissed', 'all'];
  const REASON_LABELS = {
    spam: 'Spam (with the intent to scam or waste server resources)',
    harassment: 'Harassment',
    hate: 'Hate speech',
    nsfw: 'Sexual/graphic content',
    self_harm: 'Self-harm',
    illegal: 'Illegal activity',
    impersonation: 'Impersonation',
    copyright: 'Copyright infringement',
    csa: 'Child safety',
    other: 'Other'
  };

  let reports = $state([]);
  let total = $state(0);
  let counts = $state({ open: 0, resolved: 0, dismissed: 0 });
  let status = $state('open');
  let loading = $state(false);
  let error = $state('');
  let busyId = $state(null);

  function formatDate(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  function targetSummary(report) {
    const s = report.snapshot || {};
    if (report.target_type === 'message') return s.content || '(no text)';
    if (report.target_type === 'user') return `@${s.username || 'unknown'}`;
    return s.name || 'Unnamed space';
  }

  async function load(reset = false) {
    if (!$auth.token) return;
    if (reset) reports = [];
    error = '';
    loading = true;
    try {
      const params = new URLSearchParams({
        status,
        limit: String(PAGE_SIZE),
        offset: String(reset ? 0 : reports.length)
      });
      const res = await fetch(`${API_HOST}/api/admin/reports?${params}`, {
        headers: { Authorization: `Bearer ${$auth.token}` }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        error = data.error || 'Could not load reports';
        return;
      }
      reports = reset ? data.reports || [] : [...reports, ...(data.reports || [])];
      total = data.total || 0;
      if (data.counts) counts = data.counts;
    } catch (e) {
      error = 'Could not reach server';
    } finally {
      loading = false;
    }
  }

  function pickStatus(next) {
    if (next === status) return;
    status = next;
    load(true);
  }

  async function setStatus(report, next) {
    if (busyId) return;
    busyId = report.id;
    error = '';
    try {
      const res = await fetch(`${API_HOST}/api/admin/reports/${report.id}`, {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          Authorization: `Bearer ${$auth.token}`
        },
        body: JSON.stringify({ status: next })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        error = data.error || 'Could not update report';
        return;
      }
      counts = {
        ...counts,
        [report.status]: Math.max(0, counts[report.status] - 1),
        [next]: counts[next] + 1
      };
      if (status === 'all') {
        reports = reports.map((r) => (r.id === report.id ? { ...r, status: next } : r));
      } else {
        reports = reports.filter((r) => r.id !== report.id);
        total = Math.max(0, total - 1);
      }
    } catch (e) {
      error = 'Could not reach server';
    } finally {
      busyId = null;
    }
  }

  onMount(() => load(true));
</script>

<div class="admin-users">
  <div class="admin-users-heading">
    <h3>Reports</h3>
    <button type="button" class="theme-btn" onclick={() => load(true)} disabled={loading}>Refresh</button>
  </div>

  <div class="admin-summary">
    {#each STATUS_TABS as tab}
      <button
        type="button"
        class="theme-btn"
        class:active={status === tab}
        onclick={() => pickStatus(tab)}
      >
        {tab}{tab !== 'all' ? ` (${counts[tab] ?? 0})` : ''}
      </button>
    {/each}
  </div>

  {#if error}
    <p class="err">{error}</p>
  {/if}

  {#if loading && reports.length === 0}
    <p class="empty-item">Loading reports...</p>
  {:else if reports.length === 0}
    <p class="empty-item">No {status === 'all' ? '' : status} reports.</p>
  {:else}
    <p class="admin-users-count">Showing {reports.length} of {total}</p>

    <div class="admin-user-list">
      {#each reports as report (report.id)}
        <article class="admin-user-row report-row">
          <div class="admin-user-main">
            <div class="admin-user-title">
              <strong>{REASON_LABELS[report.reason] || report.reason}</strong>
              <span class="admin-user-handle">{report.target_type}</span>
              {#if report.status !== 'open'}
                <span class="admin-detail-muted">{report.status}</span>
              {/if}
            </div>

            <blockquote class="report-target">{targetSummary(report)}</blockquote>

            {#if report.details}
              <p class="report-details">"{report.details}"</p>
            {/if}

            <div class="admin-user-details">
              <span>reported by @{report.reporter_username || 'deleted user'}</span>
              {#if report.reported_username}
                <span>against @{report.reported_username}</span>
              {/if}
              <span>{formatDate(report.created_at)}</span>
              {#if report.resolved_by_username}
                <span>handled by @{report.resolved_by_username}</span>
              {/if}
            </div>

            <div class="admin-user-actions">
              {#if report.status === 'open'}
                <button type="button" class="theme-btn" disabled={busyId === report.id} onclick={() => setStatus(report, 'resolved')}>
                  Resolve
                </button>
                <button type="button" class="theme-btn" disabled={busyId === report.id} onclick={() => setStatus(report, 'dismissed')}>
                  Dismiss
                </button>
              {:else}
                <button type="button" class="theme-btn" disabled={busyId === report.id} onclick={() => setStatus(report, 'open')}>
                  Reopen
                </button>
              {/if}
            </div>
          </div>
        </article>
      {/each}
    </div>

    {#if reports.length < total}
      <button type="button" class="theme-btn admin-load-more" onclick={() => load(false)} disabled={loading}>
        {loading ? 'Loading...' : 'Load more'}
      </button>
    {/if}
  {/if}
</div>
