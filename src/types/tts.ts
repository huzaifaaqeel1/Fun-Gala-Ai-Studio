export type VoiceGender = 'male' | 'female' | 'neutral' | 'character';

export type VoiceCategory =
  | 'Ultra Deep Bass Male'
  | 'Deep Bass Male'
  | 'Rich Baritone Male'
  | 'Deep Baritone Male'
  | 'Powerful Deep Male'
  | 'Mature Deep Male'
  | 'Cinematic Deep Male'
  | 'Motivational Male'
  | 'Deep Motivational Narrator'
  | 'Strong Authoritative Male'
  | 'Young Male'
  | 'Deep Male'
  | 'Mature Male'
  | 'Professional Male'
  | 'Friendly Male'
  | 'Emotional Male'
  | 'Storytelling Male'
  | 'Documentary Narrator'
  | 'News Presenter'
  | 'Cinematic Narrator'
  | 'Rich & Warm Female'
  | 'Natural Female'
  | 'Mature Deep Female'
  | 'Motivational Female'
  | 'Young Female'
  | 'Soft Female'
  | 'Deep Female'
  | 'Professional Female'
  | 'Friendly Female'
  | 'Emotional Female'
  | 'Storytelling Female'
  | 'Child Voice'
  | 'Elderly Voice'
  | 'Cartoon Voice'
  | 'Energetic Voice'
  | 'Calm Voice'
  | 'Dramatic Voice'
  | 'Educational Narrator'
  | 'Audiobook Narrator';

export type VoiceEmotion =
  | 'Neutral'
  | 'Happy'
  | 'Sad'
  | 'Angry'
  | 'Excited'
  | 'Calm'
  | 'Emotional'
  | 'Suspenseful'
  | 'Storytelling'
  | 'Professional'
  | 'Dramatic'
  | 'Friendly'
  | 'Serious'
  | 'Documentary';

export interface VoiceModel {
  id: string;
  name: string;
  gender: VoiceGender;
  category: VoiceCategory;
  language: string;
  languageCode: string;
  accent: string;
  description: string;
  sampleText: string;
  isUrduSpecialist?: boolean;
  isHindiSpecialist?: boolean;
  prebuiltVoice?: string; // e.g. 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr', 'Aoede'
  elevenLabsVoiceId?: string;
  recommendedStyles?: VoiceEmotion[];
  tags: string[];
}

export interface VoiceSettings {
  speed: number; // 0.5 to 2.0
  pitch: number; // -10 to +10 or 0.5 to 1.5
  stability: number; // 0% to 100%
  similarity: number; // 0% to 100%
  expressiveness: number; // 0% to 100%
  pauseBetweenSentences: number; // 0.1s to 2.0s
  emotion: VoiceEmotion;
}

export interface GeneratedAudioItem {
  id: string;
  title: string;
  text: string;
  voiceId: string;
  voiceName: string;
  language: string;
  accent: string;
  createdAt: number;
  duration: number; // in seconds
  audioUrl: string; // base64 data URI or public path
  format: 'mp3' | 'wav';
  wordCount: number;
  isFavorite?: boolean;
}

export interface GenerationProgress {
  isGenerating: boolean;
  currentSection: number;
  totalSections: number;
  statusMessage: string;
  progressPercent: number;
}

export type SupportedLanguage = {
  code: string;
  name: string;
  nativeName: string;
  region: string;
  isRtl?: boolean;
  flag?: string;
};

export interface LongTtsSection {
  index: number;
  text: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  audioPath?: string;
  error?: string;
}

export interface LongTtsJob {
  id: string;
  text: string;
  voiceId: string;
  voiceName: string;
  language: string;
  languageCode: string;
  accent: string;
  prebuiltVoice: string;
  provider: 'gemini' | 'elevenlabs';
  totalCharacters: number;
  totalWords: number;
  totalSections: number;
  completedSections: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  statusMessage: string;
  progressPercent: number;
  sections: LongTtsSection[];
  finalAudioUrl?: string;
  finalDuration?: number;
  createdAt: number;
  updatedAt: number;
}

export type SpeechPlaybackStatus = 'idle' | 'speaking' | 'paused' | 'stopped';

export interface BrowserVoiceInfo {
  voiceURI: string;
  name: string;
  lang: string;
  isUrdu: boolean;
  isPakistaniUrdu: boolean;
  gender: 'male' | 'female' | 'neutral';
  default: boolean;
  localService: boolean;
}
