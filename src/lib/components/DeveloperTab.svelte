<script>
  import { API_HOST } from '$lib/config.js';
  import { auth } from '$lib/stores.js';
  import Bot from '@lucide/svelte/icons/bot';
  import Copy from '@lucide/svelte/icons/copy';
  import Link2 from '@lucide/svelte/icons/link-2';
  import Plus from '@lucide/svelte/icons/plus';
  import RefreshCw from '@lucide/svelte/icons/refresh-cw';
  import Trash2 from '@lucide/svelte/icons/trash-2';

  let apps = $state([]);
  let newAppName = $state('');
  let appErr = $state('');
  let creatingApp = $state(false);
  let newAppToken = $state(null);
  let appTokenCopied = $state(false);

  let expandedAppId = $state(null);
  let appInvitesMap = $state({});
  let appInviteErr = $state('');
  let appInviteCopiedId = $state(null);

  let textChats = $state([]);
  let appWebhooksMap = $state({});
  let expandedWebhookAppId = $state(null);
  let webhookName = $state('');
  let webhookChatId = $state('');
  let webhookErr = $state('');
  let newWebhookToken = $state(null);
  let webhookUrlCopied = $state(false);

  function webhookUrl(webhookId, token) {
    return `${API_HOST}/api/webhooks/${webhookId}/${token}`;
  }

  function appInviteUrl(code) {
    if (typeof window === 'undefined') return code;
    return `${window.location.origin}/app-invite/${code}`;
  }

  async function loadApps() {
    try {
      const res = await fetch(`${API_HOST}/api/apps`, {
        headers: { Authorization: `Bearer ${$auth.token}` }
      });
      if (res.ok) apps = await res.json();
    } catch (e) {
      console.error('failed to load apps', e);
    }
  }

  async function loadTextChats() {
    try {
      const spacesRes = await fetch(`${API_HOST}/api/spaces`, {
        headers: { Authorization: `Bearer ${$auth.token}` }
      });
      if (!spacesRes.ok) return;
      const spaces = await spacesRes.json();
      const chats = await Promise.all(spaces.map(async (space) => {
        const res = await fetch(`${API_HOST}/api/spaces/${space.id}/chats`, {
          headers: { Authorization: `Bearer ${$auth.token}` }
        });
        if (!res.ok) return [];
        const rows = await res.json();
        return rows
          .filter((chat) => chat.type === 'text')
          .map((chat) => ({ ...chat, spaceName: space.name }));
      }));
      textChats = chats.flat();
    } catch (e) {
      console.error('failed to load webhook chats', e);
    }
  }

  async function generateApp() {
    const name = newAppName.trim();
    if (!name) return;
    appErr = '';
    creatingApp = true;
    try {
      const res = await fetch(`${API_HOST}/api/apps`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', Authorization: `Bearer ${$auth.token}` },
        body: JSON.stringify({ name })
      });
      const data = await res.json();
      if (!res.ok) {
        appErr = data.error || 'Could not create app';
        return;
      }
      newAppToken = { name: data.app.username, token: data.token };
      newAppName = '';
      await loadApps();
    } catch (e) {
      appErr = 'Could not reach server';
    } finally {
      creatingApp = false;
    }
  }

  async function regenerateAppToken(app) {
    appErr = '';
    try {
      const res = await fetch(`${API_HOST}/api/apps/${app.id}/regenerate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${$auth.token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        appErr = data.error || 'Could not regenerate token';
        return;
      }
      newAppToken = { name: app.username, token: data.token };
    } catch (e) {
      appErr = 'Could not reach server';
    }
  }

  async function deleteApp(app) {
    if (!confirm(`Delete app "${app.username}"? This can't be undone.`)) return;
    try {
      await fetch(`${API_HOST}/api/apps/${app.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${$auth.token}` }
      });
      if (newAppToken?.name === app.username) newAppToken = null;
      await loadApps();
    } catch (e) {
      console.error('failed to delete app', e);
    }
  }

  async function copyAppToken() {
    if (!newAppToken) return;
    try {
      await navigator.clipboard.writeText(newAppToken.token);
      appTokenCopied = true;
      setTimeout(() => { appTokenCopied = false; }, 1500);
    } catch (e) {
      console.error('clipboard write failed', e);
    }
  }

  async function loadAppInvites(appId) {
    try {
      const res = await fetch(`${API_HOST}/api/apps/${appId}/invites`, {
        headers: { Authorization: `Bearer ${$auth.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        appInvitesMap = { ...appInvitesMap, [appId]: data };
      }
    } catch (e) {
      console.error('failed to load app invites', e);
    }
  }

  function toggleAppInvites(app) {
    appInviteErr = '';
    if (expandedAppId === app.id) {
      expandedAppId = null;
      return;
    }
    expandedAppId = app.id;
    loadAppInvites(app.id);
  }

  async function createAppInvite(appId) {
    appInviteErr = '';
    try {
      const res = await fetch(`${API_HOST}/api/apps/${appId}/invites`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${$auth.token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        appInviteErr = data.error || 'Could not create invite link';
        return;
      }
      await loadAppInvites(appId);
    } catch (e) {
      appInviteErr = 'Could not reach server';
    }
  }

  async function revokeAppInvite(appId, inviteId) {
    try {
      await fetch(`${API_HOST}/api/apps/${appId}/invites/${inviteId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${$auth.token}` }
      });
      await loadAppInvites(appId);
    } catch (e) {
      console.error('failed to revoke app invite', e);
    }
  }

  async function copyAppInviteLink(invite) {
    try {
      await navigator.clipboard.writeText(appInviteUrl(invite.code));
      appInviteCopiedId = invite.id;
      setTimeout(() => { if (appInviteCopiedId === invite.id) appInviteCopiedId = null; }, 1500);
    } catch (e) {
      console.error('clipboard write failed', e);
    }
  }

  async function loadAppWebhooks(appId) {
    try {
      const res = await fetch(`${API_HOST}/api/apps/${appId}/webhooks`, {
        headers: { Authorization: `Bearer ${$auth.token}` }
      });
      if (res.ok) {
        appWebhooksMap = { ...appWebhooksMap, [appId]: await res.json() };
      }
    } catch (e) {
      webhookErr = 'Could not load webhooks';
    }
  }

  function toggleAppWebhooks(app) {
    webhookErr = '';
    if (expandedWebhookAppId === app.id) {
      expandedWebhookAppId = null;
      return;
    }
    expandedWebhookAppId = app.id;
    loadAppWebhooks(app.id);
  }

  async function createWebhook(appId) {
    webhookErr = '';
    const name = webhookName.trim();
    if (!name || !webhookChatId) {
      webhookErr = 'Webhook name and chat are required';
      return;
    }
    try {
      const res = await fetch(`${API_HOST}/api/apps/${appId}/webhooks`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', Authorization: `Bearer ${$auth.token}` },
        body: JSON.stringify({ name, chat_id: webhookChatId })
      });
      const data = await res.json();
      if (!res.ok) {
        webhookErr = data.error || 'Could not create webhook';
        return;
      }
      newWebhookToken = { id: data.webhook.id, name: data.webhook.name, token: data.token };
      webhookName = '';
      webhookChatId = '';
      await loadAppWebhooks(appId);
    } catch (e) {
      webhookErr = 'Could not reach server';
    }
  }

  async function deleteWebhook(appId, webhook) {
    if (!confirm(`Delete webhook "${webhook.name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${API_HOST}/api/apps/${appId}/webhooks/${webhook.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${$auth.token}` }
      });
      if (!res.ok) {
        const data = await res.json();
        webhookErr = data.error || 'Could not delete webhook';
        return;
      }
      await loadAppWebhooks(appId);
    } catch (e) {
      webhookErr = 'Could not reach server';
    }
  }

  async function copyWebhookUrl() {
    if (!newWebhookToken) return;
    try {
      await navigator.clipboard.writeText(webhookUrl(newWebhookToken.id, newWebhookToken.token));
      webhookUrlCopied = true;
      setTimeout(() => { webhookUrlCopied = false; }, 1500);
    } catch (e) {
      webhookErr = 'Could not copy webhook URL';
    }
  }

  loadApps();
  loadTextChats();
</script>

<div class="developer-panel">
  <h3>Apps</h3>
  <p>Create a app. Documentation isn't available yet.</p>

  <form class="app-create-row" onsubmit={(e) => { e.preventDefault(); generateApp(); }}>
    <input bind:value={newAppName} maxlength="80" placeholder="App name" />
    <button type="submit" class="theme-btn" disabled={creatingApp}>
      <Bot size={14} /> Generate app
    </button>
  </form>
  {#if appErr}
    <p class="err">{appErr}</p>
  {/if}

  {#if newAppToken}
    <div class="app-token-box">
      <p><strong>{newAppToken.name}</strong> | Copy this token now, it won't be shown again:</p>
      <div class="app-token-row">
        <code class="app-token-value">{newAppToken.token}</code>
        <button type="button" class="theme-btn" onclick={copyAppToken}>
          <Copy size={14} /> {appTokenCopied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  {/if}

  <div class="app-list">
    {#each apps as app (app.id)}
      <div class="app-row">
        <span class="app-name">{app.username}</span>
        <button type="button" class="theme-btn" onclick={() => toggleAppInvites(app)}>
          <Link2 size={14} /> Invite link
        </button>
        <button type="button" class="theme-btn" onclick={() => toggleAppWebhooks(app)}>
          <Link2 size={14} /> Webhooks
        </button>
        <button type="button" class="theme-btn" onclick={() => regenerateAppToken(app)}>
          <RefreshCw size={14} /> Regenerate token
        </button>
        <button type="button" class="theme-btn delete-btn icon-btn" onclick={() => deleteApp(app)}>
          <Trash2 size={14} />
        </button>
      </div>
      {#if expandedAppId === app.id}
        <div class="application-panel">
          <p class="invite-subtitle">Anyone with a link can add {app.username} to any space where they're an owner or admin.</p>
          {#if appInviteErr}
            <p class="err">{appInviteErr}</p>
          {/if}
          <button type="button" class="theme-btn" onclick={() => createAppInvite(app.id)}>
            <Plus size={14} /> Create invite link
          </button>
          <div class="invite-list">
            {#each (appInvitesMap[app.id] || []) as inv (inv.id)}
              <div class="invite-row">
                <span class="invite-code">{appInviteUrl(inv.code)}</span>
                <button type="button" class="theme-btn" onclick={() => copyAppInviteLink(inv)}>
                  <Copy size={14} /> {appInviteCopiedId === inv.id ? 'Copied!' : 'Copy'}
                </button>
                <button type="button" class="theme-btn delete-btn icon-btn" onclick={() => revokeAppInvite(app.id, inv.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            {/each}
            {#if (appInvitesMap[app.id] || []).length === 0}
              <p class="empty-item">No active invite links</p>
            {/if}
          </div>
        </div>
      {/if}
      {#if expandedWebhookAppId === app.id}
        <div class="application-panel">
          <p class="invite-subtitle">Create webhooks for a channel..</p>
          {#if webhookErr}
            <p class="err">{webhookErr}</p>
          {/if}
          <form class="webhook-create-form" onsubmit={(e) => { e.preventDefault(); createWebhook(app.id); }}>
            <input bind:value={webhookName} maxlength="80" placeholder="Webhook name" />
            <select bind:value={webhookChatId}>
              <option value="">Choose a text chat</option>
              {#each textChats as chat (chat.id)}
                <option value={chat.id}>{chat.spaceName} / #{chat.name}</option>
              {/each}
            </select>
            <button type="submit" class="theme-btn"><Plus size={14} /> Create webhook</button>
          </form>
          {#if newWebhookToken}
            <div class="app-token-box">
              <p><strong>{newWebhookToken.name}</strong> | Copy this URL now; the token won't be shown again:</p>
              <div class="app-token-row">
                <code class="app-token-value">{webhookUrl(newWebhookToken.id, newWebhookToken.token)}</code>
                <button type="button" class="theme-btn" onclick={copyWebhookUrl}>
                  <Copy size={14} /> {webhookUrlCopied ? 'Copied!' : 'Copy URL'}
                </button>
              </div>
            </div>
          {/if}
          <div class="invite-list">
            {#each (appWebhooksMap[app.id] || []) as webhook (webhook.id)}
              <div class="invite-row">
                <span class="invite-code">{webhook.name} -> {webhook.chat_name}</span>
                <button type="button" class="theme-btn delete-btn icon-btn" onclick={() => deleteWebhook(app.id, webhook)}>
                  <Trash2 size={14} />
                </button>
              </div>
            {/each}
            {#if (appWebhooksMap[app.id] || []).length === 0}
              <p class="empty-item">No webhooks yet</p>
            {/if}
          </div>
        </div>
      {/if}
    {/each}
    {#if apps.length === 0}
      <p class="empty-item">No apps yet (if you want to create a webhook or bot, you need to create an app first)</p>
    {/if}
  </div>
</div>
