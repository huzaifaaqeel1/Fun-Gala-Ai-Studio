import { SupportedLanguage } from '../types/tts';

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  // South Asian Languages
  { code: 'ur-PK', name: 'Urdu', nativeName: 'اردو (پاکستان)', region: 'Pakistani', isRtl: true, flag: '🇵🇰' },
  { code: 'hi-IN', name: 'Hindi', nativeName: 'हिन्दी (भारत)', region: 'Indian', isRtl: false, flag: '🇮🇳' },
  { code: 'pa-PK', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ / پنجابی', region: 'Pakistani/Indian', isRtl: false, flag: '🇵🇰' },
  { code: 'bn-BD', name: 'Bengali', nativeName: 'বাংলা', region: 'Bangladesh / India', isRtl: false, flag: '🇧🇩' },
  { code: 'ps-AF', name: 'Pashto', nativeName: 'پښتو', region: 'Pakistani / Afghan', isRtl: true, flag: '🇵🇰' },
  { code: 'sd-PK', name: 'Sindhi', nativeName: 'سنڌي', region: 'Pakistani (Sindh)', isRtl: true, flag: '🇵🇰' },
  { code: 'ta-IN', name: 'Tamil', nativeName: 'தமிழ்', region: 'India / Sri Lanka', isRtl: false, flag: '🇮🇳' },
  { code: 'te-IN', name: 'Telugu', nativeName: 'తెలుగు', region: 'India (Andhra/Telangana)', isRtl: false, flag: '🇮🇳' },

  // English Variations
  { code: 'en-US', name: 'English (US)', nativeName: 'English (United States)', region: 'American', isRtl: false, flag: '🇺🇸' },
  { code: 'en-GB', name: 'English (UK)', nativeName: 'English (Great Britain)', region: 'British', isRtl: false, flag: '🇬🇧' },
  { code: 'en-CA', name: 'English (Canada)', nativeName: 'English (Canadian)', region: 'Canadian', isRtl: false, flag: '🇨🇦' },
  { code: 'en-AU', name: 'English (Australia)', nativeName: 'English (Australian)', region: 'Australian', isRtl: false, flag: '🇦🇺' },

  // European Languages
  { code: 'fr-FR', name: 'French', nativeName: 'Français (France)', region: 'European French', isRtl: false, flag: '🇫🇷' },
  { code: 'fr-CA', name: 'French (Canada)', nativeName: 'Français (Québécois)', region: 'Canadian French', isRtl: false, flag: '🇨🇦' },
  { code: 'de-DE', name: 'German', nativeName: 'Deutsch', region: 'Germany', isRtl: false, flag: '🇩🇪' },
  { code: 'es-ES', name: 'Spanish', nativeName: 'Español', region: 'Spain & Latin America', isRtl: false, flag: '🇪🇸' },
  { code: 'it-IT', name: 'Italian', nativeName: 'Italiano', region: 'Italy', isRtl: false, flag: '🇮🇹' },
  { code: 'pt-BR', name: 'Portuguese', nativeName: 'Português', region: 'Brazil / Portugal', isRtl: false, flag: '🇧🇷' },
  { code: 'nl-NL', name: 'Dutch', nativeName: 'Nederlands', region: 'Netherlands', isRtl: false, flag: '🇳🇱' },
  { code: 'ru-RU', name: 'Russian', nativeName: 'Русский', region: 'Russia', isRtl: false, flag: '🇷🇺' },
  { code: 'tr-TR', name: 'Turkish', nativeName: 'Türkçe', region: 'Turkey', isRtl: false, flag: '🇹🇷' },
  { code: 'pl-PL', name: 'Polish', nativeName: 'Polski', region: 'Poland', isRtl: false, flag: '🇵🇱' },
  { code: 'sv-SE', name: 'Swedish', nativeName: 'Svenska', region: 'Sweden', isRtl: false, flag: '🇸🇪' },
  { code: 'no-NO', name: 'Norwegian', nativeName: 'Norsk', region: 'Norway', isRtl: false, flag: '🇳🇴' },
  { code: 'da-DK', name: 'Danish', nativeName: 'Dansk', region: 'Denmark', isRtl: false, flag: '🇩🇰' },
  { code: 'el-GR', name: 'Greek', nativeName: 'Ελληνικά', region: 'Greece', isRtl: false, flag: '🇬🇷' },

  // Middle Eastern Languages
  { code: 'ar-SA', name: 'Arabic', nativeName: 'العربية', region: 'Middle East', isRtl: true, flag: '🇸🇦' },
  { code: 'fa-IR', name: 'Persian / Farsi', nativeName: 'فارسی', region: 'Iran', isRtl: true, flag: '🇮🇷' },
  { code: 'he-IL', name: 'Hebrew', nativeName: 'עברית', region: 'Israel', isRtl: true, flag: '🇮🇱' },

  // Asian Languages
  { code: 'zh-CN', name: 'Chinese (Mandarin)', nativeName: '中文 (普通话)', region: 'China', isRtl: false, flag: '🇨🇳' },
  { code: 'ja-JP', name: 'Japanese', nativeName: '日本語', region: 'Japan', isRtl: false, flag: '🇯🇵' },
  { code: 'ko-KR', name: 'Korean', nativeName: '한국어', region: 'South Korea', isRtl: false, flag: '🇰🇷' },
  { code: 'id-ID', name: 'Indonesian', nativeName: 'Bahasa Indonesia', region: 'Indonesia', isRtl: false, flag: '🇮🇩' },
  { code: 'ms-MY', name: 'Malay', nativeName: 'Bahasa Melayu', region: 'Malaysia', isRtl: false, flag: '🇲🇾' },
  { code: 'th-TH', name: 'Thai', nativeName: 'ไทย', region: 'Thailand', isRtl: false, flag: '🇹🇭' },
  { code: 'vi-VN', name: 'Vietnamese', nativeName: 'Tiếng Việt', region: 'Vietnam', isRtl: false, flag: '🇻🇳' },
];

