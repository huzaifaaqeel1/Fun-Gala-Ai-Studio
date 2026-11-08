import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Play,
  Pause,
  Check,
  Volume2,
  Globe,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import {
  isVoiceUrdu,
  isVoicePakistaniUrdu,
  isVoiceHindi,
  guessVoiceGender,
} from '../utils/speechSynthesis';
import { UrduVoiceGuideModal } from './UrduVoiceGuideModal';

interface VoiceLibraryProps {
  selectedVoiceURI?: string | null;
  onSelectVoiceURI: (uri: string) => void;
  onGoToEditor: () => void;
  voices?: SpeechSynthesisVoice[];
  isLoading?: boolean;
  onRefreshVoices?: () => void;
}

export const VoiceLibrary: React.FC<VoiceLibraryProps> = ({
  selectedVoiceURI,
  onSelectVoiceURI,
  onGoToEditor,
  voices: propVoices,
  isLoading: propIsLoading,
  onRefreshVoices: propOnRefreshVoices,
}) => {
  const [localVoices, setLocalVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGender, setSelectedGender] = useState<'all' | 'male' | 'female'>('all');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'hindi' | 'urdu' | 'local'>('hindi');
  const [playingVoiceURI, setPlayingVoiceURI] = useState<string | null>(null);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [isLocalLoading, setIsLocalLoading] = useState(true);

  const voices = propVoices && propVoices.length > 0 ? propVoices : localVoices;
  const isLoading = propIsLoading !== undefined ? propIsLoading : isLocalLoading;

  // Load browser voices
  const refreshVoices = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsLocalLoading(false);
      return;
    }
    const allVoices = window.speechSynthesis.getVoices();
    setLocalVoices(allVoices);
    setIsLocalLoading(false);
    if (propOnRefreshVoices) propOnRefreshVoices();
  };

  useEffect(() => {
    refreshVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = refreshVoices;
    }
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Play test sample for a specific browser voice
  const handleTestVoice = (voice: SpeechSynthesisVoice) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (playingVoiceURI === voice.voiceURI) {
      window.speechSynthesis.cancel();
      setPlayingVoiceURI(null);
      return;
    }

    window.speechSynthesis.cancel();

    // Use language-appropriate sample
    let sampleText = `Hello! This is a voice preview for ${voice.name}.`;
    if (isVoiceHindi(voice)) {
      sampleText = 'नमस्ते! यह आपके ब्राउज़र की प्राकृतिक हिन्दी आवाज़ का नमूना है।';
    } else if (isVoiceUrdu(voice)) {
      sampleText = 'السلام علیکم! یہ آپ کے براؤزر کی اصلی اردو آواز کا نمونہ ہے۔';
    }

    const utterance = new SpeechSynthesisUtterance(sampleText);
    utterance.voice = voice;
    utterance.lang = voice.lang;
    utterance.rate = 1.0;

    utterance.onend = () => setPlayingVoiceURI(null);
    utterance.onerror = () => setPlayingVoiceURI(null);

    setPlayingVoiceURI(voice.voiceURI);
    window.speechSynthesis.speak(utterance);
  };

  const handleSelect = (voice: SpeechSynthesisVoice) => {
    onSelectVoiceURI(voice.voiceURI);
    onGoToEditor();
  };

  // Filter voices
  const urduVoices = voices.filter(isVoiceUrdu);
  const hindiVoices = voices.filter(isVoiceHindi);
  const hasUrduVoices = urduVoices.length > 0;
  const hasHindiVoices = hindiVoices.length > 0;

  const filteredVoices = voices.filter((v) => {
    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = v.name.toLowerCase().includes(q);
      const matchLang = v.lang.toLowerCase().includes(q);
      if (!matchName && !matchLang) return false;
    }

    // Category / Filter tab
    if (selectedFilter === 'hindi' && !isVoiceHindi(v)) return false;
    if (selectedFilter === 'urdu' && !isVoiceUrdu(v)) return false;
    if (selectedFilter === 'local' && !v.localService) return false;

    // Gender filter
    if (selectedGender !== 'all') {
      const gender = guessVoiceGender(v);
      if (gender !== selectedGender) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      <UrduVoiceGuideModal isOpen={showGuideModal} onClose={() => setShowGuideModal(false)} />

      {/* Header Banner */}
      <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-r from-violet-950/30 via-indigo-950/20 to-slate-900/60 p-6 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                100% Free Device Voices
              </span>
              <span className="rounded-full bg-violet-500/20 border border-violet-500/30 px-2.5 py-0.5 text-xs font-semibold text-violet-300">
                Total Installed: {voices.length}
              </span>
            </div>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
              Installed Browser Voice Scanner
            </h2>
            <p className="mt-1 text-xs text-slate-300 max-w-2xl">
              Only voices that physically exist in your operating system and browser are shown below. No fake voice profiles or external cloud servers.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowGuideModal(true)}
              className="flex items-center space-x-2 rounded-xl border border-violet-500/30 bg-violet-900/30 px-3.5 py-2 text-xs font-semibold text-violet-200 hover:bg-violet-900/50 transition-colors"
            >
              <Globe className="h-4 w-4 text-cyan-400" />
              <span>Install Urdu Voice</span>
            </button>
            <button
              onClick={refreshVoices}
              className="flex items-center space-x-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              title="Rescan device voices"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Rescan</span>
            </button>
          </div>
        </div>

        {/* Warning if No Urdu Voice on Device */}
        {!hasUrduVoices && !isLoading && (
          <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-950/30 p-4 text-xs text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-100 text-sm">
                  No Urdu voice is available in your browser. Please check your installed system voices and restart your browser.
                </p>
                <p className="text-[11px] text-amber-300/80 mt-0.5">
                  If you installed Urdu (Pakistan) on Windows, completely close and reopen Google Chrome so it reloads the Windows speech registry.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowGuideModal(true)}
              className="rounded-lg bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md hover:bg-amber-500 transition-colors shrink-0"
            >
              View Installation Steps
            </button>
          </div>
        )}

        {/* Filter Controls */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
          {/* Tabs: Hindi vs Urdu vs All vs Local */}
          <div className="flex items-center rounded-xl border border-white/10 bg-black/30 p-1">
            <button
              onClick={() => setSelectedFilter('hindi')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                selectedFilter === 'hindi'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🇮🇳 Hindi Voices ({hindiVoices.length})
            </button>
            <button
              onClick={() => setSelectedFilter('urdu')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                selectedFilter === 'urdu'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🇵🇰 Urdu Voices ({urduVoices.length})
            </button>
            <button
              onClick={() => setSelectedFilter('all')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                selectedFilter === 'all'
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🌐 All Installed ({voices.length})
            </button>
            <button
              onClick={() => setSelectedFilter('local')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                selectedFilter === 'local'
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ⚡ Local Offline Only
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by voice name or lang..."
                className="w-56 rounded-xl border border-white/10 bg-black/30 py-1.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none"
              />
            </div>

            {/* Gender Filter */}
            <select
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value as any)}
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-white focus:border-violet-500 focus:outline-none"
            >
              <option value="all">All Genders</option>
              <option value="male">Male Voices</option>
              <option value="female">Female Voices</option>
            </select>
          </div>
        </div>
      </div>

      {/* Voices List Grid */}
      {filteredVoices.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#0c0f17] p-12 text-center">
          <Globe className="h-10 w-10 text-slate-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No Voices Match This Filter</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            {selectedFilter === 'urdu'
              ? 'No Urdu voice was found on this system. Click below to see how to install the free Pakistani Urdu voice pack in your operating system.'
              : 'Try clearing your search term or switching to All Installed Voices.'}
          </p>
          {selectedFilter === 'urdu' && (
            <button
              onClick={() => setShowGuideModal(true)}
              className="mt-4 inline-flex items-center space-x-2 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-lg hover:bg-violet-500 transition-colors"
            >
              <Globe className="h-4 w-4" />
              <span>Urdu Voice Installation Guide</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVoices.map((voice) => {
            const isSelected = selectedVoiceURI === voice.voiceURI;
            const isUrdu = isVoiceUrdu(voice);
            const isPakistani = isVoicePakistaniUrdu(voice);
            const isPlaying = playingVoiceURI === voice.voiceURI;
            const gender = guessVoiceGender(voice);

            return (
              <div
                key={voice.voiceURI}
                className={`flex flex-col justify-between rounded-2xl border p-4 transition-all ${
                  isSelected
                    ? 'border-violet-500 bg-gradient-to-b from-violet-950/40 to-[#0c0f17] shadow-lg shadow-violet-600/20'
                    : isUrdu
                    ? 'border-emerald-500/40 bg-[#0c0f17] hover:border-emerald-500/60'
                    : 'border-white/10 bg-[#0c0f17] hover:border-white/20'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                        {isPakistani && (
                          <span className="rounded bg-emerald-500/20 border border-emerald-500/30 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">
                            🇵🇰 Pakistani Urdu (ur-PK)
                          </span>
                        )}
                        {!isPakistani && isUrdu && (
                          <span className="rounded bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                            اردو Urdu Voice
                          </span>
                        )}
                        {voice.localService ? (
                          <span className="rounded bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 text-[10px] text-blue-300">
                            Offline Engine
                          </span>
                        ) : (
                          <span className="rounded bg-slate-500/10 border border-slate-500/20 px-1.5 py-0.5 text-[10px] text-slate-400">
                            Browser Service
                          </span>
                        )}
                        <span className="rounded bg-violet-500/10 border border-violet-500/20 px-1.5 py-0.5 text-[10px] capitalize text-violet-300 font-medium">
                          {gender}
                        </span>
                      </div>

                      <h4 className="mt-2 text-sm font-bold text-white line-clamp-1">{voice.name}</h4>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">{voice.lang}</p>
                    </div>

                    {isSelected && (
                      <span className="rounded-full bg-violet-600/30 border border-violet-500 p-1 text-violet-300">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex items-center justify-between gap-2 border-t border-white/5 pt-3">
                  <button
                    onClick={() => handleTestVoice(voice)}
                    className={`flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      isPlaying
                        ? 'bg-amber-600 text-white'
                        : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                    <span>{isPlaying ? 'Playing...' : 'Test Voice'}</span>
                  </button>

                  <button
                    onClick={() => handleSelect(voice)}
                    className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-violet-600/30 text-violet-300 border border-violet-500/40'
                        : 'bg-violet-600 text-white hover:bg-violet-500 shadow-md shadow-violet-600/30'
                    }`}
                  >
                    {isSelected ? 'Active Voice' : 'Select Voice'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
