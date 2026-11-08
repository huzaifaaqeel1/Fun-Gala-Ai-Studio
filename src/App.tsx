/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { TextToSpeechDashboard } from './components/TextToSpeechDashboard';
import { VoiceLibrary } from './components/VoiceLibrary';
import { MyAudioLibrary } from './components/MyAudioLibrary';
import { SettingsModal } from './components/SettingsModal';
import { UrduVoiceGuideModal } from './components/UrduVoiceGuideModal';
import { GeneratedAudioItem } from './types/tts';
import {
  isVoiceUrdu,
  isVoicePakistaniUrdu,
} from './utils/speechSynthesis';
import {
  getStoredHistory,
  saveToStoredHistory,
  deleteFromStoredHistory,
  getAppSettings,
  saveAppSettings,
  getStoredDraft,
  saveStoredDraft,
  getStoredVoiceURI,
  saveStoredVoiceURI,
  UserAppSettings,
} from './utils/storage';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('tts');
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string | null>(getStoredVoiceURI());
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [isLoadingVoices, setIsLoadingVoices] = useState(true);

  const [appSettings, setAppSettings] = useState<UserAppSettings>(getAppSettings());
  const [library, setLibrary] = useState<GeneratedAudioItem[]>([]);
  const [draftText, setDraftText] = useState<string>(getStoredDraft());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isVoiceGuideOpen, setIsVoiceGuideOpen] = useState(false);

  // Centralized voice scanner
  const refreshVoices = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsLoadingVoices(false);
      return;
    }

    const allVoices = window.speechSynthesis.getVoices();
    setVoices(allVoices);

    const urdu = allVoices.filter(isVoiceUrdu);
    const storedURI = selectedVoiceURI || getStoredVoiceURI();
    let matched: SpeechSynthesisVoice | null = null;

    if (storedURI) {
      matched = allVoices.find((v) => v.voiceURI === storedURI) || null;
    }

    if (!matched && urdu.length > 0) {
      const pakistani = urdu.find(isVoicePakistaniUrdu);
      matched = pakistani || urdu[0];
    }

    if (matched) {
      setSelectedVoice(matched);
      setSelectedVoiceURI(matched.voiceURI);
    }

    setIsLoadingVoices(false);
  }, [selectedVoiceURI]);

  useEffect(() => {
    refreshVoices();

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = refreshVoices;
      window.speechSynthesis.addEventListener('voiceschanged', refreshVoices);
    }

    const timer = setTimeout(() => {
      refreshVoices();
    }, 500);

    return () => {
      clearTimeout(timer);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.removeEventListener('voiceschanged', refreshVoices);
      }
    };
  }, [refreshVoices]);

  // Initial load of saved stories from localStorage and server
  useEffect(() => {
    const localHist = getStoredHistory();
    setLibrary(localHist);

    fetch('/api/library')
      .then((res) => res.json())
      .then((serverItems: GeneratedAudioItem[]) => {
        if (Array.isArray(serverItems) && serverItems.length > 0) {
          setLibrary(serverItems);
        }
      })
      .catch(() => {});
  }, []);

  // Save story to personal library
  const handleSaveStory = async (item: GeneratedAudioItem) => {
    setLibrary((prev) => [item, ...prev.filter((i) => i.id !== item.id)]);
    saveToStoredHistory(item);

    try {
      await fetch('/api/library/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
    } catch (e) {
      console.warn('Could not persist to server storage:', e);
    }
  };

  // Delete story
  const handleDeleteAudio = async (id: string) => {
    setLibrary((prev) => prev.filter((i) => i.id !== id));
    deleteFromStoredHistory(id);

    try {
      await fetch(`/api/library/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('Could not delete from server storage:', e);
    }
  };

  // Rename story
  const handleRenameAudio = async (id: string, newTitle: string) => {
    const updatedLibrary = library.map((item) =>
      item.id === id ? { ...item, title: newTitle } : item
    );
    setLibrary(updatedLibrary);

    const found = updatedLibrary.find((i) => i.id === id);
    if (found) {
      saveToStoredHistory(found);
      try {
        await fetch('/api/library/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(found),
        });
      } catch (e) {}
    }
  };

  // Load story into editor
  const handleLoadIntoEditor = (textToLoad: string) => {
    setDraftText(textToLoad);
    saveStoredDraft(textToLoad);
    setCurrentTab('tts');
  };

  // Select voice URI
  const handleSelectVoiceURI = (uri: string) => {
    setSelectedVoiceURI(uri);
    saveStoredVoiceURI(uri);
    const found = voices.find((v) => v.voiceURI === uri);
    if (found) setSelectedVoice(found);
  };

  // Save app settings
  const handleSaveAppSettings = (newSettings: Partial<UserAppSettings>) => {
    const updated = saveAppSettings(newSettings);
    setAppSettings(updated);
  };

  return (
    <div className="min-h-screen bg-[#090b10] text-slate-100 flex flex-col font-sans selection:bg-violet-500/30 selection:text-violet-200">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        appSettings={appSettings}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenVoiceGuide={() => setIsVoiceGuideOpen(true)}
        libraryCount={library.length}
      />

      {/* Main Container */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 pb-32">
        {currentTab === 'tts' && (
          <TextToSpeechDashboard
            onSaveStory={handleSaveStory}
            appSettings={appSettings}
            draftText={draftText}
            onSaveDraft={(t) => {
              setDraftText(t);
              saveStoredDraft(t);
            }}
            onOpenVoiceLibrary={() => setCurrentTab('voices')}
            selectedVoiceURI={selectedVoiceURI}
            onSelectVoiceURI={handleSelectVoiceURI}
            voices={voices}
            selectedVoice={selectedVoice}
            isLoadingVoices={isLoadingVoices}
            onRefreshVoices={refreshVoices}
          />
        )}

        {currentTab === 'voices' && (
          <VoiceLibrary
            selectedVoiceURI={selectedVoiceURI}
            onSelectVoiceURI={handleSelectVoiceURI}
            onGoToEditor={() => setCurrentTab('tts')}
            voices={voices}
            isLoading={isLoadingVoices}
            onRefreshVoices={refreshVoices}
          />
        )}

        {currentTab === 'library' && (
          <MyAudioLibrary
            library={library}
            currentPlayingId={null}
            onPlayAudio={(item) => handleLoadIntoEditor(item.text)}
            onDeleteAudio={handleDeleteAudio}
            onRenameAudio={handleRenameAudio}
            onLoadIntoEditor={handleLoadIntoEditor}
          />
        )}
      </main>

      {/* Settings Modal (includes Voice Diagnostic Panel) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        appSettings={appSettings}
        onSaveSettings={handleSaveAppSettings}
        onOpenVoiceGuide={() => setIsVoiceGuideOpen(true)}
        voices={voices}
        selectedVoice={selectedVoice}
        isLoadingVoices={isLoadingVoices}
        onRefreshVoices={refreshVoices}
      />

      {/* Urdu Voice Guide Modal */}
      <UrduVoiceGuideModal
        isOpen={isVoiceGuideOpen}
        onClose={() => setIsVoiceGuideOpen(false)}
        onRefreshVoices={refreshVoices}
      />

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#07090d] py-6 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-300">TEXT TO SPEECH GENERATOR</span>
            <span>•</span>
            <span className="text-emerald-400 font-semibold">100% Free Personal Studio</span>
          </div>
          <div className="text-slate-400">
            Hindi (hi-IN) • Pakistani Urdu (ur-PK) • English (en-US) • Downloadable Audio & Browser Playback
          </div>
        </div>
      </footer>
    </div>
  );
}
