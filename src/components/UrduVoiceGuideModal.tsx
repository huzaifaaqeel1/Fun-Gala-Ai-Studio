import React, { useState } from 'react';
import { X, CheckCircle2, Monitor, Smartphone, Globe, Info, RefreshCw } from 'lucide-react';
import { setUrduGuideDismissed, isUrduGuideDismissed } from '../utils/speechSynthesis';

interface UrduVoiceGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshVoices?: () => void;
}

export const UrduVoiceGuideModal: React.FC<UrduVoiceGuideModalProps> = ({
  isOpen,
  onClose,
  onRefreshVoices,
}) => {
  const [activeOsTab, setActiveOsTab] = useState<'windows' | 'mac' | 'android' | 'chrome'>('windows');
  const [doNotShowAgain, setDoNotShowAgain] = useState(isUrduGuideDismissed());

  if (!isOpen) return null;

  const handleClose = () => {
    setUrduGuideDismissed(doNotShowAgain);
    onClose();
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setDoNotShowAgain(checked);
    setUrduGuideDismissed(checked);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-2xl border border-violet-500/30 bg-[#0d101a] p-6 shadow-2xl shadow-violet-950/50 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-400">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">How to Enable Urdu Voices in Your Browser</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Enable free, native Pakistani Urdu speech synthesis (Microsoft Asad / Uzma / Salman)
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Notice for Users Who Already Installed Urdu */}
        <div className="mt-4 rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-3.5 text-xs text-cyan-200 flex items-start space-x-2.5">
          <Info className="h-4 w-4 shrink-0 text-cyan-400 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-white block">Already installed Urdu on Windows?</span>
            <p className="text-[11px] text-cyan-300/80 leading-relaxed">
              If you have already installed the Urdu (Pakistan) language pack on your computer, please <strong>completely close Google Chrome (all windows) and reopen it</strong>, or click the <strong>Refresh Voices</strong> button below. Browsers only load newly installed system speech tokens upon startup.
            </p>
            {onRefreshVoices && (
              <button
                onClick={() => {
                  onRefreshVoices();
                  handleClose();
                }}
                className="mt-1.5 inline-flex items-center space-x-1.5 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/40 px-3 py-1 text-xs font-semibold text-cyan-200 transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Refresh Browser Voice List Now</span>
              </button>
            )}
          </div>
        </div>

        {/* OS Selector Tabs */}
        <div className="mt-5 flex space-x-2 border-b border-white/10 pb-2 overflow-x-auto">
          {[
            { id: 'windows', label: 'Windows 10 / 11', icon: Monitor },
            { id: 'chrome', label: 'Google Chrome / Edge', icon: Globe },
            { id: 'mac', label: 'macOS / iPhone', icon: Monitor },
            { id: 'android', label: 'Android Phone', icon: Smartphone },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeOsTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveOsTab(tab.id as any)}
                className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all ${
                  isActive
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="mt-5 space-y-4 text-xs text-slate-300">
          {activeOsTab === 'windows' && (
            <div className="space-y-3">
              <div className="rounded-xl bg-violet-950/20 border border-violet-500/20 p-4">
                <h4 className="font-bold text-white text-sm mb-2 flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Microsoft Urdu Speech Pack (Windows 10 / 11)</span>
                </h4>
                <ol className="list-decimal list-inside space-y-2 text-slate-300 leading-relaxed">
                  <li>
                    Open <strong>Windows Settings</strong> (press <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-white font-mono">Win + I</kbd>).
                  </li>
                  <li>
                    Go to <strong>Time & Language</strong> → <strong>Language & Region</strong>.
                  </li>
                  <li>
                    Under <em>Preferred languages</em>, click <strong>Add a language</strong>.
                  </li>
                  <li>
                    Search for <strong>Urdu (Pakistan) - اردو (پاکستان)</strong> and select it.
                  </li>
                  <li>
                    Ensure the <strong>Text-to-speech</strong> checkbox is checked, then click <strong>Install</strong>.
                  </li>
                  <li className="text-amber-300 font-semibold">
                    ⭐ Important: Once installation finishes, restart Google Chrome. Chrome will now recognize the native Pakistani voice (Microsoft Asad or Microsoft Uzma)!
                  </li>
                </ol>
              </div>
            </div>
          )}

          {activeOsTab === 'chrome' && (
            <div className="space-y-3">
              <div className="rounded-xl bg-violet-950/20 border border-violet-500/20 p-4">
                <h4 className="font-bold text-white text-sm mb-2 flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Browser Compatibility & Edge Natural Voices</span>
                </h4>
                <ul className="space-y-2 text-slate-300 leading-relaxed">
                  <li>
                    • <strong>Microsoft Edge (Instant Natural Voices):</strong> If you open this same website in Microsoft Edge, Urdu Natural voices (<em>Microsoft Salman</em> and <em>Microsoft Uzma</em>) are built-in automatically without needing to install anything!
                  </li>
                  <li>
                    • <strong>Google Chrome:</strong> Chrome accesses your Windows SAPI5 / OneCore installed speech engines. If you recently installed Urdu in Windows, Chrome requires a full browser restart to reload the Windows speech registry.
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeOsTab === 'mac' && (
            <div className="space-y-3">
              <div className="rounded-xl bg-violet-950/20 border border-violet-500/20 p-4">
                <h4 className="font-bold text-white text-sm mb-2 flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Apple Urdu Voice (macOS & iOS)</span>
                </h4>
                <ol className="list-decimal list-inside space-y-2 text-slate-300 leading-relaxed">
                  <li>
                    Open <strong>System Settings</strong> → <strong>Accessibility</strong> → <strong>Spoken Content</strong>.
                  </li>
                  <li>
                    Click on <strong>System Voice</strong> and select <strong>Manage Voices...</strong>
                  </li>
                  <li>
                    Search for <strong>Urdu (Pakistan)</strong> and click download.
                  </li>
                  <li>
                    Once downloaded, reload this page to start listening.
                  </li>
                </ol>
              </div>
            </div>
          )}

          {activeOsTab === 'android' && (
            <div className="space-y-3">
              <div className="rounded-xl bg-violet-950/20 border border-violet-500/20 p-4">
                <h4 className="font-bold text-white text-sm mb-2 flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Speech Services by Google (Android)</span>
                </h4>
                <ol className="list-decimal list-inside space-y-2 text-slate-300 leading-relaxed">
                  <li>
                    Open phone <strong>Settings</strong> → search for <strong>Text-to-speech output</strong>.
                  </li>
                  <li>
                    Tap the <strong>gear icon</strong> next to Speech Services by Google.
                  </li>
                  <li>
                    Tap <strong>Install voice data</strong> → select <strong>Urdu (Pakistan)</strong>.
                  </li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Footer with Do Not Show Again Checkbox */}
        <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-white/10 pt-4">
          <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={doNotShowAgain}
              onChange={handleCheckboxChange}
              className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-violet-600 focus:ring-0 cursor-pointer"
            />
            <span>Do not show this popup automatically again</span>
          </label>

          <button
            onClick={handleClose}
            className="rounded-xl bg-violet-600 px-6 py-2 text-xs font-semibold text-white shadow-lg shadow-violet-600/30 hover:bg-violet-500 transition-colors w-full sm:w-auto"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
