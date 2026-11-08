import React, { useState } from 'react';
import {
  FolderArchive,
  Search,
  Play,
  Pause,
  Download,
  Trash2,
  Edit2,
  Check,
  X,
  Clock,
  FileText,
  Calendar,
  Sparkles,
  ExternalLink,
  Copy,
} from 'lucide-react';
import { GeneratedAudioItem } from '../types/tts';

interface MyAudioLibraryProps {
  library: GeneratedAudioItem[];
  currentPlayingId: string | null;
  onPlayAudio: (item: GeneratedAudioItem) => void;
  onDeleteAudio: (id: string) => void;
  onRenameAudio: (id: string, newTitle: string) => void;
  onLoadIntoEditor: (text: string) => void;
}

export const MyAudioLibrary: React.FC<MyAudioLibraryProps> = ({
  library,
  currentPlayingId,
  onPlayAudio,
  onDeleteAudio,
  onRenameAudio,
  onLoadIntoEditor,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitleValue, setEditTitleValue] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const startRename = (item: GeneratedAudioItem) => {
    setEditingId(item.id);
    setEditTitleValue(item.title);
  };

  const saveRename = (id: string) => {
    if (editTitleValue.trim()) {
      onRenameAudio(id, editTitleValue.trim());
    }
    setEditingId(null);
  };

  const cancelRename = () => {
    setEditingId(null);
  };

  const handleCopyText = (item: GeneratedAudioItem) => {
    navigator.clipboard.writeText(item.text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = (item: GeneratedAudioItem) => {
    const link = document.createElement('a');
    link.href = item.audioUrl;
    const sanitized = (item.title || 'audio').replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    link.download = `${sanitized}.${item.format || 'mp3'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDuration = (secs: number) => {
    if (isNaN(secs) || !secs) return '0:00';
    const mins = Math.floor(secs / 60);
    const rem = Math.floor(secs % 60);
    return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
  };

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredItems = library.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.text.toLowerCase().includes(q) ||
      item.voiceName.toLowerCase().includes(q) ||
      item.language.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#0d101a] p-6 backdrop-blur-xl">
        <div>
          <div className="flex items-center space-x-2">
            <span className="rounded-full bg-violet-500/20 px-2.5 py-0.5 text-xs font-semibold text-violet-300">
              Personal Vault
            </span>
            <span className="text-xs text-slate-400">
              {library.length} {library.length === 1 ? 'recording' : 'recordings'} stored
            </span>
          </div>
          <h2 className="mt-1 text-2xl font-black text-white">My Audio Library</h2>
          <p className="text-xs text-slate-300">
            Access, download, rename, and play all your generated speeches and long YouTube stories.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search audio library..."
            className="w-full rounded-xl border border-white/10 bg-[#121524] py-2 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Library Items List */}
      {filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-[#0b0e16] p-12 text-center">
          <FolderArchive className="mx-auto h-12 w-12 text-slate-600" />
          <h3 className="mt-3 text-base font-bold text-white">Your library is currently empty</h3>
          <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
            Generate your first Pakistani Urdu storytelling speech or multilingual narration in the Text-to-Speech editor to save it here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredItems.map((item) => {
            const isPlaying = currentPlayingId === item.id;
            const isEditing = editingId === item.id;
            const isUrdu = item.language.includes('Urdu') || /[\u0600-\u06FF]/.test(item.text);

            return (
              <div
                key={item.id}
                className={`flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-2xl p-5 border transition-all ${
                  isPlaying
                    ? 'border-violet-500 bg-violet-950/20 shadow-lg shadow-violet-500/10'
                    : 'border-white/10 bg-[#0d101a] hover:border-white/20'
                }`}
              >
                {/* Left section: Play button + Title + Text preview */}
                <div className="flex items-start space-x-4 flex-1 min-w-0">
                  <button
                    onClick={() => onPlayAudio(item)}
                    className={`mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-md transition-all ${
                      isPlaying
                        ? 'bg-violet-600 text-white shadow-violet-600/30 animate-pulse'
                        : 'bg-white/10 text-white hover:bg-violet-600'
                    }`}
                    title={isPlaying ? 'Pause' : 'Play audio'}
                  >
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    {/* Title with edit mode */}
                    {isEditing ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={editTitleValue}
                          onChange={(e) => setEditTitleValue(e.target.value)}
                          className="rounded-lg border border-violet-500 bg-[#161a29] px-2.5 py-1 text-xs text-white focus:outline-none"
                          autoFocus
                        />
                        <button
                          onClick={() => saveRename(item.id)}
                          className="rounded-lg bg-emerald-600 p-1 text-white hover:bg-emerald-500"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={cancelRename}
                          className="rounded-lg bg-slate-700 p-1 text-white hover:bg-slate-600"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <h4 className="font-bold text-white text-sm truncate">{item.title}</h4>
                        <button
                          onClick={() => startRename(item)}
                          className="text-slate-500 hover:text-white"
                          title="Rename recording"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                      </div>
                    )}

                    {/* Metadata chips */}
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <span className="font-semibold text-violet-400">{item.voiceName}</span>
                      <span>•</span>
                      <span>{item.language}</span>
                      <span>•</span>
                      <span className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatDuration(item.duration)}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(item.createdAt)}</span>
                      </span>
                    </div>

                    {/* Original text snippet */}
                    <p
                      className={`mt-2 text-xs text-slate-300 line-clamp-2 bg-white/[0.02] p-2 rounded-lg border border-white/5 ${
                        isUrdu ? 'font-urdu text-right text-sm' : ''
                      }`}
                      dir={isUrdu ? 'rtl' : 'ltr'}
                    >
                      {item.text}
                    </p>
                  </div>
                </div>

                {/* Right section: Action buttons */}
                <div className="flex items-center space-x-2 shrink-0 self-end md:self-center">
                  {/* Load into editor */}
                  <button
                    onClick={() => onLoadIntoEditor(item.text)}
                    className="flex items-center space-x-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
                    title="Load text into Text-to-Speech editor"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Use Text</span>
                  </button>

                  {/* Copy text */}
                  <button
                    onClick={() => handleCopyText(item)}
                    className="flex items-center space-x-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
                    title="Copy original text"
                  >
                    {copiedId === item.id ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    <span className="hidden sm:inline">
                      {copiedId === item.id ? 'Copied' : 'Copy'}
                    </span>
                  </button>

                  {/* Download MP3/WAV (only if audio file genuinely exists) or Speak in Studio */}
                  {item.audioUrl ? (
                    <button
                      onClick={() => handleDownload(item)}
                      className="flex items-center space-x-1 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-violet-600/30 hover:bg-violet-500 transition-colors"
                      title="Download audio file"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onLoadIntoEditor(item.text)}
                      className="flex items-center space-x-1 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-violet-600/30 hover:bg-violet-500 transition-colors"
                      title="Read story in studio"
                    >
                      <Play className="h-3.5 w-3.5" />
                      <span>Read Story</span>
                    </button>
                  )}

                  {/* Delete */}
                  <button
                    onClick={() => {
                      if (confirm(`Delete "${item.title}"?`)) {
                        onDeleteAudio(item.id);
                      }
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-colors"
                    title="Delete recording"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
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
