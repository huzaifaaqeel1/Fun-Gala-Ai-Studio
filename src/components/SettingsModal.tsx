import React, { useState } from 'react';
import { X, Sliders, ShieldCheck, Check, Globe, Cpu } from 'lucide-react';
import { UserAppSettings } from '../utils/storage';
import { VoiceDiagnosticPanel } from './VoiceDiagnosticPanel';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  appSettings: UserAppSettings;
  onSaveSettings: (settings: Partial<UserAppSettings>) => void;
  onOpenVoiceGuide?: () => void;
  voices?: SpeechSynthesisVoice[];
  selectedVoice?: SpeechSynthesisVoice | null;
  isLoadingVoices?: boolean;
  onRefreshVoices?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  appSettings,
  onSaveSettings,
  onOpenVoiceGuide,
  voices = [],
  selectedVoice = null,
  isLoadingVoices = false,
  onRefreshVoices = () => {},
}) => {
  const [rate, setRate] = useState(appSettings.speechRate || 1.0);
  const [pitch, setPitch] = useState(appSettings.speechPitch || 1.0);
  const [volume, setVolume] = useState(appSettings.speechVolume || 1.0);
  const [pauseMs, setPauseMs] = useState(appSettings.pauseBetweenSentencesMs || 250);
  const [autoScroll, setAutoScroll] = useState(appSettings.autoScrollHighlight !== false);
  const [autoRtl, setAutoRtl] = useState(appSettings.enableAutoRtl !== false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings({
      speechRate: rate,
      speechPitch: pitch,
      speechVolume: volume,
      pauseBetweenSentencesMs: pauseMs,
      autoScrollHighlight: autoScroll,
      enableAutoRtl: autoRtl,
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl rounded-2xl border border-violet-500/30 bg-[#0d101a] p-6 shadow-2xl shadow-violet-950/50 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-400">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Speech Studio Settings</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Personal preferences and browser voice diagnostics
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="mt-5 space-y-5">
          {/* 1. REQUIRED VOICE DIAGNOSTIC SECTION */}
          <div>
            <VoiceDiagnosticPanel
              voices={voices}
              selectedVoice={selectedVoice}
              isLoading={isLoadingVoices}
              onRefreshVoices={onRefreshVoices}
            />
          </div>

          {/* 2. SPEECH PREFERENCES */}
          <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Speech Playback Defaults
            </h4>

            {/* Default Rate */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">Default Speaking Speed (Rate)</span>
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
            </div>

            {/* Default Pitch */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">Default Voice Pitch</span>
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
            </div>

            {/* Pause Between Sentences */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">Pause Between Sentences</span>
                <span className="font-mono text-emerald-400 font-bold">{pauseMs} ms</span>
              </div>
              <input
                type="range"
                min="100"
                max="1200"
                step="50"
                value={pauseMs}
                onChange={(e) => setPauseMs(parseInt(e.target.value, 10))}
                className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <span className="text-[10px] text-slate-500">
                Natural breathing pause between reading consecutive Urdu sentences
              </span>
            </div>

            {/* Toggles */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <label className="flex items-center justify-between cursor-pointer text-xs">
                <span className="text-slate-300">Auto-scroll during reading playback</span>
                <input
                  type="checkbox"
                  checked={autoScroll}
                  onChange={(e) => setAutoScroll(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-violet-600 focus:ring-0 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer text-xs">
                <span className="text-slate-300">Auto-enable Right-to-Left (RTL) for Urdu text</span>
                <input
                  type="checkbox"
                  checked={autoRtl}
                  onChange={(e) => setAutoRtl(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-violet-600 focus:ring-0 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* 100% Privacy & Zero API Guarantee */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-3.5 text-xs text-emerald-300 flex items-start space-x-2.5">
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
            <div className="space-y-0.5">
              <strong className="text-white block font-semibold">100% Client-Side & Private</strong>
              <p className="text-[11px] text-emerald-300/80 leading-relaxed">
                No text or audio is ever transmitted to external servers, cloud APIs, or paid subscriptions. Everything runs directly inside your local browser.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
          {onOpenVoiceGuide && (
            <button
              onClick={() => {
                onClose();
                onOpenVoiceGuide();
              }}
              className="text-xs text-violet-400 hover:text-violet-300 font-semibold"
            >
              Urdu Voice Setup Guide
            </button>
          )}

          <div className="flex items-center space-x-2 ml-auto">
            <button
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center space-x-1.5 rounded-xl bg-violet-600 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-violet-600/30 hover:bg-violet-500 transition-colors"
            >
              {savedSuccess ? <Check className="h-4 w-4" /> : null}
              <span>{savedSuccess ? 'Saved!' : 'Save Preferences'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
