/**
 * Browser-native Web Speech API (SpeechSynthesis) Manager
 * 100% Free • Private Personal Use • No External APIs or Keys Required
 */

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

export interface SentenceToken {
  id: number;
  text: string;
  trimmedText: string;
}

export interface SpeechSettings {
  rate: number; // 0.5 to 2.0
  pitch: number; // 0.5 to 1.5
  volume: number; // 0.0 to 1.0
  pauseBetweenSentencesMs: number; // 100 to 1500ms
  autoScrollHighlight: boolean;
}

export const DEFAULT_SPEECH_SETTINGS: SpeechSettings = {
  rate: 1.0,
  pitch: 1.0,
  volume: 1.0,
  pauseBetweenSentencesMs: 250,
  autoScrollHighlight: true,
};



/**
 * Split Urdu, Hindi, or English narrative text into natural spoken sentences.
 * Recognizes:
 * - Urdu full stop (۔ \u06D4), Arabic question (؟ \u061F)
 * - Hindi Purna Viram (। \u0964), Deergh Viram (॥ \u0965)
 * - Standard exclamation (!), question (?), period (.), semicolons, and paragraph breaks.
 */
export function splitNarrativeSentences(text: string): SentenceToken[] {
  if (!text || !text.trim()) return [];

  // Split by sentence terminators: Urdu '۔', Hindi '।', '॥', '؟', '?', '!', '.', and newline blocks
  const regex = /[^۔।॥؟!?.\r\n]+[۔।॥؟!?.\r\n]*/g;
  const matches = text.match(regex);

  if (!matches || matches.length === 0) {
    return [{ id: 0, text, trimmedText: text.trim() }];
  }

  const tokens: SentenceToken[] = [];
  let idx = 0;

  for (const chunk of matches) {
    const trimmed = chunk.trim();
    if (!trimmed) continue;

    // If an individual chunk is unusually long without punctuation (>250 chars), break by comma/words
    if (trimmed.length > 280) {
      const subParts = trimmed.split(/([،,؛;\n]+)/);
      let buffer = '';
      for (const part of subParts) {
        if ((buffer + part).length > 200 && buffer.trim()) {
          tokens.push({ id: idx++, text: buffer, trimmedText: buffer.trim() });
          buffer = part;
        } else {
          buffer += part;
        }
      }
      if (buffer.trim()) {
        tokens.push({ id: idx++, text: buffer, trimmedText: buffer.trim() });
      }
    } else {
      tokens.push({ id: idx++, text: chunk, trimmedText: trimmed });
    }
  }

  return tokens.length > 0 ? tokens : [{ id: 0, text, trimmedText: text.trim() }];
}

/**
 * Backward compatibility alias for Urdu
 */
export const splitUrduSentences = splitNarrativeSentences;

/**
 * Determine if a voice belongs to Hindi (hi / hi-IN / हिन्दी)
 * Accurately detects Windows SAPI5 / OneCore, Google हिन्दी, Edge Kalpana / Hemant / Madhur, Apple Lekha / Nil
 */
export function isVoiceHindi(voice: SpeechSynthesisVoice): boolean {
  if (!voice) return false;
  const lang = (voice.lang || '').toLowerCase().replace(/_/g, '-');
  const name = (voice.name || '').toLowerCase();
  const uri = (voice.voiceURI || '').toLowerCase();

  return (
    lang === 'hi' ||
    lang.startsWith('hi-') ||
    lang.startsWith('hin') ||
    name.includes('hindi') ||
    name.includes('हिन्दी') ||
    name.includes('हिंदी') ||
    name.includes('hemant') ||
    name.includes('kalpana') ||
    name.includes('madhur') ||
    name.includes('swara') ||
    name.includes('lekha') ||
    name.includes('neerja') ||
    name.includes('aarav') ||
    uri.includes('hindi') ||
    uri.includes('hemant') ||
    uri.includes('kalpana') ||
    uri.includes('madhur')
  );
}

