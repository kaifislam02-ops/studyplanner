import { useState } from "react";
import type { UserData } from "@/hooks/useAuth";

type Props = {
  user: UserData;
  darkMode: boolean;
  prayerEnabled: boolean;
  onClose: () => void;
  onToggleDarkMode: () => void;
  onTogglePrayer: () => void;
  onUpdatePreferences: (prefs: Partial<UserData['preferences']>) => Promise<any>;
};

export default function SettingsPage({
  user,
  darkMode,
  prayerEnabled,
  onClose,
  onToggleDarkMode,
  onTogglePrayer,
  onUpdatePreferences,
}: Props) {
  const prefs = user.preferences || { weekStartsOn: 0, defaultTaskDuration: 1 };
  const [weekStartsOn, setWeekStartsOn] = useState(prefs.weekStartsOn);
  const [defaultTaskDuration, setDefaultTaskDuration] = useState(prefs.defaultTaskDuration);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const bgClass = darkMode ? 'bg-[#0F1419]' : 'bg-white';
  const borderClass = darkMode ? 'border-white/10' : 'border-gray-200';
  const textMuted = darkMode ? 'text-white/60' : 'text-gray-600';
  const cardBg = darkMode ? 'bg-white/5' : 'bg-gray-100';

  const handleSave = async () => {
    setSaving(true);
    setMessage("");

    const result = await onUpdatePreferences({
      darkMode,
      prayerEnabled,
      weekStartsOn,
      defaultTaskDuration,
    });

    setSaving(false);
    if (result.success) {
      setMessage("Settings saved successfully!");
      setTimeout(() => setMessage(""), 3000);
    } else {
      setMessage(result.error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className={`${bgClass} border ${borderClass} rounded-xl max-w-2xl w-full shadow-2xl max-h-[90vh] flex flex-col`}>
        {/* Header - Fixed */}
        <div className={`flex items-center justify-between p-6 border-b ${borderClass} flex-shrink-0`}>
          <div>
            <h3 className="text-xl font-bold">Settings</h3>
            <p className={`text-sm ${textMuted} mt-1`}>Customize your StudyFlow experience</p>
          </div>
          <button
            onClick={onClose}
            className={`p-1 hover:${darkMode ? 'bg-white/10' : 'bg-gray-100'} rounded-lg transition-colors`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {message && (
            <div className={`${message.includes('success') ? 'bg-green-500/10 border-green-500/50 text-green-400' : 'bg-red-500/10 border-red-500/50 text-red-400'} border rounded-lg p-3 text-sm`}>
              {message}
            </div>
          )}

          {/* Appearance */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              🎨 Appearance
            </h4>
            <div className={`${cardBg} rounded-lg p-4 space-y-4`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Dark Mode</div>
                  <div className={`text-sm ${textMuted}`}>Use dark theme across the app</div>
                </div>
                <button
                  onClick={onToggleDarkMode}
                  className={`relative w-14 h-7 rounded-full transition-colors ${darkMode ? 'bg-blue-500' : 'bg-gray-300'}`}
                >
                  <div className={`absolute w-5 h-5 bg-white rounded-full top-1 transition-transform ${darkMode ? 'translate-x-8' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Prayer Times */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              🕌 Prayer Times
            </h4>
            <div className={`${cardBg} rounded-lg p-4 space-y-4`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Enable Prayer Times</div>
                  <div className={`text-sm ${textMuted}`}>Show prayer times in schedule</div>
                </div>
                <button
                  onClick={onTogglePrayer}
                  className={`relative w-14 h-7 rounded-full transition-colors ${prayerEnabled ? 'bg-blue-500' : 'bg-gray-300'}`}
                >
                  <div className={`absolute w-5 h-5 bg-white rounded-full top-1 transition-transform ${prayerEnabled ? 'translate-x-8' : 'translate-x-1'}`} />
                </button>
              </div>
              {prayerEnabled && (
                <div className={`text-sm ${textMuted} pl-4 border-l-2 ${darkMode ? 'border-cyan-500/30' : 'border-cyan-500'}`}>
                  Prayer times: Fajr (5 AM), Dhuhr (1 PM), Asr (4 PM), Maghrib (6 PM), Isha (8 PM)
                </div>
              )}
            </div>
          </div>

          {/* Schedule */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              📅 Schedule
            </h4>
            <div className={`${cardBg} rounded-lg p-4 space-y-4`}>
              <div>
                <label className={`block text-sm font-medium mb-2`}>
                  Week Starts On
                </label>
                <select
                  value={weekStartsOn}
                  onChange={(e) => setWeekStartsOn(parseInt(e.target.value))}
                  className={`w-full ${darkMode ? 'bg-white/10 border-white/20' : 'bg-white border-gray-300'} border rounded-lg px-4 py-2.5`}
                >
                  <option value={0}>Sunday</option>
                  <option value={1}>Monday</option>
                  <option value={6}>Saturday</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2`}>
                  Default Task Duration
                </label>
                <select
                  value={defaultTaskDuration}
                  onChange={(e) => setDefaultTaskDuration(parseInt(e.target.value))}
                  className={`w-full ${darkMode ? 'bg-white/10 border-white/20' : 'bg-white border-gray-300'} border rounded-lg px-4 py-2.5`}
                >
                  <option value={1}>1 hour</option>
                  <option value={2}>2 hours</option>
                  <option value={3}>3 hours</option>
                </select>
              </div>
            </div>
          </div>

          {/* Data & Storage */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              💾 Data & Storage
            </h4>
            <div className={`${cardBg} rounded-lg p-4 space-y-3`}>
              <div className="flex items-center justify-between text-sm">
                <span className={textMuted}>Storage Used</span>
                <span className="font-medium">Cloud Sync Enabled</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className={textMuted}>Last Synced</span>
                <span className="font-medium">Just now</span>
              </div>
              <button
                className={`w-full px-4 py-2 ${darkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-200 hover:bg-gray-300'} rounded-lg text-sm font-medium transition-colors`}
              >
                Clear Local Cache
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2 text-red-400">
              ⚠️ Danger Zone
            </h4>
            <div className={`${cardBg} rounded-lg p-4 space-y-3`}>
              <button
                className={`w-full px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm font-medium transition-colors`}
              >
                Delete All Data
              </button>
              <button
                className={`w-full px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm font-medium transition-colors`}
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>

        {/* Footer - Fixed (Save buttons) */}
        <div className={`flex gap-3 p-6 border-t ${borderClass} flex-shrink-0`}>
          <button
            onClick={onClose}
            className={`flex-1 px-4 py-2.5 ${darkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-200 hover:bg-gray-300'} rounded-lg font-medium transition-colors`}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}