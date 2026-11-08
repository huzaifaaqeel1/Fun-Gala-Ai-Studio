import React from 'react';
import {
  Mic,
  AudioWaveform,
  FolderArchive,
  Sliders,
  Sparkles,
  HelpCircle,
  Globe,
  Settings as SettingsIcon,
} from 'lucide-react';
import { UserAppSettings } from '../utils/storage';

interface NavbarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  appSettings: UserAppSettings;
  onOpenSettings: () => void;
  onOpenVoiceGuide: () => void;
  libraryCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  appSettings,
  onOpenSettings,
  onOpenVoiceGuide,
  libraryCount,
}) => {
  const navItems = [
    { id: 'tts', label: 'TTS Studio (हिन्दी / اردو)', icon: Mic },
    { id: 'voices', label: 'Voice Library', icon: AudioWaveform },
    { id: 'library', label: 'My Audio & Stories', icon: FolderArchive, badge: libraryCount },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#090b10]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand / Logo */}
        <div
          className="flex items-center space-x-3 cursor-pointer"
          onClick={() => onTabChange('tts')}
        >
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-[#0c0f17]">
              <AudioWaveform className="h-5 w-5 text-violet-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-base font-extrabold tracking-tight text-white sm:text-lg">
                TEXT TO SPEECH <span className="bg-gradient-to-r from-violet-400 via-amber-300 to-cyan-400 bg-clip-text text-transparent">GENERATOR</span>
              </span>
            </div>
            <div className="flex items-center space-x-1.5 text-[11px] text-slate-400">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold text-emerald-400">Hindi • Urdu • English</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">AI Voice Studio</span>
            </div>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1 bg-white/[0.03] p-1 rounded-xl border border-white/5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex items-center space-x-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-violet-600/30 text-white border border-violet-500/40 shadow-sm shadow-violet-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-violet-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="ml-1 rounded-full bg-violet-500/20 px-1.5 py-0.2 text-[10px] font-semibold text-violet-300">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Actions: Voice Guide & Settings */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={onOpenVoiceGuide}
            className="flex items-center space-x-1.5 rounded-xl border border-violet-500/20 bg-violet-950/30 px-3 py-1.5 text-xs text-violet-300 hover:bg-violet-900/40 transition-colors"
            title="How to install Urdu voices on Windows / Mac / Android"
          >
            <Globe className="h-3.5 w-3.5 text-cyan-400" />
            <span className="hidden sm:inline font-semibold">Urdu Voice Guide</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
            title="Speech Settings"
          >
            <SettingsIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
