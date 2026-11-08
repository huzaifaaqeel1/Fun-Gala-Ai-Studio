import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Volume2,
  VolumeX,
  Sliders,
  Sparkles,
  AlignRight,
  AlignLeft,
  Trash2,
  Copy,
  Check,
  BookOpen,
  Info,
  AlertTriangle,
  RefreshCw,
  Globe,
  ChevronDown,
  Layers,
  FileText,
  BookmarkPlus,
  SkipBack,
  SkipForward,
  Cpu,
  Download,
  Loader2,
  Wand2,
} from 'lucide-react';
import {
  splitNarrativeSentences,
  isVoiceUrdu,
  isVoicePakistaniUrdu,
  isVoiceHindi,
  isVoiceIndianHindi,
  isVoiceEnglish,
  guessVoiceGender,
  SentenceToken,
  evaluateVoiceDiagnostics,
  isUrduGuideDismissed,
  setUrduGuideDismissed,
} from '../utils/speechSynthesis';
import { SAMPLE_STORIES, SampleStory } from '../data/sampleStories';
import { AI_VOICES } from '../data/voices';
import { UrduVoiceGuideModal } from './UrduVoiceGuideModal';
import { AudioPlayer } from './AudioPlayer';
import { GeneratedAudioItem, VoiceModel } from '../types/tts';
import { UserAppSettings, saveStoredVoiceURI, getStoredVoiceURI } from '../utils/storage';

interface TextToSpeechDashboardProps {
  onSaveStory?: (item: GeneratedAudioItem) => void;
  appSettings: UserAppSettings;
  draftText: string;
  onSaveDraft: (text: string) => void;
  onOpenVoiceLibrary?: () => void;
  selectedVoiceURI?: string | null;
  onSelectVoiceURI?: (uri: string) => void;
  voices?: SpeechSynthesisVoice[];
  selectedVoice?: SpeechSynthesisVoice | null;
  isLoadingVoices?: boolean;
  onRefreshVoices?: () => void;
}

