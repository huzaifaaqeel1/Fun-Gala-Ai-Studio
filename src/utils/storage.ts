import { GeneratedAudioItem, VoiceSettings } from '../types/tts';

const HISTORY_KEY = 'tts_generation_history_v1';
const SETTINGS_KEY = 'tts_user_settings_v1';
const DRAFT_KEY = 'tts_editor_draft_v1';
const SELECTED_VOICE_URI_KEY = 'tts_selected_voice_uri_v1';

export interface UserAppSettings {
  selectedVoiceURI?: string | null;
  speechRate: number; // 0.5 to 2.0 (default 1.0)
  speechPitch: number; // 0.5 to 1.5 (default 1.0)
  speechVolume: number; // 0.0 to 1.0 (default 1.0)
  pauseBetweenSentencesMs: number; // default 250ms
  autoScrollHighlight: boolean;
  enableAutoRtl: boolean;
  defaultSettings?: VoiceSettings;
}

export const DEFAULT_APP_SETTINGS: UserAppSettings = {
  selectedVoiceURI: null,
  speechRate: 1.0,
  speechPitch: 1.0,
  speechVolume: 1.0,
  pauseBetweenSentencesMs: 250,
  autoScrollHighlight: true,
  enableAutoRtl: true,
};

export function getStoredHistory(): GeneratedAudioItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveToStoredHistory(item: GeneratedAudioItem): void {
  try {
    const history = getStoredHistory();
    const existingIndex = history.findIndex((h) => h.id === item.id);
    if (existingIndex >= 0) {
      history[existingIndex] = item;
    } else {
      history.unshift(item);
    }
    // keep maximum 50 recent items in local storage
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 50)));
  } catch (e) {
    console.error('Failed to save to local storage history:', e);
  }
}

export function deleteFromStoredHistory(id: string): void {
  try {
    const history = getStoredHistory().filter((h) => h.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (e) {
    console.error('Failed to delete from local history:', e);
  }
}

export function getAppSettings(): UserAppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      return { ...DEFAULT_APP_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (e) {}
  return DEFAULT_APP_SETTINGS;
}

export function saveAppSettings(settings: Partial<UserAppSettings>): UserAppSettings {
  try {
    const current = getAppSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    return DEFAULT_APP_SETTINGS;
  }
}

export function getStoredDraft(): string {
  try {
    return localStorage.getItem(DRAFT_KEY) || '';
  } catch {
    return '';
  }
}

export function saveStoredDraft(text: string): void {
  try {
    localStorage.setItem(DRAFT_KEY, text);
  } catch {}
}

export function getStoredVoiceURI(): string | null {
  try {
    return localStorage.getItem(SELECTED_VOICE_URI_KEY);
  } catch {
    return null;
  }
}

export function saveStoredVoiceURI(uri: string): void {
  try {
    localStorage.setItem(SELECTED_VOICE_URI_KEY, uri);
  } catch {}
}
