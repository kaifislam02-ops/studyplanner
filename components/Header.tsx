type Props = {
  selectedDate: string;
  tasksCount: number;
  totalHours: number;
  view: "day" | "week" | "analytics";
  darkMode: boolean;
  prayerEnabled: boolean;
  userName?: string;
  userEmail?: string;
  onAddTask: () => void;
  onToggleSidebar: () => void;
  onViewChange: (view: "day" | "week" | "analytics") => void;
  onToggleDarkMode: () => void;
  onGenerateSchedule: () => void;
  onSaveTemplate: () => void;
  onExport: () => void;
  onTogglePrayer: () => void;
  onSignIn?: () => void;
  onSignOut?: () => void;
  onOpenProfile?: () => void;
  onOpenSettings?: () => void;
  onOpenSoundSettings?: () => void;
};

export default function Header({ 
  selectedDate, 
  tasksCount, 
  totalHours, 
  view,
  darkMode,
  prayerEnabled,
  userName,
  userEmail,
  onAddTask,
  onToggleSidebar,
  onViewChange,
  onToggleDarkMode,
  onGenerateSchedule,
  onSaveTemplate,
  onExport,
  onTogglePrayer,
  onSignIn,
  onSignOut,
  onOpenProfile,
  onOpenSettings,
  onOpenSoundSettings,
}: Props) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const bgClass = darkMode ? 'bg-[#0F1419]' : 'bg-white';
  const borderClass = darkMode ? 'border-white/5' : 'border-gray-200';
  const textMuted = darkMode ? 'text-white/60' : 'text-gray-600';

  return (
    <header className={`border-b ${borderClass} px-6 py-4 ${bgClass}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            className={`lg:hidden p-2 hover:${darkMode ? 'bg-white/5' : 'bg-gray-100'} rounded-lg`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div>
            <h2 className="text-xl font-bold">{formatDate(selectedDate)}</h2>
            <p className={`text-sm ${textMuted} mt-0.5`}>
              {tasksCount} tasks · {totalHours} hours planned
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className={`flex ${darkMode ? 'bg-white/5' : 'bg-gray-100'} rounded-lg p-1`}>
            <button
              onClick={() => onViewChange("day")}
              className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                view === "day" 
                  ? 'bg-blue-500 text-white' 
                  : darkMode ? 'text-white/60 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => onViewChange("week")}
              className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                view === "week" 
                  ? 'bg-blue-500 text-white' 
                  : darkMode ? 'text-white/60 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => onViewChange("analytics")}
              className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                view === "analytics" 
                  ? 'bg-blue-500 text-white' 
                  : darkMode ? 'text-white/60 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Analytics
            </button>
          </div>

          {/* Actions Dropdown */}
          <div className="relative group">
            <button className={`p-2 hover:${darkMode ? 'bg-white/5' : 'bg-gray-100'} rounded-lg`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
            <div className={`absolute right-0 mt-2 w-56 ${bgClass} border ${borderClass} rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50`}>
              <button
                onClick={onGenerateSchedule}
                className={`w-full text-left px-4 py-2 text-sm hover:${darkMode ? 'bg-white/5' : 'bg-gray-100'} flex items-center gap-2`}
              >
                ✨ Generate Schedule
              </button>
              <button
                onClick={onSaveTemplate}
                className={`w-full text-left px-4 py-2 text-sm hover:${darkMode ? 'bg-white/5' : 'bg-gray-100'} flex items-center gap-2`}
              >
                💾 Save as Template
              </button>
              <button
                onClick={onExport}
                className={`w-full text-left px-4 py-2 text-sm hover:${darkMode ? 'bg-white/5' : 'bg-gray-100'} flex items-center gap-2`}
              >
                📥 Export Schedule
              </button>
              <div className={`border-t ${borderClass}`} />
              <button
                onClick={onTogglePrayer}
                className={`w-full text-left px-4 py-2 text-sm hover:${darkMode ? 'bg-white/5' : 'bg-gray-100'} flex items-center gap-2`}
              >
                🕌 Prayer Times: {prayerEnabled ? 'ON' : 'OFF'}
              </button>
              <button
                onClick={onToggleDarkMode}
                className={`w-full text-left px-4 py-2 text-sm hover:${darkMode ? 'bg-white/5' : 'bg-gray-100'} flex items-center gap-2`}
              >
                {darkMode ? '☀️' : '🌙'} {darkMode ? 'Light' : 'Dark'} Mode
              </button>
              <button
                onClick={onOpenSoundSettings}
                className={`w-full text-left px-4 py-2 text-sm hover:${darkMode ? 'bg-white/5' : 'bg-gray-100'} flex items-center gap-2`}
              >
                🔊 Sound Settings
              </button>
            </div>
          </div>

          {/* User Menu */}
          {userName ? (
            <div className="relative group">
              <button className={`flex items-center gap-2 px-3 py-2 ${darkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'} rounded-lg transition-colors`}>
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div className="text-left hidden lg:block">
                  <div className="text-sm font-medium">{userName}</div>
                  <div className={`text-xs ${textMuted}`}>{userEmail}</div>
                </div>
                <svg className="w-4 h-4 hidden lg:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* User Dropdown */}
              <div className={`absolute right-0 mt-2 w-56 ${bgClass} border ${borderClass} rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50`}>
                <div className={`px-4 py-3 border-b ${borderClass}`}>
                  <div className="font-medium">{userName}</div>
                  <div className={`text-xs ${textMuted}`}>{userEmail}</div>
                </div>
                <button
                  onClick={onOpenSettings}
                  className={`w-full text-left px-4 py-2 text-sm hover:${darkMode ? 'bg-white/5' : 'bg-gray-100'} flex items-center gap-2`}
                >
                  ⚙️ Settings
                </button>
                <button
                  onClick={onOpenProfile}
                  className={`w-full text-left px-4 py-2 text-sm hover:${darkMode ? 'bg-white/5' : 'bg-gray-100'} flex items-center gap-2`}
                >
                  👤 Profile
                </button>
                <div className={`border-t ${borderClass}`} />
                <button
                  onClick={onSignOut}
                  className={`w-full text-left px-4 py-2 text-sm text-red-400 hover:${darkMode ? 'bg-red-500/10' : 'bg-red-50'} flex items-center gap-2`}
                >
                  🚪 Sign Out
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={onSignIn}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg font-medium transition-colors text-white"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Sign In
            </button>
          )}

          {/* Add Task Button */}
          <button
            onClick={onAddTask}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 px-4 py-2 rounded-lg font-medium transition-colors text-white shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Add Task</span>
          </button>
        </div>
      </div>
    </header>
  );
}