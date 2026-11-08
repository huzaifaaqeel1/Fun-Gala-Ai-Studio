import React, { useState } from 'react';
import { Sliders, Sparkles, Volume2, RefreshCw, Check, Play, Pause } from 'lucide-react';
import { VoiceModel, VoiceSettings, VoiceEmotion } from '../types/tts';

interface VoiceSettingsViewProps {
  settings: VoiceSettings;
  onUpdateSettings: (settings: VoiceSettings) => void;
  selectedVoice: VoiceModel;
}

export const VoiceSettingsView: React.FC<VoiceSettingsViewProps> = ({
  settings,
  onUpdateSettings,
  selectedVoice,
}) => {
  const [isPlayingTest, setIsPlayingTest] = useState(false);
  const [isGeneratingTest, setIsGeneratingTest] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const emotions: VoiceEmotion[] = [
    'Storytelling',
    'Dramatic',
    'Emotional',
    'Calm',
    'Excited',
    'Happy',
    'Sad',
    'Suspenseful',
    'Documentary',
    'Professional',
    'Serious',
    'Friendly',
    'Neutral',
  ];

  const presets = [
    {
      name: 'Pakistani Urdu Storyteller',
      settings: {
        speed: 0.95,
        pitch: 0,
        stability: 80,
        similarity: 90,
        expressiveness: 85,
        pauseBetweenSentences: 0.7,
        emotion: 'Storytelling' as VoiceEmotion,
      },
    },
    {
      name: 'Documentary & History',
      settings: {
        speed: 1.0,
        pitch: -2,
        stability: 85,
        similarity: 85,
        expressiveness: 70,
        pauseBetweenSentences: 0.6,
        emotion: 'Documentary' as VoiceEmotion,
      },
    },
    {
      name: 'Audiobook Melodic Reader',
      settings: {
        speed: 0.9,
        pitch: 0,
        stability: 90,
        similarity: 80,
        expressiveness: 75,
        pauseBetweenSentences: 0.8,
        emotion: 'Calm' as VoiceEmotion,
      },
    },
    {
      name: 'Cinematic Drama',
      settings: {
        speed: 0.9,
        pitch: -1,
        stability: 70,
        similarity: 95,
        expressiveness: 95,
        pauseBetweenSentences: 0.9,
        emotion: 'Dramatic' as VoiceEmotion,
      },
    },
    {
      name: 'YouTube Fast Paced',
      settings: {
        speed: 1.15,
        pitch: 1,
        stability: 75,
        similarity: 80,
        expressiveness: 85,
        pauseBetweenSentences: 0.3,
        emotion: 'Excited' as VoiceEmotion,
      },
    },
  ];

  const handleSliderChange = (field: keyof VoiceSettings, value: number | VoiceEmotion) => {
    onUpdateSettings({
      ...settings,
      [field]: value,
    });
  };

  const handleTestVoice = async () => {
    try {
      setIsGeneratingTest(true);
      const res = await fetch('/api/tts/sample', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voiceId: selectedVoice.id,
          prebuiltVoice: selectedVoice.prebuiltVoice,
          sampleText: selectedVoice.sampleText,
          languageCode: selectedVoice.languageCode,
        }),
      });

      if (!res.ok) throw new Error('Test preview failed');
      const data = await res.json();
      if (data.audioUrl) {
        const audio = new Audio(data.audioUrl);
        audio.playbackRate = settings.speed;
        audio.onended = () => setIsPlayingTest(false);
        setIsPlayingTest(true);
        await audio.play();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingTest(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#0d101a] p-6 backdrop-blur-xl">
        <div>
          <div className="flex items-center space-x-2">
            <span className="rounded-full bg-violet-500/20 px-2.5 py-0.5 text-xs font-semibold text-violet-300">
              Acoustic Synthesis Controls
            </span>
          </div>
          <h2 className="mt-1 text-2xl font-black text-white">Voice & Emotion Settings</h2>
          <p className="text-xs text-slate-300">
            Fine-tune cadence, emotional resonance, stability, speaking rate, and sentence pause duration.
          </p>
        </div>

        <button
          onClick={handleTestVoice}
          disabled={isGeneratingTest}
          className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-600/30 hover:from-violet-500 hover:to-indigo-500 transition-all"
        >
          {isGeneratingTest ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          ) : isPlayingTest ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          <span>{isPlayingTest ? 'Playing Test' : 'Preview Active Voice'}</span>
        </button>
      </div>

      {/* Preset Profiles */}
      <div className="rounded-2xl border border-white/10 bg-[#0d101a] p-6">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
          <Sparkles className="h-4 w-4 text-violet-400" />
          <span>Recommended Synthesis Presets</span>
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Click any preset to instantly configure optimal storytelling and broadcast settings.
        </p>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {presets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => {
                onUpdateSettings(preset.settings);
                setSavedSuccess(true);
                setTimeout(() => setSavedSuccess(false), 2000);
              }}
              className="flex flex-col items-start p-3.5 rounded-xl border border-white/10 bg-white/5 hover:border-violet-500/50 hover:bg-white/10 transition-all text-left"
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-bold text-white text-xs">{preset.name}</span>
                <span className="text-[10px] bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded">
                  {preset.settings.emotion}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1">
                Speed: {preset.settings.speed}x • Stability: {preset.settings.stability}% • Pause: {preset.settings.pauseBetweenSentences}s
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Emotion Styles */}
        <div className="rounded-2xl border border-white/10 bg-[#0d101a] p-6">
          <h3 className="text-sm font-bold text-white">Vocal Emotion Style</h3>
          <p className="text-xs text-slate-400 mt-1">
            Dictates the emotional tone, inflection, and artistic mood of the narrative voice.
          </p>

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {emotions.map((emo) => {
              const isActive = settings.emotion === emo;
              return (
                <button
                  key={emo}
                  onClick={() => handleSliderChange('emotion', emo)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30 border border-violet-400'
                      : 'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {emo}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sliders: Speed, Stability, Expressiveness, Pause */}
        <div className="rounded-2xl border border-white/10 bg-[#0d101a] p-6 space-y-5">
          <h3 className="text-sm font-bold text-white">Acoustic Sliders</h3>

          {/* Speed */}
          <div>
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-300">Speaking Speed</span>
              <span className="text-violet-400 font-mono">{settings.speed}x</span>
            </div>
            <input
              type="range"
              min={0.5}
              max={2.0}
              step={0.05}
              value={settings.speed}
              onChange={(e) => handleSliderChange('speed', parseFloat(e.target.value))}
              className="mt-2 w-full h-1.5 appearance-none rounded-lg bg-slate-800 accent-violet-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>0.5x Slow</span>
              <span>1.0x Natural</span>
              <span>2.0x Fast</span>
            </div>
          </div>

          {/* Stability */}
          <div>
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-300">Voice Stability</span>
              <span className="text-violet-400 font-mono">{settings.stability}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={settings.stability}
              onChange={(e) => handleSliderChange('stability', parseInt(e.target.value))}
              className="mt-2 w-full h-1.5 appearance-none rounded-lg bg-slate-800 accent-violet-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>More Variable / Creative</span>
              <span>Consistent & Reliable</span>
            </div>
          </div>

          {/* Expressiveness / Similarity */}
          <div>
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-300">Expressiveness & Similarity</span>
              <span className="text-violet-400 font-mono">{settings.expressiveness}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={settings.expressiveness}
              onChange={(e) => handleSliderChange('expressiveness', parseInt(e.target.value))}
              className="mt-2 w-full h-1.5 appearance-none rounded-lg bg-slate-800 accent-violet-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>Subtle</span>
              <span>Vivid / Dramatic Character</span>
            </div>
          </div>

          {/* Pause length */}
          <div>
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-300">Pause Between Sentences</span>
              <span className="text-violet-400 font-mono">{settings.pauseBetweenSentences}s</span>
            </div>
            <input
              type="range"
              min={0.1}
              max={2.0}
              step={0.1}
              value={settings.pauseBetweenSentences}
              onChange={(e) => handleSliderChange('pauseBetweenSentences', parseFloat(e.target.value))}
              className="mt-2 w-full h-1.5 appearance-none rounded-lg bg-slate-800 accent-violet-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>0.1s Snappy</span>
              <span>0.5s Natural</span>
              <span>2.0s Theatrical</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
