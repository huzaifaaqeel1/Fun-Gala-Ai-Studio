import React from 'react';
import { History, Play, Pause, Trash2, ArrowRight, Clock, Mic, Sparkles } from 'lucide-react';
import { GeneratedAudioItem } from '../types/tts';

interface GenerationHistoryProps {
  history: GeneratedAudioItem[];
  currentPlayingId: string | null;
  onPlayAudio: (item: GeneratedAudioItem) => void;
  onClearHistory: () => void;
  onLoadIntoEditor: (text: string) => void;
}

export const GenerationHistory: React.FC<GenerationHistoryProps> = ({
  history,
  currentPlayingId,
  onPlayAudio,
  onClearHistory,
  onLoadIntoEditor,
}) => {
  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#0d101a] p-6 backdrop-blur-xl">
        <div>
          <div className="flex items-center space-x-2">
            <span className="rounded-full bg-cyan-500/20 px-2.5 py-0.5 text-xs font-semibold text-cyan-300">
              Audit & Timeline
            </span>
            <span className="text-xs text-slate-400">{history.length} operations logged</span>
          </div>
          <h2 className="mt-1 text-2xl font-black text-white">Generation History</h2>
          <p className="text-xs text-slate-300">
            Chronological log of speech syntheses, voice configurations, and generated audio files.
          </p>
        </div>

        {history.length > 0 && (
          <button
            onClick={() => {
              if (confirm('Clear all generation history?')) {
                onClearHistory();
              }
            }}
            className="flex items-center space-x-1.5 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3.5 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500 hover:text-white transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* History Timeline */}
      {history.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-[#0b0e16] p-12 text-center">
          <History className="mx-auto h-12 w-12 text-slate-600" />
          <h3 className="mt-3 text-base font-bold text-white">No history recorded yet</h3>
          <p className="mt-1 text-xs text-slate-400">
            Synthesize your first text script to see live execution logs here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((item, index) => {
            const isPlaying = currentPlayingId === item.id;
            const isUrdu = item.language.includes('Urdu') || /[\u0600-\u06FF]/.test(item.text);

            return (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-white/5 bg-[#0d101a] p-4 hover:border-violet-500/30 transition-all"
              >
                <div className="flex items-start space-x-3 min-w-0 flex-1">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-950/40 border border-violet-500/20 text-violet-400">
                    <Mic className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-white text-xs">{item.title}</span>
                      <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] text-slate-400">
                        {item.voiceName}
                      </span>
                      <span className="rounded bg-violet-500/10 px-2 py-0.5 text-[10px] text-violet-300">
                        {item.language}
                      </span>
                      <span className="text-[10px] text-slate-500">{formatTime(item.createdAt)}</span>
                    </div>

                    <p
                      className={`mt-1.5 text-xs text-slate-400 line-clamp-1 ${
                        isUrdu ? 'font-urdu text-right text-xs' : ''
                      }`}
                      dir={isUrdu ? 'rtl' : 'ltr'}
                    >
                      {item.text}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => onPlayAudio(item)}
                    className={`flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      isPlaying
                        ? 'bg-violet-600 text-white'
                        : 'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                    <span>{isPlaying ? 'Pause' : 'Play'}</span>
                  </button>

                  <button
                    onClick={() => onLoadIntoEditor(item.text)}
                    className="flex items-center space-x-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-white/10"
                    title="Load into Editor"
                  >
                    <span>Edit</span>
                    <ArrowRight className="h-3 w-3" />
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