/**
 * Determine if a voice is specifically Indian Hindi (hi-IN)
 */
export function isVoiceIndianHindi(voice: SpeechSynthesisVoice): boolean {
  if (!voice) return false;
  const lang = (voice.lang || '').toLowerCase().replace(/_/g, '-');
  return isVoiceHindi(voice) && (lang.includes('-in') || lang === 'hi-in' || lang === 'hi');
}

/**
 * Determine if a voice belongs to English
 */
export function isVoiceEnglish(voice: SpeechSynthesisVoice): boolean {
  if (!voice) return false;
  const lang = (voice.lang || '').toLowerCase().replace(/_/g, '-');
  return lang === 'en' || lang.startsWith('en-');
}

/**
 * Determine if a voice name, lang code, or URI belongs to Urdu
 * Accurately catches Windows SAPI5 / OneCore, Microsoft Edge, and Chrome Google voices
 */
export function isVoiceUrdu(voice: SpeechSynthesisVoice): boolean {
  if (!voice) return false;
  const lang = (voice.lang || '').toLowerCase().replace(/_/g, '-');
  const name = (voice.name || '').toLowerCase();
  const uri = (voice.voiceURI || '').toLowerCase();

  return (
    lang === 'ur' ||
    lang.startsWith('ur-') ||
    lang.startsWith('urd') ||
    name.includes('urdu') ||
    name.includes('اردو') ||
    name.includes('asad') ||
    name.includes('uzma') ||
    name.includes('salman') ||
    name.includes('pakistan') ||
    name.includes('پاکستان') ||
    uri.includes('urdu') ||
    uri.includes('asad') ||
    uri.includes('uzma') ||
    uri.includes('salman')
  );
}

/**
 * Determine if a voice is specifically Pakistani Urdu (ur-PK)
 * Specifically detects Microsoft Asad, Microsoft Uzma, Microsoft Salman, Google Urdu, etc.
 */
export function isVoicePakistaniUrdu(voice: SpeechSynthesisVoice): boolean {
  if (!voice) return false;
  const lang = (voice.lang || '').toLowerCase().replace(/_/g, '-');
  const name = (voice.name || '').toLowerCase();
  const uri = (voice.voiceURI || '').toLowerCase();

  return (
    lang === 'ur-pk' ||
    lang.startsWith('ur-pk') ||
    lang.includes('-pk') ||
    name.includes('pakistan') ||
    name.includes('پاکستان') ||
    name.includes('pk') ||
    name.includes('asad') ||
    name.includes('uzma') ||
    name.includes('salman') ||
    uri.includes('pk') ||
    uri.includes('asad') ||
    uri.includes('uzma') ||
    uri.includes('salman')
  );
}

/**
 * Guess voice gender from voice name or metadata heuristics
 */
export function guessVoiceGender(voice: SpeechSynthesisVoice): 'male' | 'female' | 'neutral' {
  if (!voice) return 'neutral';
  const name = (voice.name || '').toLowerCase();
  const uri = (voice.voiceURI || '').toLowerCase();
  const combined = `${name} ${uri}`;

  // Urdu & Hindi male voices and generic male keywords
  const maleKeywords = [
    'asad',
    'salman',
    'tariq',
    'bilal',
    'farhan',
    'imran',
    'rashid',
    'hamza',
    'usman',
    'kamran',
    'waqas',
    'hemant',
    'madhur',
    'aarav',
    'kabir',
    'vikram',
    'rohit',
    'arjun',
    'dev',
    'anil',
    'sanjay',
    'amit',
    'male',
    'man',
    'david',
    'george',
    'mark',
    'james',
    'john',
    'daniel',
    'paul',
    'richard',
    'guy',
    'stefan',
    'bruce',
    'fred',
    'alex',
  ];

  // Urdu & Hindi female voices and generic female keywords
  const femaleKeywords = [
    'uzma',
    'zoya',
    'sadia',
    'ayesha',
    'mehwish',
    'maryam',
    'bushra',
    'saba',
    'zainab',
    'hina',
    'rubina',
    'kalpana',
    'swara',
    'lekha',
    'neerja',
    'ananya',
    'priya',
    'meera',
    'sunita',
    'kavita',
    'pooja',
    'female',
    'woman',
    'zira',
    'susan',
    'hazel',
    'mary',
    'samantha',
    'karen',
    'victoria',
    'catherine',
    'joana',
    'fiona',
    'helena',
  ];

  for (const m of maleKeywords) {
    if (combined.includes(m)) return 'male';
  }
  for (const f of femaleKeywords) {
    if (combined.includes(f)) return 'female';
  }

  return 'neutral';
}

