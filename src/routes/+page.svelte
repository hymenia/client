<script>
  import { goto } from '$app/navigation';
  import {
      acceptInvite,
      createChat,
      createSpace,
      deleteMessage,
      fetchChats,
      fetchMessages,
      fetchSpaces,
      uploadAttachment
  } from '$lib/api.js';
  import {
      closeSocket,
      connectChatSocket,
      joinTextChatRooms,
      leaveTextChatRooms,
      socketOpen,
      socketSend
  } from '$lib/chatSocket.js';
  import AdminPanel from '$lib/components/AdminPanel.svelte';
  import Chatbar from '$lib/components/Chatbar.svelte';
  import ChatList from '$lib/components/ChatList.svelte';
  import HomePage from '$lib/components/HomePage.svelte';
  import InviteDialog from '$lib/components/InviteDialog.svelte';
  import ProfileDialog from '$lib/components/ProfileDialog.svelte';
  import SettingsModal from '$lib/components/SettingsModal.svelte';
  import SpaceList from '$lib/components/SpaceList.svelte';
  import VoiceBar from '$lib/components/VoiceBar.svelte';
  import { API_HOST } from '$lib/config.js';
  import { mapServerMessage } from '$lib/messageShape.js';
  import { fetchProfile } from '$lib/profile.js';
  import {
      columns,
      onPointerMove,
      onPointerUp,
      restoreColumnWidths,
      startResize
  } from '$lib/resize.svelte.js';
  import { auth, chats as chatsStore, messages as msgs, spaces as spacesStore } from '$lib/stores.js';
  import {
      loadAppearancePrefs,
      setTheme as storeTheme
  } from '$lib/theme.js';
  import AppWindow from '@lucide/svelte/icons/app-window';
  import ArrowLeft from '@lucide/svelte/icons/arrow-left';
  import SettingsIcon from '@lucide/svelte/icons/settings';
  import UserPlus from '@lucide/svelte/icons/user-plus';
  import { onMount, tick } from 'svelte';

  let txt = $state('');
  let box = $state(null);
  // svelte-ignore non_reactive_update
  let voiceBar;

  let selectedSpaceId = $state(null);
  let selectedChatId = $state(null);
  let hasOlder = $state(false);
  let loadingOlder = $state(false);
  let spaceSelectionRequest = 0;
  let chatSelectionRequest = 0;
  let olderMessagesRequest = 0;
  let unreadCounts = $state({});
  let newSpaceName = $state('');
  let newSpaceVisibility = $state('private');
  let newChatName = $state('');
  let newChatType = $state('text');
  let createErr = $state('');
  let showSettings = $state(false);
  let theme = $state('light');
  let mobileView = $state('spaces');
  let restoreLastLocation = $state(true);
  let enterToSend = $state(true);

  let avatarVersion = $state(0);

  let selectedSpaceRole = $derived(
    $spacesStore.find((s) => s.id === selectedSpaceId)?.role || null
  );
  let canManageSpace = $derived(selectedSpaceRole === 'owner' || selectedSpaceRole === 'admin');
  let instanceAdmin = $derived($auth.user?.global_roles?.includes('admin') ?? false);

  let replyingTo = $state(null);

  let voiceChatId = $state(null);

  let showInvite = $state(false);
  let showProfile = $state(false);
  let showAdmin = $state(false);
  let profileUsername = $state('');

  let joinCode = $state('');
  let joinErr = $state('');
  let joinSuccess = $state('');
  let chatError = $state('');

  function handleSpaceClick(spaceId) {
    selectSpace(spaceId);
    mobileView = 'chats';
  }

  function handleChatClick(chat) {
    if (chat.type === 'voice') {
      voiceBar?.join(chat);
      return;
    }
    selectChat(chat);
    mobileView = 'chat';
  }

  function backToSpaces() {
    mobileView = 'spaces';
  }

  function backToChats() {
    mobileView = 'chats';
  }

  function openProfile(username) {
    if (!username) return;
    profileUsername = username;
    showProfile = true;
  }

  async function joinViaCode() {
    joinErr = '';
    joinSuccess = '';
    const raw = joinCode.trim();
    if (!raw) return;
    if ($auth.user && $auth.user.email_verified === false) {
      joinErr = 'Please verify your email address to join a space';
      return;
    }
    // a full invite link works too
    const code = raw.includes('/invite/') ? raw.split('/invite/').pop().split(/[?#]/)[0] : raw;

    try {
      const data = await acceptInvite($auth.token, code);
      joinSuccess = data.alreadyMember
        ? `You're already in ${data.space.name}`
        : `Joined ${data.space.name}!`;
      joinCode = '';
      await loadSpaces();
      if (data.space?.id) selectSpace(data.space.id);
    } catch (e) {
      joinErr = e.message;
    }
  }

  function openSettings() {
    showSettings = true;
  }

  function editOwnProfile() {
    showProfile = false;
    openSettings();
  }

  function closeSettings() {
    showSettings = false;
  }

  function avatarSrc(username, bustCache = false) {
    if (!username) return '';
    const base = `${API_HOST}/api/avatar/${encodeURIComponent(username)}`;
    return bustCache ? `${base}?v=${avatarVersion}` : base;
  }

  function toggleTheme(newTheme) {
    theme = storeTheme(newTheme);
  }

  async function scroll() {
    await tick();
    if (box) {
      box.scrollTop = box.scrollHeight;
    }
  }

  async function loadSpaces() {
    if (!$auth.token) return;
    try {
      const data = await fetchSpaces($auth.token);
      spacesStore.set(data);
      if (data.length > 0 && !selectedSpaceId) {
        const savedSpaceId = restoreLastLocation && typeof localStorage !== 'undefined'
          ? localStorage.getItem('last-space-id')
          : null;
        const savedSpace = data.find((space) => String(space.id) === savedSpaceId) || data[0];
        const savedChatId = savedSpaceId && String(savedSpace.id) === savedSpaceId && typeof localStorage !== 'undefined'
          ? localStorage.getItem('last-chat-id')
          : null;
        selectSpace(savedSpace.id, savedChatId);
      }
    } catch (e) {
      console.error('failed to fetch spaces', e);
    }
  }

  async function selectSpace(spaceId, preferredChatId = null) {
    const requestId = ++spaceSelectionRequest;
    chatSelectionRequest += 1;
    olderMessagesRequest += 1;
    leaveTextChatRooms($chatsStore);
    selectedSpaceId = spaceId;
    selectedChatId = null;
    hasOlder = false;
    loadingOlder = false;
    chatsStore.set([]);
    msgs.set([]);
    replyingTo = null;
    if (restoreLastLocation && typeof localStorage !== 'undefined') {
      localStorage.setItem('last-space-id', String(spaceId));
    }
    if (!$auth.token) return;
    try {
      const data = await fetchChats($auth.token, spaceId);
      if (requestId !== spaceSelectionRequest || String(selectedSpaceId) !== String(spaceId)) return;
      chatsStore.set(data);
      const preferredChat = preferredChatId
        ? data.find((chat) => String(chat.id) === String(preferredChatId) && chat.type === 'text')
        : null;
      const firstText = preferredChat || data.find((chat) => chat.type === 'text');
      if (firstText) {
        selectChat(firstText);
      }
      joinTextChatRooms(data, selectedChatId);
    } catch (e) {
      if (requestId === spaceSelectionRequest) {
        console.error('failed to fetch chats for space', e);
      }
    }
  }

  function clearUnread(chatId) {
    if (!unreadCounts[chatId]) return;
    const next = { ...unreadCounts };
    delete next[chatId];
    unreadCounts = next;
  }

  function incrementUnread(chatId) {
    unreadCounts = {
      ...unreadCounts,
      [chatId]: (unreadCounts[chatId] || 0) + 1
    };
  }

  async function selectChat(chat) {
    if (chat.type !== 'text') return;

    const requestId = ++chatSelectionRequest;
    olderMessagesRequest += 1;
    loadingOlder = false;
    hasOlder = false;
    selectedChatId = chat.id;
    clearUnread(chat.id);
    if (restoreLastLocation && typeof localStorage !== 'undefined') {
      localStorage.setItem('last-chat-id', String(chat.id));
    }
    replyingTo = null;

    msgs.set([]);
    try {
      // flip it so newest is at the bottom of the page
      const data = await fetchMessages($auth.token, chat.id);
      if (requestId !== chatSelectionRequest || String(selectedChatId) !== String(chat.id)) return;
      hasOlder = data.hasMore;
      msgs.set(data.messages.slice().reverse());
      scroll();
    } catch (e) {
      if (requestId === chatSelectionRequest) {
        console.error('failed to load message history', e);
      }
    }

    if (requestId === chatSelectionRequest && String(selectedChatId) === String(chat.id)) {
      socketSend({ action: 'join_room', chat_id: chat.id });
    }
  }

  function nearBottom() {
    if (!box) return true;
    return box.scrollHeight - box.scrollTop - box.clientHeight < 80;
  }

  async function loadOlder() {
    if (loadingOlder || !hasOlder || !selectedChatId) return;
    const oldest = $msgs[0];
    if (!oldest?.createdAt || !oldest?.id) return;
    const requestId = ++olderMessagesRequest;
    const chatId = selectedChatId;
    loadingOlder = true;
    try {
      const data = await fetchMessages($auth.token, chatId, {
        createdAt: oldest.createdAt,
        id: oldest.id
      });
      if (
        requestId !== olderMessagesRequest ||
        String(selectedChatId) !== String(chatId) ||
        String($msgs[0]?.id) !== String(oldest.id)
      ) return;
      hasOlder = data.hasMore;
      const older = data.messages.slice().reverse();
      if (older.length > 0) {
        const prevHeight = box?.scrollHeight || 0;
        const prevTop = box?.scrollTop || 0;
        msgs.update((m) => [...older, ...m]);
        await tick();
        if (requestId === olderMessagesRequest && String(selectedChatId) === String(chatId) && box) {
          box.scrollTop = prevTop + (box.scrollHeight - prevHeight);
        }
      }
    } catch (e) {
      if (requestId === olderMessagesRequest) {
        console.error('failed to load older messages', e);
      }
    } finally {
      if (requestId === olderMessagesRequest) loadingOlder = false;
    }
  }

  async function handleCreateSpace() {
    const name = newSpaceName.trim();
    if (!name) return;
    createErr = '';
    if ($auth.user && $auth.user.email_verified === false) {
      createErr = 'Please verify your email address to create a space';
      return;
    }

    try {
      const data = await createSpace($auth.token, name, newSpaceVisibility);
      newSpaceName = '';
      await loadSpaces();
      selectSpace(data.id);
    } catch (e) {
      createErr = e.message;
    }
  }

  async function handleCreateChat() {
    const name = newChatName.trim();
    if (!name || !selectedSpaceId) return;
    createErr = '';

    try {
      const data = await createChat($auth.token, selectedSpaceId, name, newChatType);
      newChatName = '';
      await selectSpace(selectedSpaceId);
      if (data.type === 'text') {
        selectChat(data);
      }
    } catch (e) {
      createErr = e.message;
    }
  }

  async function handleAttach(file) {
    if (!selectedChatId || !file) return;
    if ($auth.user && $auth.user.email_verified === false) {
      throw new Error('Please verify your email address to send attachments');
    }
    await uploadAttachment($auth.token, selectedChatId, file);
  }

  onMount(async () => {
    if (!$auth.token) {
      return;
    }
    const prefs = loadAppearancePrefs();
    restoreLastLocation = prefs.restoreLastLocation;
    enterToSend = prefs.enterToSend;
    restoreColumnWidths(prefs);
    if (prefs.theme) {
      theme = storeTheme(prefs.theme);
    }

    const profile = await fetchProfile($auth.token);
    if (profile) {
      auth.update((current) => ({ ...current, user: { ...current.user, ...profile } }));
    }
    loadSpaces();
  });

  $effect(() => {
    return connectChatSocket($auth.token, {
      onOpen: () => joinTextChatRooms($chatsStore, selectedChatId),
      onError: (err) => {
        chatError = err;
      },
      onMessage: (data) => {
        if (data.event === 'message_deleted') {
          if (String(data.chat_id) === String(selectedChatId)) markMessageDeleted(data.id);
          return;
        }
        if (data.chat_id && String(data.chat_id) !== String(selectedChatId)) {
          incrementUnread(data.chat_id);
          return;
        }
        // only jump down when the reader was already near the bottom
        const stick = nearBottom();
        msgs.update((m) => [...m, mapServerMessage(data)]);
        if (stick) scroll();
      }
    });
  });

  $effect(() => {
    selectedChatId;
    chatError = '';
  });

  function markMessageDeleted(messageId) {
    msgs.update((items) => items.filter((message) => String(message.id) !== String(messageId)));
  }

  async function deleteChatMessage(message) {
    await deleteMessage($auth.token, message.id);
    markMessageDeleted(message.id);
  }

  function send() {
    if (!txt || !selectedChatId || !socketOpen()) {
      return;
    }
    if ($auth.user && $auth.user.email_verified === false) {
      chatError = 'Please verify your email address to send messages';
      return;
    }
    chatError = '';
    const payload = { content: txt };
    if (replyingTo) {
      payload.reply_to_id = replyingTo.id;
    }
    socketSend(payload);
    txt = '';
    replyingTo = null;
  }

  function logout() {
    spaceSelectionRequest += 1;
    chatSelectionRequest += 1;
    olderMessagesRequest += 1;
    voiceBar?.leave();
    closeSocket();
    auth.set({ user: null, token: null });
    spacesStore.set([]);
    chatsStore.set([]);
    msgs.set([]);
    selectedSpaceId = null;
    selectedChatId = null;
    goto('/login');
  }
</script>

<svelte:window onpointermove={onPointerMove} onpointerup={onPointerUp} />

{#if $auth.token}
<div class="app-layout" class:resizing={columns.resizing} data-mobile-view={mobileView}>
  <SpaceList
    width={columns.spacesWidth}
    {selectedSpaceId}
    {createErr}
    {joinErr}
    {joinSuccess}
    onSpaceClick={handleSpaceClick}
    onCreateSpace={handleCreateSpace}
    onJoin={joinViaCode}
    bind:newSpaceName
    bind:newSpaceVisibility
    bind:joinCode
    emailVerified={$auth.user?.email_verified ?? true}
  />

  <div class="col-divider" role="separator" onpointerdown={startResize('spaces')}></div>

  <ChatList
    width={columns.chatsWidth}
    {selectedChatId}
    {voiceChatId}
    {unreadCounts}
    {canManageSpace}
    spaceSelected={!!selectedSpaceId}
    {createErr}
    onChatClick={handleChatClick}
    onCreateChat={handleCreateChat}
    onBack={backToSpaces}
    bind:newChatName
    bind:newChatType
  />

  <div class="col-divider" role="separator" onpointerdown={startResize('chats')}></div>

  <main class="col-chat">
    <div class="bar">
      <button type="button" class="mobile-back-btn" onclick={backToChats}>
        <ArrowLeft size={18} />
      </button>
      <div class="bar-user">
        {#if $auth.user?.email_verified === false}
          <span class="inline-notice">
            Your email isn't verified
            <button type="button" class="inline-notice-link" onclick={openSettings}>Verify now</button>
          </span>
        {/if}
      </div>
      <div class="bar-actions">
        {#if canManageSpace}
          <button type="button" class="theme-btn" onclick={() => showInvite = true}><UserPlus size={16} /> Invite</button>
        {/if}
        {#if instanceAdmin}
          <button type="button" class="theme-btn" onclick={() => showAdmin = true}><AppWindow size={16} /> Admin</button>
        {/if}
        <button type="button" class="theme-btn" onclick={openSettings}><SettingsIcon size={16} /> Settings</button>
      </div>
    </div>

    <VoiceBar bind:this={voiceBar} bind:voiceChatId />

    <Chatbar
      msgs={$msgs}
      bind:txt
      bind:replyingTo
      bind:box
      chatId={selectedChatId}
      {hasOlder}
      {loadingOlder}
      {avatarVersion}
      {enterToSend}
      onSend={send}
      onAttach={handleAttach}
      onLoadOlder={loadOlder}
      onProfileClick={openProfile}
      currentUsername={$auth.user?.username}
      canDeleteAny={canManageSpace}
      onDelete={deleteChatMessage}
      emailVerified={$auth.user?.email_verified ?? true}
      {chatError}
    />
  </main>
</div>

<InviteDialog bind:show={showInvite} spaceId={selectedSpaceId} spaceRole={selectedSpaceRole} />
    <AdminPanel bind:show={showAdmin} />
    <ProfileDialog bind:show={showProfile} username={profileUsername} {avatarVersion} onEditProfile={editOwnProfile} />

    <SettingsModal
      bind:show={showSettings}
      onClose={closeSettings}
      onLogout={logout}
      {theme}
      onToggleTheme={toggleTheme}
      onAvatarChanged={() => (avatarVersion += 1)}
      {avatarVersion}
      bind:restoreLastLocation
      bind:enterToSend
    />

{:else}
  <HomePage />
{/if}
