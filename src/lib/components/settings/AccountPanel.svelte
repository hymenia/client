<script>
  import { API_HOST } from '$lib/config.js';
  import {
      changePassword,
      clearAvatar,
      deleteAccount as deleteAccountRequest,
      updateProfile,
      uploadAvatar
  } from '$lib/profile.js';
  import { auth } from '$lib/stores.js';
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import Upload from '@lucide/svelte/icons/upload';
  import { onMount } from 'svelte';
  import EmailSettings from '../EmailSettings.svelte';
  import PasskeySettings from '../PasskeySettings.svelte';

  let { onClose, onLogout, onAvatarChanged, avatarVersion = 0 } = $props();

  let profileDisplayName = $state('');
  let profileBio = $state('');
  let profileErr = $state('');
  let profileSuccess = $state('');
  let profileSaving = $state(false);

  let avatarErr = $state('');

  let currentPassword = $state('');
  let newPassword = $state('');
  let confirmNewPassword = $state('');
  let passwordErr = $state('');
  let passwordSuccess = $state('');

  let deletePassword = $state('');
  let deleteErr = $state('');

  onMount(() => {
    profileDisplayName = $auth.user?.display_name || '';
    profileBio = $auth.user?.bio || '';
  });

  function avatarSrc(username, bustCache = false) {
    if (!username) return '';
    const base = `${API_HOST}/api/avatar/${encodeURIComponent(username)}`;
    return bustCache ? `${base}?v=${avatarVersion}` : base;
  }

  async function saveProfile() {
    profileErr = '';
    profileSuccess = '';
    profileSaving = true;
    const result = await updateProfile($auth.token, profileDisplayName, profileBio);
    profileSaving = false;
    if (!result.ok) {
      profileErr = result.error;
      return;
    }
    profileDisplayName = result.data.display_name || '';
    profileBio = result.data.bio || '';
    auth.update((current) => ({ ...current, user: { ...current.user, ...result.data } }));
    profileSuccess = 'Profile updated successfully';
  }

  async function handleChangePassword() {
    passwordErr = '';
    passwordSuccess = '';
    if (!currentPassword || !newPassword) {
      passwordErr = 'All password fields are required';
      return;
    }
    if (newPassword.length < 8) {
      passwordErr = 'New password must be at least 8 characters';
      return;
    }
    if (newPassword !== confirmNewPassword) {
      passwordErr = 'New passwords do not match';
      return;
    }
    const result = await changePassword($auth.token, currentPassword, newPassword);
    if (!result.ok) {
      passwordErr = result.error;
      return;
    }
    passwordSuccess = 'Password updated successfully!';
    currentPassword = '';
    newPassword = '';
    confirmNewPassword = '';
  }

  async function handleDeleteAccount() {
    deleteErr = '';
    if (!deletePassword) {
      deleteErr = 'Password confirmation is required';
      return;
    }
    if (!confirm('Are you absolutely sure you want to continue? This can\'t be undone ')) {
      return;
    }
    const result = await deleteAccountRequest($auth.token, deletePassword);
    if (!result.ok) {
      deleteErr = result.error;
      return;
    }
    onClose();
    onLogout();
  }

  async function handleAvatarUpload(e) {
    avatarErr = '';
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await uploadAvatar($auth.token, file);
    e.target.value = '';
    if (!result.ok) {
      avatarErr = result.error;
      return;
    }
    onAvatarChanged();
  }

  async function removeAvatar() {
    avatarErr = '';
    const result = await clearAvatar($auth.token);
    if (!result.ok) {
      avatarErr = result.error;
      return;
    }
    onAvatarChanged();
  }
</script>

<div class="account-panel">
  <div class="setting-block">
    <h3>Profile</h3>
    <form onsubmit={(e) => { e.preventDefault(); saveProfile(); }}>
      <div class="form-group">
        <label for="display-name">Display name</label>
        <input id="display-name" bind:value={profileDisplayName} maxlength="80" placeholder={$auth.user?.username} />
      </div>
      <div class="form-group">
        <label for="profile-bio">Bio</label>
        <textarea id="profile-bio" bind:value={profileBio} maxlength="500" rows="4" placeholder="Tell people a little about yourself"></textarea>
      </div>
      {#if profileErr}
        <p class="err">{profileErr}</p>
      {/if}
      {#if profileSuccess}
        <p class="info">{profileSuccess}</p>
      {/if}
      <button type="submit" class="theme-btn" disabled={profileSaving}>{profileSaving ? 'Saving...' : 'Save profile'}</button>
    </form>
  </div>

  <EmailSettings />

  <PasskeySettings />

  <div class="setting-block">
    <h3>Profile picture</h3>
    <div class="avatar-row">
      <img src={avatarSrc($auth.user?.username, true)} alt="your avatar" class="avatar-preview" />
      <div class="avatar-actions">
        <label class="theme-btn avatar-upload-label">
          <Upload size={14} /> Upload photo
          <input type="file" accept="image/*" onchange={handleAvatarUpload} hidden />
        </label>
        <button type="button" class="theme-btn delete-btn" onclick={removeAvatar}><Trash2 size={14} /> Remove</button>
      </div>
    </div>
    {#if avatarErr}
      <p class="err">{avatarErr}</p>
    {/if}
  </div>

  <div class="setting-block">
    <h3>Change password</h3>
    <form onsubmit={(e) => { e.preventDefault(); handleChangePassword(); }}>
      <div class="form-group">
        <label for="cur-pass">Current password</label>
        <input id="cur-pass" type="password" bind:value={currentPassword} placeholder="Current password" />
      </div>
      <div class="form-group">
        <label for="new-pass">New password</label>
        <input id="new-pass" type="password" bind:value={newPassword} placeholder="New password (min 8 chars)" />
      </div>
      <div class="form-group">
        <label for="conf-pass">Confirm new password</label>
        <input id="conf-pass" type="password" bind:value={confirmNewPassword} placeholder="Confirm new password" />
      </div>
      {#if passwordErr}
        <p class="err">{passwordErr}</p>
      {/if}
      {#if passwordSuccess}
        <p class="info">{passwordSuccess}</p>
      {/if}
      <button type="submit" class="theme-btn">Update password</button>
    </form>
  </div>

  <div class="setting-block danger-block">
    <h3>Delete account</h3>
    <p class="warn-text">Permanently deletes your account, messages, and associated passkeys. This cannot be undone.</p>
    <form onsubmit={(e) => { e.preventDefault(); handleDeleteAccount(); }}>
      <div class="form-group">
        <label for="del-pass">Confirm with your password</label>
        <input id="del-pass" type="password" bind:value={deletePassword} placeholder="Enter your password" />
      </div>
      {#if deleteErr}
        <p class="err">{deleteErr}</p>
      {/if}
      <button type="submit" class="theme-btn delete-btn"><Trash2 size={14} /> Delete account</button>
    </form>
  </div>
</div>
