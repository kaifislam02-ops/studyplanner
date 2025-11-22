type Props = {
  selectedDate: string;
  tasksCount: number;
  totalHours: number;
  view: "day" | "week" | "analytics";
  darkMode: boolean;
  prayerEnabled: boolean;
  onAddTask: () => void;
  onToggleSidebar: () => void;
  onViewChange: (view: "day" | "week" | "analytics") => void;
  onToggleDarkMode: () => void;
  onGenerateSchedule: () => void;
  onSaveTemplate: () => void;
  onExport: () => void;
  onTogglePrayer: () => void;
};

export default function Header({ 
  selectedDate, 
  tasksCount, 
  totalHours, 
  view,
  darkMode,
  prayerEnabled,
  onAddTask,
  onToggleSidebar,
  onViewChange,
  onToggleDarkMode,
  onGenerateSchedule,
  onSaveTemplate,
  onExport,
  onTogglePrayer,
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
            </div>
          </div>

          {/* Add Task Button */}
          <button
            onClick={onAddTask}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg font-medium transition-colors text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Task
          </button>
        </div>
      </div>
    </header>
  );
}