export const TextToSpeechDashboard: React.FC<TextToSpeechDashboardProps> = ({
  onSaveStory,
  appSettings,
  draftText,
  onSaveDraft,
  onOpenVoiceLibrary,
  selectedVoiceURI: externalVoiceURI,
  onSelectVoiceURI,
  voices: propVoices,
  selectedVoice: propSelectedVoice,
  isLoadingVoices: propIsLoadingVoices,
  onRefreshVoices: propOnRefreshVoices,
}) => {
  // Selected Language: 'Hindi' | 'Urdu' | 'English'
  const [selectedLanguage, setSelectedLanguage] = useState<'Hindi' | 'Urdu' | 'English'>('Hindi');
  const [selectedGender, setSelectedGender] = useState<'all' | 'male' | 'female'>('all');

  // Text Editor State (Default to rich Hindi story preset)
  const [text, setText] = useState<string>(
    draftText ||
      `एक समय की बात है, एक हरे-भरे जंगल के पास एक ईमानदार लकड़हारा रहता था। वह प्रतिदिन जंगल से सूखी लकड़ियां काटकर अपने परिवार का भरण-पोषण करता था।\n\nएक दिन नदी किनारे उसकी कुल्हाड़ी गहरी जलधारा में गिर गई। नदी की देवी ने उसकी सच्ची निष्ठा और ईमानदारी देखकर उसे सोने, चांदी और लोहे की तीनों कुल्हाड़ियां उपहार में भेंट कर दीं। सत्य और ईमानदारी का मार्ग ही मनुष्य का सच्चा गौरव है।`
  );
  const [isRtl, setIsRtl] = useState(false);
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // High-fidelity Downloadable Audio Generation State
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generatedAudio, setGeneratedAudio] = useState<GeneratedAudioItem | null>(null);
  const [selectedAIVoiceId, setSelectedAIVoiceId] = useState<string>('hindi-aarav-cinematic');

  // Local Browser SpeechSynthesis Voices state (synchronized with props or standalone)
  const [localVoices, setLocalVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [localSelectedVoice, setLocalSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [isLocalVoiceLoading, setIsLocalVoiceLoading] = useState(true);

  // Effective voices & selected voice
  const availableVoices = propVoices && propVoices.length > 0 ? propVoices : localVoices;
  const selectedVoice = propSelectedVoice !== undefined ? propSelectedVoice : localSelectedVoice;
  const isVoiceLoading = propIsLoadingVoices !== undefined ? propIsLoadingVoices : isLocalVoiceLoading;

  // Filtered browser voices by language
  const urduVoices = availableVoices.filter(isVoiceUrdu);
  const hindiVoices = availableVoices.filter(isVoiceHindi);
  const englishVoices = availableVoices.filter(isVoiceEnglish);

  const hasUrduVoice = urduVoices.length > 0;
  const hasHindiVoice = hindiVoices.length > 0;

  // Voice Controls
  const [rate, setRate] = useState<number>(appSettings.speechRate || 1.0);
  const [pitch, setPitch] = useState<number>(appSettings.speechPitch || 1.0);
  const [volume, setVolume] = useState<number>(appSettings.speechVolume || 1.0);

  // Playback & Story Progression State (Browser Web Speech)
  const [playbackStatus, setPlaybackStatus] = useState<'idle' | 'speaking' | 'paused' | 'stopped'>('idle');
  const [sentences, setSentences] = useState<SentenceToken[]>([]);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'editor' | 'reader'>('editor');
  const [showSamplesDropdown, setShowSamplesDropdown] = useState(false);
  const [showVoiceGuideModal, setShowVoiceGuideModal] = useState(false);
  const [showDiagnosticsBanner, setShowDiagnosticsBanner] = useState(false);

  // SpeechSynthesis active utterance reference
  const isPlayingRef = useRef(false);
  const sentenceIndexRef = useRef(0);
  const activeSentenceCardRef = useRef<HTMLDivElement | null>(null);

  // Function to refresh browser voices
  const refreshBrowserVoices = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsLocalVoiceLoading(false);
      return;
    }

    const allVoices = window.speechSynthesis.getVoices();
    setLocalVoices(allVoices);

    // Auto-select best voice according to current selected language
    const storedURI = externalVoiceURI || getStoredVoiceURI();
    let matchedVoice: SpeechSynthesisVoice | null = null;

    if (storedURI) {
      matchedVoice = allVoices.find((v) => v.voiceURI === storedURI) || null;
    }

    if (!matchedVoice) {
      if (selectedLanguage === 'Hindi') {
        const hindi = allVoices.filter(isVoiceHindi);
        if (hindi.length > 0) {
          const inHindi = hindi.find(isVoiceIndianHindi);
          matchedVoice = inHindi || hindi[0];
        }
      } else if (selectedLanguage === 'Urdu') {
        const urdu = allVoices.filter(isVoiceUrdu);
        if (urdu.length > 0) {
          const pakistani = urdu.find(isVoicePakistaniUrdu);
          matchedVoice = pakistani || urdu[0];
        }
      } else {
        const english = allVoices.filter(isVoiceEnglish);
        if (english.length > 0) matchedVoice = english[0];
      }
    }

    if (matchedVoice) {
      setLocalSelectedVoice(matchedVoice);
      if (onSelectVoiceURI) onSelectVoiceURI(matchedVoice.voiceURI);
    }

    setIsLocalVoiceLoading(false);

    if (propOnRefreshVoices) {
      propOnRefreshVoices();
    }
  }, [externalVoiceURI, onSelectVoiceURI, propOnRefreshVoices, selectedLanguage]);

  // Initial load and voice polling
  useEffect(() => {
    refreshBrowserVoices();

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = refreshBrowserVoices;
      window.speechSynthesis.addEventListener('voiceschanged', refreshBrowserVoices);
    }

    // Poll up to 5 times (first 1.5 seconds) in case Chrome populates voices asynchronously
    let pollCount = 0;
    const pollTimer = setInterval(() => {
      pollCount++;
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const v = window.speechSynthesis.getVoices();
        if (v.length > 0) {
          refreshBrowserVoices();
          clearInterval(pollTimer);
        }
      }
      if (pollCount > 6) clearInterval(pollTimer);
    }, 250);

    return () => {
      clearInterval(pollTimer);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.removeEventListener('voiceschanged', refreshBrowserVoices);
      }
    };
  }, [refreshBrowserVoices]);

  // Sync external voice selection if provided
  useEffect(() => {
    if (externalVoiceURI && availableVoices.length > 0) {
      const found = availableVoices.find((v) => v.voiceURI === externalVoiceURI);
      if (found) {
        setLocalSelectedVoice(found);
      }
    }
  }, [externalVoiceURI, availableVoices]);

  // Keep sentence tokens updated as text changes
  useEffect(() => {
    const tokens = splitNarrativeSentences(text);
    setSentences(tokens);
    onSaveDraft(text);
  }, [text, onSaveDraft]);

  // Clean stop on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      isPlayingRef.current = false;
    };
  }, []);

  // Auto-scroll active sentence in reader mode
  useEffect(() => {
    if (viewMode === 'reader' && activeSentenceCardRef.current && appSettings.autoScrollHighlight) {
      activeSentenceCardRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [currentSentenceIndex, viewMode, appSettings.autoScrollHighlight]);

  // Speak single sentence sequentially via Web Speech API
  const speakSentenceAtIndex = (index: number) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (index >= sentences.length || index < 0) {
      // Reached the end of the story
      setPlaybackStatus('idle');
      isPlayingRef.current = false;
      sentenceIndexRef.current = 0;
      setCurrentSentenceIndex(0);
      return;
    }

    const token = sentences[index];
    if (!token || !token.trimmedText) {
      // Skip blank
      speakSentenceAtIndex(index + 1);
      return;
    }

    // Cancel any hanging utterance
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(token.trimmedText);

    // Set voice and language locale
    const targetLangCode = selectedLanguage === 'Hindi' ? 'hi-IN' : selectedLanguage === 'Urdu' ? 'ur-PK' : 'en-US';

    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang || targetLangCode;
    } else if (selectedLanguage === 'Hindi' && hindiVoices.length > 0) {
      utterance.voice = hindiVoices[0];
      utterance.lang = hindiVoices[0].lang || 'hi-IN';
    } else if (selectedLanguage === 'Urdu' && urduVoices.length > 0) {
      utterance.voice = urduVoices[0];
      utterance.lang = urduVoices[0].lang || 'ur-PK';
    } else {
      utterance.lang = targetLangCode;
    }

    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    utterance.onstart = () => {
      setPlaybackStatus('speaking');
      isPlayingRef.current = true;
      setCurrentSentenceIndex(index);
      sentenceIndexRef.current = index;
    };

    utterance.onend = () => {
      if (!isPlayingRef.current) return;
      const pauseDelay = appSettings.pauseBetweenSentencesMs || 250;
      setTimeout(() => {
        if (isPlayingRef.current) {
          speakSentenceAtIndex(index + 1);
        }
      }, pauseDelay);
    };

    utterance.onerror = (e) => {
      if (e.error === 'canceled' || e.error === 'interrupted') {
        return;
      }
      console.warn('SpeechSynthesis sentence event:', e);
      if (isPlayingRef.current) {
        speakSentenceAtIndex(index + 1);
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  // User Playback Controls for Browser Web Speech
  const handleStartSpeak = (fromIndex: number = currentSentenceIndex) => {
    if (!text.trim()) return;
    if (sentences.length === 0) return;

    setPlaybackStatus('speaking');
    isPlayingRef.current = true;
    speakSentenceAtIndex(fromIndex);
  };

  const handlePause = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
      setPlaybackStatus('paused');
      isPlayingRef.current = false;
    }
  };

  const handleResume = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setPlaybackStatus('speaking');
        isPlayingRef.current = true;
      } else {
        handleStartSpeak(currentSentenceIndex);
      }
    }
  };

  const handleStop = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      isPlayingRef.current = false;
      window.speechSynthesis.cancel();
    }
    setPlaybackStatus('stopped');
    setCurrentSentenceIndex(0);
    sentenceIndexRef.current = 0;
  };

  // Real Audio Generation (Calls /api/tts/generate to produce authentic downloadable WAV/MP3)
  const handleGenerateAudio = async () => {
    if (!text.trim()) return;
    setIsGeneratingAudio(true);
    setGenerationError(null);

    // Stop any live speech synthesis
    handleStop();

    // Find the chosen AI voice model
    const matchedVoiceModel = AI_VOICES.find((v) => v.id === selectedAIVoiceId) ||
      AI_VOICES.find((v) => v.language === selectedLanguage && (selectedGender === 'all' || v.gender === selectedGender)) ||
      AI_VOICES[0];

    const voicePrebuilt = matchedVoiceModel.prebuiltVoice || (matchedVoiceModel.gender === 'female' ? 'Kore' : 'Fenrir');
    const langCode = selectedLanguage === 'Hindi' ? 'hi-IN' : selectedLanguage === 'Urdu' ? 'ur-PK' : 'en-US';

    try {
      const response = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          voiceId: matchedVoiceModel.id,
          voiceName: matchedVoiceModel.name,
          language: selectedLanguage,
          languageCode: langCode,
          accent: matchedVoiceModel.accent,
          prebuiltVoice: voicePrebuilt,
          settings: {
            speed: rate,
            pitch,
            stability: 75,
            similarity: 85,
          },
          provider: 'gemini',
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate speech audio.');
      }

      const firstWords = text.trim().split(/\s+/).slice(0, 6).join(' ');
      const newAudioItem: GeneratedAudioItem = {
        id: `gen_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: `${matchedVoiceModel.name} — ${firstWords}...`,
        text: text.trim(),
        voiceId: matchedVoiceModel.id,
        voiceName: matchedVoiceModel.name,
        language: selectedLanguage,
        accent: matchedVoiceModel.accent,
        createdAt: Date.now(),
        duration: data.durationEstimate || Math.max(1, Math.round(text.split(/\s+/).length / 2.5)),
        audioUrl: data.audioUrl,
        format: data.format || 'wav',
        wordCount: text.split(/\s+/).length,
      };

      setGeneratedAudio(newAudioItem);
      if (onSaveStory) {
        onSaveStory(newAudioItem);
      }
    } catch (err: any) {
      console.error('Audio Generation error:', err);
      setGenerationError(err.message || 'An error occurred during voice generation.');
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handleRestart = () => {
    handleStop();
    setTimeout(() => {
      handleStartSpeak(0);
    }, 150);
  };

  const handleSelectVoiceChange = (voiceURI: string) => {
    const found = availableVoices.find((v) => v.voiceURI === voiceURI);
    if (found) {
      setLocalSelectedVoice(found);
      saveStoredVoiceURI(voiceURI);
      if (onSelectVoiceURI) onSelectVoiceURI(voiceURI);
    }
  };

  const handleLoadSample = (sample: SampleStory) => {
    setText(sample.text);
    if (sample.languageCode === 'hi-IN') {
      setSelectedLanguage('Hindi');
      setIsRtl(false);
      setSelectedAIVoiceId('hindi-aarav-cinematic');
    } else if (sample.languageCode === 'ur-PK' || sample.isUrdu) {
      setSelectedLanguage('Urdu');
      setIsRtl(true);
      setSelectedAIVoiceId('urdu-tariq-master');
    } else {
      setSelectedLanguage('English');
      setIsRtl(false);
      setSelectedAIVoiceId('en-james-narrator');
    }
    setShowSamplesDropdown(false);
    handleStop();
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToHistory = () => {
    if (!text.trim()) return;
    const firstWords = text.trim().split(/\s+/).slice(0, 6).join(' ');
    const title = `${selectedVoice?.name || 'Urdu Voice'} — ${firstWords}...`;

    const item: GeneratedAudioItem = {
      id: `story_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title,
      text: text.trim(),
      voiceId: selectedVoice?.voiceURI || 'browser-voice',
      voiceName: selectedVoice?.name || 'Browser Urdu Voice',
      language: selectedVoice?.lang || 'Urdu (ur-PK)',
      accent: isVoicePakistaniUrdu(selectedVoice as any) ? 'Pakistani (ur-PK)' : 'Urdu',
      createdAt: Date.now(),
      duration: Math.max(1, Math.round(text.split(/\s+/).length / 2.3)),
      audioUrl: '', // Web Speech synthesizes live
      format: 'wav',
      wordCount: text.split(/\s+/).length,
    };

    if (onSaveStory) {
      onSaveStory(item);
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  // Stats
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;
  const estimatedSeconds = Math.max(1, Math.round(wordCount / (2.2 * rate)));
  const estMins = Math.floor(estimatedSeconds / 60);
  const estSecs = estimatedSeconds % 60;
  const estimatedDuration = `${estMins > 0 ? `${estMins}m ` : ''}${estSecs}s`;

  // Diagnostics evaluation
  const diagnostics = evaluateVoiceDiagnostics(
    availableVoices,
    selectedVoice,
    isVoiceLoading
  );

  return (
    <div className="space-y-6">
      {/* OS Voice Guide Modal (ONLY opens when user explicitly clicks it or requests it) */}
      <UrduVoiceGuideModal
        isOpen={showVoiceGuideModal}
        onClose={() => setShowVoiceGuideModal(false)}
        onRefreshVoices={refreshBrowserVoices}
      />

      {/* 1. TOP HEADER & MULTILINGUAL LANGUAGE SELECTOR BANNER */}
      <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-r from-violet-950/40 via-indigo-950/30 to-slate-900/70 p-5 backdrop-blur-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-0.5 text-xs font-semibold text-emerald-400 flex items-center space-x-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>100% Free • No Subscription • Personal Studio</span>
              </span>
              <span className="rounded-full bg-violet-500/20 border border-violet-500/30 px-2.5 py-0.5 text-xs font-semibold text-violet-300">
                AI Voice Generation & Web Speech
              </span>
              <span className="rounded-full bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-0.5 text-xs font-medium text-cyan-300">
                Real WAV/MP3 Downloads
              </span>
            </div>

            <h1 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
              AI Text-to-Speech Generator
            </h1>
            <p className="mt-1 text-xs text-slate-300 max-w-2xl leading-relaxed">
              Create human-like speech from any Hindi, Pakistani Urdu, or English story. Listen instantly or download 24kHz studio-grade audio files.
            </p>
          </div>

          {/* Language Switcher Buttons & Utility Tools */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Direct Language Switcher */}
            <div className="flex items-center rounded-xl border border-white/10 bg-black/40 p-1">
              <button
                onClick={() => {
                  setSelectedLanguage('Hindi');
                  setIsRtl(false);
                  setSelectedAIVoiceId('hindi-aarav-cinematic');
                }}
                className={`flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  selectedLanguage === 'Hindi'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-orange-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🇮🇳 Hindi (हिन्दी)</span>
              </button>
              <button
                onClick={() => {
                  setSelectedLanguage('Urdu');
                  setIsRtl(true);
                  setSelectedAIVoiceId('urdu-tariq-master');
                }}
                className={`flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  selectedLanguage === 'Urdu'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🇵🇰 Urdu (اردو)</span>
              </button>
              <button
                onClick={() => {
                  setSelectedLanguage('English');
                  setIsRtl(false);
                  setSelectedAIVoiceId('en-james-narrator');
                }}
                className={`flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  selectedLanguage === 'English'
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🌐 English</span>
              </button>
            </div>

            {/* Toggle Diagnostics */}
            <button
              onClick={() => setShowDiagnosticsBanner(!showDiagnosticsBanner)}
              className="flex items-center space-x-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              title="View voice detection diagnostics"
            >
              <Cpu className="h-3.5 w-3.5 text-cyan-400" />
              <span>Diagnostics</span>
            </button>

            {/* Refresh Voices Button */}
            <button
              onClick={refreshBrowserVoices}
              className="flex items-center space-x-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              title="Rescan browser voices"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isVoiceLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* 2. REAL-TIME VOICE DIAGNOSTICS BANNER */}
        {showDiagnosticsBanner && (
          <div className="mt-4 rounded-xl border border-violet-500/30 bg-[#0d101a] p-4 text-xs space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="font-bold text-white flex items-center space-x-2">
                <Cpu className="h-4 w-4 text-cyan-400" />
                <span>Device Voice Diagnostics ({selectedLanguage})</span>
              </span>
              <button
                onClick={() => setShowDiagnosticsBanner(false)}
                className="text-[11px] text-slate-400 hover:text-white"
              >
                Hide
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 pt-1">
              <div className="rounded-lg bg-white/5 p-2">
                <div className="text-[10px] text-slate-400">Total Installed Voices:</div>
                <div className="font-bold text-white mt-0.5 font-mono">{diagnostics.totalVoices}</div>
              </div>
              <div className="rounded-lg bg-white/5 p-2">
                <div className="text-[10px] text-slate-400">Hindi Voices (hi-IN):</div>
                <div className="font-bold text-amber-400 mt-0.5 font-mono">{hindiVoices.length}</div>
              </div>
              <div className="rounded-lg bg-white/5 p-2">
                <div className="text-[10px] text-slate-400">Urdu Voices (ur-PK):</div>
                <div className="font-bold text-emerald-400 mt-0.5 font-mono">{urduVoices.length}</div>
              </div>
              <div className="rounded-lg bg-white/5 p-2">
                <div className="text-[10px] text-slate-400">Active Language Mode:</div>
                <div className="font-bold text-cyan-300 mt-0.5 font-mono truncate">
                  {selectedLanguage} ({selectedLanguage === 'Hindi' ? 'hi-IN' : selectedLanguage === 'Urdu' ? 'ur-PK' : 'en-US'})
                </div>
              </div>
            </div>
            <div className="text-[11px] text-slate-300 pt-1">
              <strong>Detail:</strong> Installed Hindi Voices: {hindiVoices.length > 0 ? hindiVoices.map(v => v.name).join(', ') : 'None in browser (Server AI Engine active)'} | Installed Urdu Voices: {urduVoices.length > 0 ? urduVoices.map(v => v.name).join(', ') : 'None in browser (Server AI Engine active)'}
            </div>
          </div>
        )}

        {/* Dynamic Language Status Banner */}
        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Check className="h-4 w-4 text-emerald-400" />
            <span>
              <strong>Active Language:</strong> {selectedLanguage === 'Hindi' ? '🇮🇳 Hindi (हिन्दी / hi-IN)' : selectedLanguage === 'Urdu' ? '🇵🇰 Urdu (اردو / ur-PK)' : '🌐 International English (en-US)'}
              {' • '}
              <span className="text-violet-300">
                {selectedLanguage === 'Hindi'
                  ? `${hindiVoices.length} browser Hindi voice(s) & 6 Studio AI Hindi voices available`
                  : selectedLanguage === 'Urdu'
                  ? `${urduVoices.length} browser Urdu voice(s) & 6 Studio AI Urdu voices available`
                  : `${englishVoices.length} browser English voice(s) available`}
              </span>
            </span>
          </div>

          <div className="flex items-center space-x-2 text-[11px] text-slate-400">
            <span>Direction: <strong className="text-white uppercase">{isRtl ? 'RTL (Right to Left)' : 'LTR (Left to Right)'}</strong></span>
          </div>
        </div>
      </div>

      {/* 3. MAIN WORKSPACE GRID: TEXT EDITOR & CONTROLS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: LARGE URDU EDITOR / STORY READER (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col rounded-2xl border border-white/10 bg-[#0c0f17] p-5 shadow-2xl relative min-h-[560px]">
          {/* Editor Header Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center space-x-2">
              {/* View Mode Toggle: Edit Mode vs Interactive Reader */}
              <div className="flex items-center rounded-xl border border-white/10 bg-white/5 p-1">
                <button
                  onClick={() => setViewMode('editor')}
                  className={`flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    viewMode === 'editor'
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Editor</span>
                </button>
                <button
                  onClick={() => setViewMode('reader')}
                  className={`flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    viewMode === 'reader'
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>Sentence Reader ({sentences.length})</span>
                </button>
              </div>

              {/* Sample Stories Dropdown (Categorized by Hindi & Urdu) */}
              <div className="relative">
                <button
                  onClick={() => setShowSamplesDropdown(!showSamplesDropdown)}
                  className="flex items-center space-x-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  <span>Sample Stories ({selectedLanguage})</span>
                  <ChevronDown className="h-3 w-3 text-slate-400" />
                </button>

                {showSamplesDropdown && (
                  <div className="absolute left-0 top-full z-30 mt-2 w-80 rounded-xl border border-white/10 bg-[#121624] p-2 shadow-2xl backdrop-blur-xl">
                    <div className="flex items-center justify-between px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/5">
                      <span>Curated Story Presets</span>
                      <span className="text-violet-400">{selectedLanguage}</span>
                    </div>

                    <div className="max-h-72 overflow-y-auto py-1 divide-y divide-white/5">
                      {/* Active Language Stories */}
                      <div className="py-1">
                        <div className="px-2 py-1 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                          {selectedLanguage === 'Hindi' ? '🇮🇳 Hindi Stories (हिन्दी कथाएं)' : '🇵🇰 Urdu Stories (اردو کہانیاں)'}
                        </div>
                        {SAMPLE_STORIES.filter((s) => (selectedLanguage === 'Hindi' ? s.languageCode === 'hi-IN' : s.languageCode === 'ur-PK' || s.isUrdu)).map((sample) => (
                          <button
                            key={sample.id}
                            onClick={() => handleLoadSample(sample)}
                            className="w-full rounded-lg px-2.5 py-2 text-left hover:bg-violet-600/20 hover:text-white transition-colors group"
                          >
                            <div className="text-xs font-bold text-slate-200 group-hover:text-amber-300">
                              {sample.title}
                            </div>
                            <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                              {sample.text.substring(0, 50)}...
                            </div>
                          </button>
                        ))}
                      </div>

                      {/* Other Language Stories */}
                      <div className="py-1">
                        <div className="px-2 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          {selectedLanguage === 'Hindi' ? '🇵🇰 Switch to Urdu Stories' : '🇮🇳 Switch to Hindi Stories'}
                        </div>
                        {SAMPLE_STORIES.filter((s) => (selectedLanguage === 'Hindi' ? s.languageCode === 'ur-PK' || s.isUrdu : s.languageCode === 'hi-IN')).slice(0, 3).map((sample) => (
                          <button
                            key={sample.id}
                            onClick={() => handleLoadSample(sample)}
                            className="w-full rounded-lg px-2.5 py-1.5 text-left hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-colors group"
                          >
                            <div className="text-xs font-medium line-clamp-1">
                              {sample.title}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Editor Utility Tools */}
            <div className="flex items-center space-x-2">
              {/* RTL / LTR Toggle */}
              <button
                onClick={() => setIsRtl(!isRtl)}
                className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
                  isRtl
                    ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300'
                    : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
                }`}
                title={isRtl ? 'RTL Mode Active (اردو)' : 'LTR Mode Active (हिन्दी / English)'}
              >
                {isRtl ? <AlignRight className="h-4 w-4" /> : <AlignLeft className="h-4 w-4" />}
              </button>

              {/* Copy Story */}
              <button
                onClick={handleCopyText}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Copy full text"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </button>

              {/* Save Story */}
              <button
                onClick={handleSaveToHistory}
                className="flex items-center space-x-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                title="Save story script"
              >
                {savedSuccess ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-semibold">Saved!</span>
                  </>
                ) : (
                  <>
                    <BookmarkPlus className="h-3.5 w-3.5 text-violet-400" />
                    <span>Save Story</span>
                  </>
                )}
              </button>

              {/* Clear Text */}
              <button
                onClick={() => {
                  if (text && confirm('Clear all text from editor?')) {
                    handleStop();
                    setText('');
                  }
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="Clear text"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* VIEW MODE A: FULL TEXTAREA EDITOR */}
          {viewMode === 'editor' && (
            <div className="relative mt-4 flex-1 flex flex-col">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                dir={isRtl ? 'rtl' : 'ltr'}
                placeholder={
                  selectedLanguage === 'Hindi'
                    ? 'यहाँ अपनी संपूर्ण हिन्दी कहानी, पंचतंत्र कथा, पौराणिक प्रसंग, यूट्यूब स्क्रिप्ट या संवाद दर्ज करें (कोई शब्द सीमा नहीं है)...'
                    : selectedLanguage === 'Urdu'
                    ? 'یہاں اپنی مکمل اردو کہانی، ناول کا باب، یا متن پیسٹ کریں۔ (کوئی لمٹ نہیں ہے)...'
                    : 'Paste your story, monologue, dialogue, or script here (unlimited words)...'
                }
                rows={16}
                className={`w-full flex-1 resize-y rounded-xl border border-white/5 bg-[#080a0f] p-4 text-slate-100 placeholder-slate-600 focus:border-violet-500/40 focus:outline-none focus:ring-1 focus:ring-violet-500/40 ${
                  selectedLanguage === 'Urdu'
                    ? 'font-urdu text-lg leading-loose'
                    : selectedLanguage === 'Hindi'
                    ? 'font-hindi text-base leading-relaxed'
                    : 'font-sans text-sm leading-relaxed'
                }`}
              />
            </div>
          )}

          {/* VIEW MODE B: INTERACTIVE SENTENCE READER WITH REAL-TIME HIGHLIGHT */}
          {viewMode === 'reader' && (
            <div
              dir={isRtl ? 'rtl' : 'ltr'}
              className="mt-4 flex-1 overflow-y-auto max-h-[500px] space-y-3 pr-2 scrollbar-thin scrollbar-thumb-white/10"
            >
              <div className="text-[11px] text-slate-400 bg-white/5 p-2 rounded-lg mb-3">
                💡 <strong>Sentence Reader Mode:</strong> Click any sentence below to immediately start speaking from that exact position.
              </div>

              {sentences.map((sentence, sIdx) => {
                const isActive = playbackStatus === 'speaking' && currentSentenceIndex === sIdx;
                const isPast = currentSentenceIndex > sIdx;

                return (
                  <div
                    key={sentence.id}
                    ref={isActive ? activeSentenceCardRef : null}
                    onClick={() => {
                      setCurrentSentenceIndex(sIdx);
                      handleStartSpeak(sIdx);
                    }}
                    className={`cursor-pointer rounded-xl p-3.5 transition-all text-base ${
                      selectedLanguage === 'Urdu'
                        ? 'font-urdu leading-loose text-lg'
                        : selectedLanguage === 'Hindi'
                        ? 'font-hindi leading-relaxed text-base'
                        : 'font-sans text-sm leading-relaxed'
                    } ${
                      isActive
                        ? 'bg-gradient-to-r from-violet-900/60 via-indigo-900/40 to-violet-950/80 border-2 border-violet-400 text-white shadow-lg shadow-violet-600/30 scale-[1.01]'
                        : isPast
                        ? 'bg-white/[0.02] border border-white/5 text-slate-400 hover:bg-white/[0.04]'
                        : 'bg-white/[0.04] border border-white/10 text-slate-200 hover:border-violet-500/30 hover:bg-white/[0.06]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">{sentence.trimmedText}</div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-slate-500 shrink-0">
                        #{sIdx + 1}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Editor Footer Meta & Real Counters */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3 text-xs text-slate-400">
            <div className="flex items-center space-x-3">
              <span>
                Words: <strong className="text-white font-mono">{wordCount}</strong>
              </span>
              <span>•</span>
              <span>
                Characters: <strong className="text-white font-mono">{charCount}</strong>
              </span>
              <span>•</span>
              <span>
                Sentences: <strong className="text-violet-400 font-mono">{sentences.length}</strong>
              </span>
              <span>•</span>
              <span>
                Est. Duration: <strong className="text-cyan-400 font-mono">{estimatedDuration}</strong>
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-[11px] text-slate-500">Auto-saved to local draft</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: DUAL ENGINE CONTROLS (8 Cols vs 4 Cols) */}
        <div className="lg:col-span-4 space-y-5">
          {/* ======================================================== */}
          {/* SECTION 1: STUDIO AI AUDIO GENERATOR (DOWNLOADABLE WAV)  */}
          {/* ======================================================== */}
          <div className="rounded-2xl border border-violet-500/30 bg-gradient-to-b from-[#141829] via-[#101322] to-[#0c0e17] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2">
                <Wand2 className="h-4 w-4 text-violet-400" />
                <h3 className="text-sm font-bold text-white">AI Voice Generator (WAV/MP3)</h3>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                Downloadable
              </span>
            </div>

            {/* Voice Gender Switcher */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Voice Gender:</label>
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-black/40 border border-white/10">
                <button
                  onClick={() => setSelectedGender('all')}
                  className={`py-1 text-xs font-semibold rounded-lg transition-all ${
                    selectedGender === 'all'
                      ? 'bg-violet-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All Voices
                </button>
                <button
                  onClick={() => setSelectedGender('male')}
                  className={`py-1 text-xs font-semibold rounded-lg transition-all ${
                    selectedGender === 'male'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  👨 Male
                </button>
                <button
                  onClick={() => setSelectedGender('female')}
                  className={`py-1 text-xs font-semibold rounded-lg transition-all ${
                    selectedGender === 'female'
                      ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  👩 Female
                </button>
              </div>
            </div>

            {/* AI Voice Model Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Select {selectedLanguage} Voice:</span>
                <span className="text-[10px] text-violet-400 font-mono">24kHz Studio Quality</span>
              </label>

              <select
                value={selectedAIVoiceId}
                onChange={(e) => setSelectedAIVoiceId(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#121624] px-3.5 py-2.5 text-xs text-white focus:border-violet-500 focus:outline-none"
              >
                {/* Active Language AI Voices */}
                <optgroup label={`⭐ ${selectedLanguage} Voice Specialists`}>
                  {AI_VOICES.filter((v) => v.language === selectedLanguage && (selectedGender === 'all' || v.gender === selectedGender)).map((voice) => (
                    <option key={voice.id} value={voice.id}>
                      {voice.gender === 'male' ? '👨' : '👩'} {voice.name} — {voice.category} ({voice.accent})
                    </option>
                  ))}
                </optgroup>

                {/* Other AI Voices */}
                <optgroup label="🌐 Other Languages">
                  {AI_VOICES.filter((v) => v.language !== selectedLanguage && (selectedGender === 'all' || v.gender === selectedGender)).slice(0, 8).map((voice) => (
                    <option key={voice.id} value={voice.id}>
                      {voice.gender === 'male' ? '👨' : '👩'} {voice.name} ({voice.language})
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Generate Audio Button */}
            <button
              onClick={handleGenerateAudio}
              disabled={isGeneratingAudio || !text.trim()}
              className="w-full flex items-center justify-center space-x-2.5 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 p-3.5 font-bold text-white shadow-xl shadow-violet-600/30 hover:from-violet-500 hover:to-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-[0.98]"
            >
              {isGeneratingAudio ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span className="text-sm">Synthesizing {selectedLanguage} Voice...</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  <span className="text-sm">Generate Audio (Downloadable WAV)</span>
                </>
              )}
            </button>

            {/* Generation Error Banner */}
            {generationError && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-950/30 p-3 text-xs text-rose-200 space-y-1">
                <div className="font-bold flex items-center space-x-1.5 text-rose-300">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Generation Notice</span>
                </div>
                <p className="text-[11px] leading-relaxed">{generationError}</p>
              </div>
            )}

            {/* Generated Audio Player (Real Audio with Download Button) */}
            {generatedAudio && (
              <div className="pt-2">
                <AudioPlayer currentAudio={generatedAudio} isInline={true} />
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* SECTION 2: BROWSER WEB SPEECH CONTROLS (FREE LIVE SPEECH) */}
          {/* ======================================================== */}
          <div className="rounded-2xl border border-white/10 bg-[#0c0f17] p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2">
                <Volume2 className="h-4 w-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Live Browser Playback</h3>
              </div>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  playbackStatus === 'speaking'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse'
                    : playbackStatus === 'paused'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-white/5 text-slate-400'
                }`}
              >
                {playbackStatus}
              </span>
            </div>

            {/* Playback Action Buttons */}
            {playbackStatus !== 'speaking' ? (
              <button
                onClick={() => handleStartSpeak(currentSentenceIndex)}
                disabled={!text.trim()}
                className="w-full flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 p-3 font-bold text-white shadow-lg hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Play className="h-4 w-4 fill-current" />
                <span className="text-sm">
                  {playbackStatus === 'paused' ? 'Resume Live Speaking' : `Speak Live (${selectedLanguage})`}
                </span>
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handlePause}
                  className="flex items-center justify-center space-x-2 rounded-xl bg-amber-600/90 hover:bg-amber-500 p-3 font-bold text-white shadow-lg transition-all"
                >
                  <Pause className="h-4 w-4 fill-current" />
                  <span>Pause</span>
                </button>
                <button
                  onClick={handleStop}
                  className="flex items-center justify-center space-x-2 rounded-xl bg-rose-600/90 hover:bg-rose-500 p-3 font-bold text-white shadow-lg transition-all"
                >
                  <Square className="h-4 w-4 fill-current" />
                  <span>Stop</span>
                </button>
              </div>
            )}

            {/* Navigation Controls: Prev, Restart, Next */}
            <div className="flex items-center justify-between pt-1">
              <button
                onClick={() => {
                  const prev = Math.max(0, currentSentenceIndex - 1);
                  setCurrentSentenceIndex(prev);
                  if (playbackStatus === 'speaking') speakSentenceAtIndex(prev);
                }}
                disabled={currentSentenceIndex <= 0}
                className="flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white/5 text-slate-300 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Previous Sentence"
              >
                <SkipBack className="h-3 w-3" />
                <span>Prev</span>
              </button>

              <button
                onClick={handleRestart}
                className="flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white/5 text-slate-300 hover:bg-white/10 transition-colors"
                title="Restart from beginning"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Restart</span>
              </button>

              <button
                onClick={() => {
                  const next = Math.min(sentences.length - 1, currentSentenceIndex + 1);
                  setCurrentSentenceIndex(next);
                  if (playbackStatus === 'speaking') speakSentenceAtIndex(next);
                }}
                disabled={currentSentenceIndex >= sentences.length - 1}
                className="flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white/5 text-slate-300 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Next Sentence"
              >
                <span>Next</span>
                <SkipForward className="h-3 w-3" />
              </button>
            </div>

            {/* Sentence Progress Indicator */}
            <div className="space-y-1.5 pt-2 border-t border-white/5">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Sentence Progress</span>
                <span className="font-mono text-white font-bold">
                  {sentences.length > 0 ? currentSentenceIndex + 1 : 0} / {sentences.length} Sentences
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                  style={{
                    width: `${
                      sentences.length > 0
                        ? Math.min(100, Math.round(((currentSentenceIndex + 1) / sentences.length) * 100))
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Browser Installed Voice Dropdown */}
            <div className="space-y-1.5 pt-2 border-t border-white/5">
              <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                <span>Browser Installed Voice:</span>
                {selectedVoice && (
                  <span className="text-[10px] text-slate-400 font-mono">{selectedVoice.lang}</span>
                )}
              </label>

              <select
                value={selectedVoice?.voiceURI || ''}
                onChange={(e) => handleSelectVoiceChange(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#121624] px-3 py-2 text-xs text-white focus:border-violet-500 focus:outline-none"
              >
                {/* 1. Group: Installed Hindi Voices */}
                {hindiVoices.length > 0 && (
                  <optgroup label="🇮🇳 Installed Hindi Voices">
                    {hindiVoices.map((voice) => (
                      <option key={voice.voiceURI} value={voice.voiceURI}>
                        ⭐ {voice.name} ({voice.lang})
                      </option>
                    ))}
                  </optgroup>
                )}

                {/* 2. Group: Installed Urdu Voices */}
                {urduVoices.length > 0 && (
                  <optgroup label="🇵🇰 Installed Urdu Voices">
                    {urduVoices.map((voice) => (
                      <option key={voice.voiceURI} value={voice.voiceURI}>
                        ⭐ {voice.name} ({voice.lang}) {isVoicePakistaniUrdu(voice) ? '• Pakistani' : ''}
                      </option>
                    ))}
                  </optgroup>
                )}

                {/* 3. Group: All Other Installed Voices */}
                <optgroup label="🌐 All System Voices">
                  {availableVoices.map((voice) => (
                    <option key={voice.voiceURI} value={voice.voiceURI}>
                      {voice.name} ({voice.lang})
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>

          {/* ======================================================== */}
          {/* SECTION 3: VOICE SETTINGS (SPEED, PITCH, VOLUME)         */}
          {/* ======================================================== */}
          <div className="rounded-2xl border border-white/10 bg-[#0c0f17] p-5 shadow-xl space-y-4">
            <div className="flex items-center space-x-2 border-b border-white/10 pb-3">
              <Sliders className="h-4 w-4 text-violet-400" />
              <h3 className="text-sm font-bold text-white">Voice Settings</h3>
            </div>

            {/* Speed Rate Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Speaking Speed (Rate)</span>
                <span className="font-mono text-violet-400 font-bold">{rate.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.05"
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value))}
                className="w-full accent-violet-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <button onClick={() => setRate(0.75)} className="hover:text-slate-300">0.75x</button>
                <button onClick={() => setRate(1.0)} className="hover:text-slate-300">1.0x (Normal)</button>
                <button onClick={() => setRate(1.25)} className="hover:text-slate-300">1.25x</button>
                <button onClick={() => setRate(1.5)} className="hover:text-slate-300">1.5x</button>
              </div>
            </div>

            {/* Pitch Slider */}
            <div className="space-y-1.5 pt-2 border-t border-white/5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Pitch Control</span>
                <span className="font-mono text-cyan-400 font-bold">{pitch.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.05"
                value={pitch}
                onChange={(e) => setPitch(parseFloat(e.target.value))}
                className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <button onClick={() => setPitch(0.75)} className="hover:text-slate-300">Deeper</button>
                <button onClick={() => setPitch(1.0)} className="hover:text-slate-300">Default (1.0)</button>
                <button onClick={() => setPitch(1.25)} className="hover:text-slate-300">Higher</button>
              </div>
            </div>

            {/* Volume Slider */}
            <div className="space-y-1.5 pt-2 border-t border-white/5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Volume Control</span>
                <span className="font-mono text-emerald-400 font-bold">{Math.round(volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
