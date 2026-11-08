import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Globe,
  Radio,
  Cpu,
  Info,
  Volume2,
} from 'lucide-react';
import {
  VoiceDiagnostics,
  evaluateVoiceDiagnostics,
} from '../utils/speechSynthesis';

interface VoiceDiagnosticPanelProps {
  voices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  isLoading: boolean;
  onRefreshVoices: () => void;
  compact?: boolean;
}

export const VoiceDiagnosticPanel: React.FC<VoiceDiagnosticPanelProps> = ({
  voices,
  selectedVoice,
  isLoading,
  onRefreshVoices,
  compact = false,
}) => {
  const diagnostics: VoiceDiagnostics = evaluateVoiceDiagnostics(
    voices,
    selectedVoice,
    isLoading
  );

  const getStatusBadge = () => {
    switch (diagnostics.status) {
      case 'Urdu voice detected':
        return (
          <span className="inline-flex items-center space-x-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>Urdu voice detected</span>
          </span>
        );
      case 'Urdu voice not detected':
        return (
          <span className="inline-flex items-center space-x-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 px-3 py-1 text-xs font-bold text-amber-400">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
            <span>Urdu voice not detected</span>
          </span>
        );
      case 'Browser voice list loading':
        return (
          <span className="inline-flex items-center space-x-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 px-3 py-1 text-xs font-bold text-blue-400">
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-400" />
            <span>Browser voice list loading</span>
          </span>
        );
      case 'Speech synthesis unavailable':
      default:
        return (
          <span className="inline-flex items-center space-x-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 px-3 py-1 text-xs font-bold text-rose-400">
            <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
            <span>Speech synthesis unavailable</span>
          </span>
        );
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d101a] p-5 shadow-xl space-y-4">
      {/* Title & Refresh Button */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center space-x-2">
          <Cpu className="h-4 w-4 text-violet-400" />
          <h3 className="text-sm font-bold text-white">Browser Voice Diagnostics</h3>
        </div>
        <button
          onClick={onRefreshVoices}
          className="flex items-center space-x-1.5 rounded-lg border border-violet-500/30 bg-violet-950/30 px-3 py-1 text-xs font-semibold text-violet-300 hover:bg-violet-900/40 hover:text-white transition-colors"
          title="Rescan SpeechSynthesis voices"
        >
          <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Voices</span>
        </button>
      </div>

      {/* Main Status Badge */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="text-xs text-slate-400 font-medium">Urdu Voice Availability:</span>
        {getStatusBadge()}
      </div>

      {/* Diagnostic Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        <div className="rounded-xl bg-white/[0.03] border border-white/5 p-2.5">
          <div className="text-[11px] text-slate-400">Speech Synthesis Engine:</div>
          <div className="font-bold text-white mt-0.5 flex items-center space-x-1.5">
            <span className={`h-2 w-2 rounded-full ${diagnostics.isSupported ? 'bg-emerald-400' : 'bg-rose-400'}`} />
            <span>{diagnostics.isSupported ? 'Supported (Web Speech API)' : 'Unavailable'}</span>
          </div>
        </div>

        <div className="rounded-xl bg-white/[0.03] border border-white/5 p-2.5">
          <div className="text-[11px] text-slate-400">Total Installed Voices:</div>
          <div className="font-bold text-white font-mono mt-0.5">
            {diagnostics.totalVoices} device voice{diagnostics.totalVoices === 1 ? '' : 's'}
          </div>
        </div>

        <div className="rounded-xl bg-white/[0.03] border border-white/5 p-2.5">
          <div className="text-[11px] text-slate-400">Selected Voice Name:</div>
          <div className="font-bold text-violet-300 truncate mt-0.5">
            {diagnostics.selectedVoiceName || 'Default System Voice'}
          </div>
        </div>

        <div className="rounded-xl bg-white/[0.03] border border-white/5 p-2.5">
          <div className="text-[11px] text-slate-400">Selected Voice Locale:</div>
          <div className="font-bold text-cyan-300 font-mono mt-0.5">
            {diagnostics.selectedVoiceLang || 'ur-PK (Target)'}
          </div>
        </div>
      </div>

      {/* Diagnostic details & detected names */}
      {diagnostics.urduVoiceNames.length > 0 ? (
        <div className="rounded-xl bg-emerald-950/20 border border-emerald-500/20 p-3 text-xs text-emerald-300 space-y-1">
          <div className="font-bold text-emerald-200 flex items-center space-x-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>Active Urdu Voice Tokens ({diagnostics.urduVoicesCount}):</span>
          </div>
          <div className="text-[11px] text-emerald-300/90 font-mono">
            {diagnostics.urduVoiceNames.join(' • ')}
          </div>
        </div>
      ) : (
        <div className="rounded-xl bg-amber-950/20 border border-amber-500/20 p-3 text-xs text-amber-200">
          <p className="font-semibold text-amber-100">
            No Urdu voice is available in your browser. Please check your installed system voices and restart your browser.
          </p>
          <p className="text-[11px] text-amber-300/80 mt-1 leading-relaxed">
            If you installed the Windows language pack, completely close and reopen Chrome or Edge so the browser loads the new Windows speech registry.
          </p>
        </div>
      )}
    </div>
  );
};