/**
 * Intelligent client-side language & script detector
 */
export function detectLanguageFromText(text: string): SupportedLanguage {
  const clean = text.trim();
  if (!clean) {
    return SUPPORTED_LANGUAGES[0]; // Default to Urdu
  }

  // Urdu specific characters and common words
  const urduSpecificRegex = /[\u0679\u0686\u0688\u0691\u0698\u06A9\u06AF\u06BA\u06BE\u06C1\u06D2]|(ایک|ہے|ہیں|تھا|تھی|تھے|اور|کے|کی|کا|میں|سے|پر|نہیں|رہتا|بات|گاؤں|کبوتر)/;
  if (urduSpecificRegex.test(clean)) {
    return SUPPORTED_LANGUAGES.find(l => l.code === 'ur-PK') || SUPPORTED_LANGUAGES[0];
  }

  // Arabic script general
  const arabicScriptRegex = /[\u0600-\u06FF\u0750-\u077F]/;
  if (arabicScriptRegex.test(clean)) {
    // Check if Persian
    if (/[\u067E\u0686\u0698\u06AF]/.test(clean) && /(است|این|برای|که|یک|می|را)/.test(clean)) {
      return SUPPORTED_LANGUAGES.find(l => l.code === 'fa-IR') || SUPPORTED_LANGUAGES[0];
    }
    // Default Arabic script to Urdu if it's the target focus or Arabic
    if (/(الله|في|من|إلى|على|هذا|الذي|عن|مع)/.test(clean)) {
      return SUPPORTED_LANGUAGES.find(l => l.code === 'ar-SA') || SUPPORTED_LANGUAGES[0];
    }
    return SUPPORTED_LANGUAGES.find(l => l.code === 'ur-PK') || SUPPORTED_LANGUAGES[0];
  }

  // Devanagari script (Hindi)
  const devanagariRegex = /[\u0900-\u097F]/;
  if (devanagariRegex.test(clean)) {
    return SUPPORTED_LANGUAGES.find(l => l.code === 'hi-IN')!;
  }

  // Bengali script
  if (/[\u0980-\u09FF]/.test(clean)) {
    return SUPPORTED_LANGUAGES.find(l => l.code === 'bn-BD')!;
  }

  // Tamil script
  if (/[\u0B80-\u0BFF]/.test(clean)) {
    return SUPPORTED_LANGUAGES.find(l => l.code === 'ta-IN')!;
  }

  // Telugu script
  if (/[\u0C00-\u0C7F]/.test(clean)) {
    return SUPPORTED_LANGUAGES.find(l => l.code === 'te-IN')!;
  }

  // Japanese (Hiragana/Katakana/Kanji)
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(clean)) {
    return SUPPORTED_LANGUAGES.find(l => l.code === 'ja-JP')!;
  }

  // Korean (Hangul)
  if (/[\uAC00-\uD7AF\u1100-\u11FF]/.test(clean)) {
    return SUPPORTED_LANGUAGES.find(l => l.code === 'ko-KR')!;
  }

  // Chinese (Hanzi)
  if (/[\u4E00-\u9FFF]/.test(clean)) {
    return SUPPORTED_LANGUAGES.find(l => l.code === 'zh-CN')!;
  }

  // Russian / Cyrillic
  if (/[\u0400-\u04FF]/.test(clean)) {
    return SUPPORTED_LANGUAGES.find(l => l.code === 'ru-RU')!;
  }

  // Greek
  if (/[\u0370-\u03FF]/.test(clean)) {
    return SUPPORTED_LANGUAGES.find(l => l.code === 'el-GR')!;
  }

  // Hebrew
  if (/[\u0590-\u05FF]/.test(clean)) {
    return SUPPORTED_LANGUAGES.find(l => l.code === 'he-IL')!;
  }

  // French (accented characters + typical keywords)
  if (/[éèêëàâçîïôûù]/.test(clean) || /(le|la|les|des|un|une|est|dans|avec|pour|ce|cette|bonjour|mon|notre)/i.test(clean)) {
    // Check if Canadian French indicators
    if (/(québec|montréal|icitte|magasiner|char|tiguidou|canadien)/i.test(clean)) {
      return SUPPORTED_LANGUAGES.find(l => l.code === 'fr-CA')!;
    }
    return SUPPORTED_LANGUAGES.find(l => l.code === 'fr-FR')!;
  }

  // German
  if (/[äöüß]/.test(clean) || /(und|ist|der|die|das|nicht|ein|eine|wir|sie|haben|werden)/i.test(clean)) {
    return SUPPORTED_LANGUAGES.find(l => l.code === 'de-DE')!;
  }

  // Spanish
  if (/[ñáíóú¿¡]/.test(clean) || /(el|la|los|las|un|una|es|en|por|para|con|pero|hola|gracias)/i.test(clean)) {
    return SUPPORTED_LANGUAGES.find(l => l.code === 'es-ES')!;
  }

  // Default to English (US) for standard Latin text
  return SUPPORTED_LANGUAGES.find(l => l.code === 'en-US')!;
}
