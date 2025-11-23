import { useState, useEffect } from "react";

type Props = {
  darkMode: boolean;
  onClose: () => void;
};

type FocusSettings = {
  blockWebsites: boolean;
  websites: string[];
  blockNotifications: boolean;
  enableWhiteNoise: boolean;
  whiteNoiseType: 'rain' | 'cafe' | 'forest' | 'ocean' | 'none';
  enableBreakReminder: boolean;
  breakInterval: number; // minutes
  lockMode: boolean; // Can't exit without password
};

export default function FocusMode({ darkMode, onClose }: Props) {
  const [isActive, setIsActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [targetMinutes, setTargetMinutes] = useState(25);
  const [settings, setSettings] = useState<FocusSettings>({
    blockWebsites: false,
    websites: ['facebook.com', 'twitter.com', 'instagram.com', 'youtube.com'],
    blockNotifications: true,
    enableWhiteNoise: false,
    whiteNoiseType: 'none',
    enableBreakReminder: true,
    breakInterval: 25,
    lockMode: false,
  });
  const [newWebsite, setNewWebsite] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [unlockPassword, setUnlockPassword] = useState('');
  const [unlockAttempt, setUnlockAttempt] = useState('');
  const [showUnlock, setShowUnlock] = useState(false);

  const bgClass = darkMode ? 'bg-[#0F1419]' : 'bg-white';
  const borderClass = darkMode ? 'border-white/10' : 'border-gray-200';
  const textMuted = darkMode ? 'text-white/60' : 'text-gray-600';
  const cardBg = darkMode ? 'bg-white/5' : 'bg-gray-100';

  // Load saved settings
  useEffect(() => {
    const saved = localStorage.getItem('focus-mode-settings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  // Save settings
  useEffect(() => {
    localStorage.setItem('focus-mode-settings', JSON.stringify(settings));
  }, [settings]);

  // Timer countdown
  useEffect(() => {
    if (!isActive || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleFocusComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, timeRemaining]);

  const startFocusMode = () => {
    if (settings.lockMode && !unlockPassword) {
      const password = prompt('Set an unlock password (you will need this to exit early):');
      if (!password) return;
      setUnlockPassword(password);
    }

    setTimeRemaining(targetMinutes * 60);
    setIsActive(true);

    // Request notification permission
    if (settings.blockNotifications && 'Notification' in window) {
      Notification.requestPermission();
    }

    // Show fullscreen suggestion
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  const stopFocusMode = () => {
    if (settings.lockMode && unlockPassword) {
      setShowUnlock(true);
      return;
    }
    handleStop();
  };

  const handleUnlock = () => {
    if (unlockAttempt === unlockPassword) {
      handleStop();
      setShowUnlock(false);
      setUnlockAttempt('');
    } else {
      alert('❌ Incorrect password! Stay focused! 💪');
      setUnlockAttempt('');
    }
  };

  const handleStop = () => {
    setIsActive(false);
    setTimeRemaining(0);
    setUnlockPassword('');
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleFocusComplete = () => {
    setIsActive(false);
    
    // Show notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🎉 Focus Session Complete!', {
        body: `Great job! You focused for ${targetMinutes} minutes.`,
        icon: '🎯',
      });
    }

    // Play sound (optional)
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dy');
    audio.play().catch(() => {});
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const addWebsite = () => {
    if (newWebsite.trim()) {
      setSettings({
        ...settings,
        websites: [...settings.websites, newWebsite.trim()],
      });
      setNewWebsite('');
    }
  };

  const removeWebsite = (website: string) => {
    setSettings({
      ...settings,
      websites: settings.websites.filter(w => w !== website),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className={`${bgClass} border ${borderClass} rounded-xl max-w-2xl w-full shadow-2xl max-h-[90vh] flex flex-col`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${borderClass} flex-shrink-0`}>
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2">
              🎯 Focus Mode
            </h3>
            <p className={`text-sm ${textMuted} mt-1`}>
              {isActive ? 'Focus session in progress...' : 'Eliminate distractions and maximize productivity'}
            </p>
          </div>
          <button
            onClick={isActive ? stopFocusMode : onClose}
            className={`p-2 hover:${darkMode ? 'bg-white/10' : 'bg-gray-100'} rounded-lg transition-colors`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!isActive ? (
            <>
              {/* Timer Setup */}
              <div className={`${cardBg} rounded-lg p-6 text-center`}>
                <div className="text-6xl font-bold mb-4">{targetMinutes}</div>
                <div className={`text-sm ${textMuted} mb-4`}>minutes</div>
                <input
                  type="range"
                  min="5"
                  max="120"
                  step="5"
                  value={targetMinutes}
                  onChange={(e) => setTargetMinutes(parseInt(e.target.value))}
                  className="w-full accent-blue-500"
                />
                <div className="flex justify-between text-xs mt-2">
                  <span className={textMuted}>5 min</span>
                  <span className={textMuted}>120 min</span>
                </div>
              </div>

              {/* Quick Presets */}
              <div>
                <h4 className="font-semibold mb-3">⚡ Quick Presets</h4>
                <div className="grid grid-cols-4 gap-2">
                  {[15, 25, 45, 60].map(mins => (
                    <button
                      key={mins}
                      onClick={() => setTargetMinutes(mins)}
                      className={`${targetMinutes === mins ? 'bg-blue-500 text-white' : cardBg} hover:bg-blue-500/20 p-3 rounded-lg text-sm font-medium transition-colors`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>

              {/* Settings Toggle */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`w-full ${cardBg} hover:bg-white/10 rounded-lg p-4 flex items-center justify-between transition-colors`}
              >
                <span className="font-medium">⚙️ Advanced Settings</span>
                <svg className={`w-5 h-5 transition-transform ${showSettings ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Advanced Settings */}
              {showSettings && (
                <div className={`${cardBg} rounded-lg p-4 space-y-4`}>
                  {/* Block Websites */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">🚫 Block Distracting Websites</div>
                      <button
                        onClick={() => setSettings({ ...settings, blockWebsites: !settings.blockWebsites })}
                        className={`relative w-14 h-7 rounded-full transition-colors ${settings.blockWebsites ? 'bg-blue-500' : 'bg-gray-300'}`}
                      >
                        <div className={`absolute w-5 h-5 bg-white rounded-full top-1 transition-transform ${settings.blockWebsites ? 'translate-x-8' : 'translate-x-1'}`} />
                      </button>
                    </div>
                    
                    {settings.blockWebsites && (
                      <div className="space-y-2 mt-3">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newWebsite}
                            onChange={(e) => setNewWebsite(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && addWebsite()}
                            placeholder="example.com"
                            className={`flex-1 ${darkMode ? 'bg-white/10 border-white/20' : 'bg-white border-gray-300'} border rounded-lg px-3 py-2 text-sm`}
                          />
                          <button
                            onClick={addWebsite}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
                          >
                            Add
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {settings.websites.map(website => (
                            <div key={website} className="flex items-center gap-1 bg-red-500/20 text-red-400 px-2 py-1 rounded text-xs">
                              <span>{website}</span>
                              <button onClick={() => removeWebsite(website)} className="hover:text-red-300">✕</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Block Notifications */}
                  <div className="flex items-center justify-between">
                    <div className="font-medium">🔕 Block Notifications</div>
                    <button
                      onClick={() => setSettings({ ...settings, blockNotifications: !settings.blockNotifications })}
                      className={`relative w-14 h-7 rounded-full transition-colors ${settings.blockNotifications ? 'bg-blue-500' : 'bg-gray-300'}`}
                    >
                      <div className={`absolute w-5 h-5 bg-white rounded-full top-1 transition-transform ${settings.blockNotifications ? 'translate-x-8' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  {/* Lock Mode */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">🔒 Lock Mode</div>
                      <div className={`text-xs ${textMuted}`}>Require password to exit early</div>
                    </div>
                    <button
                      onClick={() => setSettings({ ...settings, lockMode: !settings.lockMode })}
                      className={`relative w-14 h-7 rounded-full transition-colors ${settings.lockMode ? 'bg-red-500' : 'bg-gray-300'}`}
                    >
                      <div className={`absolute w-5 h-5 bg-white rounded-full top-1 transition-transform ${settings.lockMode ? 'translate-x-8' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>
              )}

              {/* Start Button */}
              <button
                onClick={startFocusMode}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-4 rounded-lg font-bold text-lg transition-colors"
              >
                🚀 Start Focus Session
              </button>
            </>
          ) : (
            <>
              {/* Active Focus Session */}
              <div className="text-center space-y-8">
                <div className="relative">
                  <svg className="w-64 h-64 mx-auto" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke={darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
                      strokeWidth="8"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="url(#gradient)"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 45}`}
                      strokeDashoffset={`${2 * Math.PI * 45 * (1 - timeRemaining / (targetMinutes * 60))}`}
                      transform="rotate(-90 50 50)"
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3B82F6" />
                        <stop offset="100%" stopColor="#8B5CF6" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-5xl font-bold">{formatTime(timeRemaining)}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-2xl font-bold">Stay Focused! 💪</div>
                  <div className={textMuted}>You're doing great. Keep going!</div>
                </div>

                {settings.blockWebsites && (
                  <div className={`${darkMode ? 'bg-red-500/10' : 'bg-red-50'} border ${darkMode ? 'border-red-500/30' : 'border-red-200'} rounded-lg p-4`}>
                    <div className="text-red-400 font-medium mb-2">🚫 Blocked Websites</div>
                    <div className="text-sm">
                      {settings.websites.slice(0, 3).join(', ')}
                      {settings.websites.length > 3 && ` +${settings.websites.length - 3} more`}
                    </div>
                  </div>
                )}

                <button
                  onClick={stopFocusMode}
                  className={`${darkMode ? 'bg-red-500/20 hover:bg-red-500/30' : 'bg-red-100 hover:bg-red-200'} text-red-400 px-6 py-3 rounded-lg font-medium transition-colors`}
                >
                  {settings.lockMode ? '🔒 Unlock & End Session' : '⏹️ End Session'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Unlock Modal */}
      {showUnlock && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
          <div className={`${bgClass} border ${borderClass} rounded-xl max-w-md w-full shadow-2xl p-6`}>
            <h3 className="text-xl font-bold mb-4">🔒 Enter Password to Unlock</h3>
            <p className={`text-sm ${textMuted} mb-4`}>
              Stay strong! You set this lock to help yourself focus.
            </p>
            <input
              type="password"
              value={unlockAttempt}
              onChange={(e) => setUnlockAttempt(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleUnlock()}
              placeholder="Enter password"
              className={`w-full ${darkMode ? 'bg-white/10 border-white/20' : 'bg-white border-gray-300'} border rounded-lg px-4 py-3 mb-4`}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowUnlock(false);
                  setUnlockAttempt('');
                }}
                className={`flex-1 ${cardBg} hover:bg-white/10 px-4 py-2 rounded-lg font-medium`}
              >
                Cancel
              </button>
              <button
                onClick={handleUnlock}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium"
              >
                Unlock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}