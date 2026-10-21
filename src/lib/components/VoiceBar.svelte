<script>
  import { API_HOST, WS_HOST } from '$lib/config.js';
  import { auth } from '$lib/stores.js';
  import Mic from '@lucide/svelte/icons/mic';
  import MicOff from '@lucide/svelte/icons/mic-off';
  import PhoneOff from '@lucide/svelte/icons/phone-off';

  let { voiceChatId = $bindable() } = $props();

  let voiceChannelName = $state('');
  let voiceParticipants = $state([]);
  let micMuted = $state(false);
  let voiceErr = $state('');
  let speakingIds = $state([]);

  let room = null;
  let remoteAudioEls = [];

  function participantName(p) {
    return p.name || p.identity || 'unknown';
  }

  function refreshParticipants() {
    if (!room) return;
    voiceParticipants = [room.localParticipant, ...Array.from(room.remoteParticipants.values())]
      .map((p) => ({ id: p.identity, name: participantName(p) }));
  }

  function playAudioTrack(track) {
    const el = track.attach();
    el.style.display = 'none';
    document.body.appendChild(el);
    remoteAudioEls.push(el);
  }

  function clearRemoteAudio() {
    for (const el of remoteAudioEls) el.remove();
    remoteAudioEls = [];
  }

  async function connect(chat) {
    if (!$auth.token) {
      voiceErr = 'Not signed in';
      return;
    }

    let res;
    try {
      res = await fetch(`${API_HOST}/api/voice/token`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${$auth.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chat.id })
      });
    } catch (e) {
      voiceErr = 'Could not reach the server';
      return;
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      voiceErr = data.error || 'Voice is unavailable right now';
      return;
    }

    try {
      const { Room, RoomEvent } = await import('livekit-client');
      room = new Room();
      room.on(RoomEvent.ParticipantConnected, refreshParticipants);
      room.on(RoomEvent.ParticipantDisconnected, refreshParticipants);
      room.on(RoomEvent.TrackSubscribed, (track) => {
        if (track.kind === 'audio') playAudioTrack(track);
      });
      room.on(RoomEvent.TrackUnsubscribed, (track) => track.detach().forEach((el) => el.remove()));
      room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
        speakingIds = speakers.map((p) => p.identity);
      });
      await room.connect(`${WS_HOST}/livekit`, data.token);
    } catch (e) {
      voiceErr = 'Could not join the voice room';
      room = null;
      return;
    }

    voiceChatId = chat.id;
    voiceChannelName = chat.name;
    try {
      await room.localParticipant.setMicrophoneEnabled(true);
    } catch (e) {
      voiceErr = 'Microphone access was denied or unavailable';
      micMuted = true;
    }
    refreshParticipants();
  }

  function reset() {
    clearRemoteAudio();
    speakingIds = [];
    voiceParticipants = [];
    voiceChannelName = '';
    voiceChatId = null;
    micMuted = false;
    room = null;
  }

  export async function join(chat) {
    if (chat.type !== 'voice' || voiceChatId === chat.id) return;
    voiceErr = '';
    if (voiceChatId) leave();
    await connect(chat);
  }

  export function leave() {
    if (!voiceChatId) return;
    if (room) {
      room.removeAllListeners();
      room.disconnect();
    }
    reset();
  }

  export function handleWsEvent() {
    // livekit handles it now
    return false;
  }

  function toggleMic() {
    if (!room) return;
    micMuted = !micMuted;
    room.localParticipant.setMicrophoneEnabled(!micMuted);
  }
</script>

{#if voiceChatId}
  <div class="voice-bar">
    <span class="voice-bar-label">
      <Mic size={14} /> {voiceChannelName}
      {#if voiceParticipants.length > 0}
        |
        {#each voiceParticipants as p, i}
          {#if i > 0},{/if}
          <span class:voice-speaking={speakingIds.includes(p.id)}>{p.name}</span>
        {/each}
      {/if}
    </span>
    <div class="voice-bar-actions">
      <button type="button" class="theme-btn" onclick={toggleMic}>
        {#if micMuted}
          <MicOff size={14} /> Unmute
        {:else}
          <Mic size={14} /> Mute
        {/if}
      </button>
      <button type="button" class="theme-btn delete-btn" onclick={leave}>
        <PhoneOff size={14} /> Leave
      </button>
    </div>
  </div>
{/if}
{#if voiceErr}
  <div class="voice-bar voice-bar-error">{voiceErr}</div>
{/if}