/**
 * Diagnostic status type
 */
export type VoiceDiagnosticStatus =
  | 'Urdu voice detected'
  | 'Urdu voice not detected'
  | 'Browser voice list loading'
  | 'Speech synthesis unavailable';

export interface VoiceDiagnostics {
  isSupported: boolean;
  totalVoices: number;
  urduVoicesCount: number;
  urduVoiceNames: string[];
  selectedVoiceName: string | null;
  selectedVoiceLang: string | null;
  status: VoiceDiagnosticStatus;
  statusDetail: string;
}

export function evaluateVoiceDiagnostics(
  voices: SpeechSynthesisVoice[],
  selectedVoice: SpeechSynthesisVoice | null,
  isLoading: boolean
): VoiceDiagnostics {
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  if (!isSupported) {
    return {
      isSupported: false,
      totalVoices: 0,
      urduVoicesCount: 0,
      urduVoiceNames: [],
      selectedVoiceName: null,
      selectedVoiceLang: null,
      status: 'Speech synthesis unavailable',
      statusDetail: 'Your current browser or environment does not support the Web Speech API.',
    };
  }

  if (isLoading && voices.length === 0) {
    return {
      isSupported: true,
      totalVoices: 0,
      urduVoicesCount: 0,
      urduVoiceNames: [],
      selectedVoiceName: null,
      selectedVoiceLang: null,
      status: 'Browser voice list loading',
      statusDetail: 'Polling system speech synthesis for installed voices...',
    };
  }

  const urduList = voices.filter(isVoiceUrdu);
  const urduNames = urduList.map((v) => `${v.name} (${v.lang})`);

  if (urduList.length > 0) {
    return {
      isSupported: true,
      totalVoices: voices.length,
      urduVoicesCount: urduList.length,
      urduVoiceNames: urduNames,
      selectedVoiceName: selectedVoice ? selectedVoice.name : urduList[0].name,
      selectedVoiceLang: selectedVoice ? selectedVoice.lang : urduList[0].lang,
      status: 'Urdu voice detected',
      statusDetail: `Detected ${urduList.length} Urdu voice(s): ${urduNames.join(', ')}`,
    };
  }

  return {
    isSupported: true,
    totalVoices: voices.length,
    urduVoicesCount: 0,
    urduVoiceNames: [],
    selectedVoiceName: selectedVoice ? selectedVoice.name : null,
    selectedVoiceLang: selectedVoice ? selectedVoice.lang : null,
    status: 'Urdu voice not detected',
    statusDetail: `Found ${voices.length} device voices, but none matched Urdu (ur-PK / Urdu).`,
  };
}

const GUIDE_DISMISSED_KEY = 'tts_urdu_guide_dismissed_v1';

export function isUrduGuideDismissed(): boolean {
  try {
    return localStorage.getItem(GUIDE_DISMISSED_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setUrduGuideDismissed(dismissed: boolean): void {
  try {
    if (dismissed) {
      localStorage.setItem(GUIDE_DISMISSED_KEY, 'true');
    } else {
      localStorage.removeItem(GUIDE_DISMISSED_KEY);
    }
  } catch {}
}
