import { useState, useEffect } from "react";
import { soundManager, SoundType } from "@/lib/sounds";

type Props = {
  darkMode: boolean;
  onClose: () => void;
};

export default function SoundSettings({ darkMode, onClose }: Props) {
  const [enabled, setEnabled] = useState(soundManager.isEnabled());
  const [volume, setVolume] = useState(soundManager.getVolume());
  const [notificationPermission, setNotificationPermission] = useState(
    typeof window !== 'undefined' && 'Notification' in window 
      ? Notification.permission 
      : 'default'
  );

  useEffect(() => {
    setEnabled(soundManager.isEnabled());
    setVolume(soundManager.getVolume());
  }, []);

  const handleToggleSound = () => {
    const newState = !enabled;
    setEnabled(newState);
    soundManager.setEnabled(newState);
    if (newState) {
      soundManager.play('success');
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    soundManager.setVolume(newVolume);
  };

  const handleRequestNotification = async () => {
    const granted = await soundManager.requestPermission();
    setNotificationPermission(granted ? 'granted' : 'denied');
    if (granted) {
      soundManager.notify('Notifications Enabled! 🎉', 'You will receive study reminders.');
    }
  };

  const testSound = (type: SoundType) => {
    soundManager.play(type);
  };

  const bgClass = darkMode ? 'bg-[#0F1419]' : 'bg-white';
  const borderClass = darkMode ? 'border-white/10' : 'border-gray-200';
  const textMuted = darkMode ? 'text-white/60' : 'text-gray-600';
  const cardBg = darkMode ? 'bg-white/5' : 'bg-gray-100';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className={`${bgClass} border ${borderClass} rounded-xl max-w-lg w-full shadow-2xl`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${borderClass}`}>
          <div>
            <h3 className="text-xl font-bold">🔊 Sound & Notifications</h3>
            <p className={`text-sm ${textMuted} mt-1`}>Customize your audio experience</p>
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

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Master Toggle */}
          <div className={`${cardBg} rounded-lg p-4`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">Enable Sounds</div>
                <div className={`text-sm ${textMuted}`}>Play audio feedback</div>
              </div>
              <button
                onClick={handleToggleSound}
                className={`relative w-14 h-7 rounded-full transition-colors ${enabled ? 'bg-blue-500' : 'bg-gray-300'}`}
              >
                <div className={`absolute w-5 h-5 bg-white rounded-full top-1 transition-transform ${enabled ? 'translate-x-8' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>

          {/* Volume Control */}
          {enabled && (
            <div className={`${cardBg} rounded-lg p-4`}>
              <div className="flex items-center justify-between mb-3">
                <div className="font-semibold">Volume</div>
                <div className={textMuted}>{Math.round(volume * 100)}%</div>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="w-full accent-blue-500"
              />
            </div>
          )}

          {/* Browser Notifications */}
          <div className={`${cardBg} rounded-lg p-4`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-semibold">Browser Notifications</div>
                <div className={`text-sm ${textMuted}`}>
                  Status: {notificationPermission === 'granted' ? '✅ Enabled' : notificationPermission === 'denied' ? '❌ Blocked' : '⏳ Not set'}
                </div>
              </div>
            </div>
            {notificationPermission !== 'granted' && (
              <button
                onClick={handleRequestNotification}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Enable Notifications
              </button>
            )}
          </div>

          {/* Test Sounds */}
          {enabled && (
            <div>
              <h4 className="font-semibold mb-3">Test Sounds</h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => testSound('notification')}
                  className={`${cardBg} hover:bg-blue-500/20 p-3 rounded-lg text-sm transition-colors`}
                >
                  🔔 Notification
                </button>
                <button
                  onClick={() => testSound('alarm')}
                  className={`${cardBg} hover:bg-red-500/20 p-3 rounded-lg text-sm transition-colors`}
                >
                  ⏰ Alarm
                </button>
                <button
                  onClick={() => testSound('pomodoro-start')}
                  className={`${cardBg} hover:bg-green-500/20 p-3 rounded-lg text-sm transition-colors`}
                >
                  ▶️ Pomodoro Start
                </button>
                <button
                  onClick={() => testSound('pomodoro-complete')}
                  className={`${cardBg} hover:bg-purple-500/20 p-3 rounded-lg text-sm transition-colors`}
                >
                  ✅ Pomodoro Done
                </button>
                <button
                  onClick={() => testSound('task-complete')}
                  className={`${cardBg} hover:bg-green-500/20 p-3 rounded-lg text-sm transition-colors`}
                >
                  ✔️ Task Complete
                </button>
                <button
                  onClick={() => testSound('success')}
                  className={`${cardBg} hover:bg-blue-500/20 p-3 rounded-lg text-sm transition-colors`}
                >
                  🎉 Success
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-4 border-t ${borderClass}`}>
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}