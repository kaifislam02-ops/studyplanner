import { useState } from "react";
import type { ParentalControls, StudySession } from "@/types/parental";

type Props = {
  darkMode: boolean;
  studentName: string;
  controls: ParentalControls;
  recentSessions: StudySession[];
  weeklyStats: {
    totalHours: number;
    tasksCompleted: number;
    averageDaily: number;
    longestSession: number;
  };
  onUpdateControls: (controls: Partial<ParentalControls>) => void;
  onClose: () => void;
};

export default function ParentalDashboard({
  darkMode,
  studentName,
  controls,
  recentSessions,
  weeklyStats,
  onUpdateControls,
  onClose,
}: Props) {
  const [activeTab, setActiveTab] = useState<'overview' | 'controls' | 'reports'>('overview');
  const [localControls, setLocalControls] = useState(controls);

  const bgClass = darkMode ? 'bg-[#0F1419]' : 'bg-white';
  const borderClass = darkMode ? 'border-white/10' : 'border-gray-200';
  const textMuted = darkMode ? 'text-white/60' : 'text-gray-600';
  const cardBg = darkMode ? 'bg-white/5' : 'bg-gray-100';

  const handleSaveControls = () => {
    onUpdateControls(localControls);
    alert('Parental controls updated successfully!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className={`${bgClass} border ${borderClass} rounded-xl max-w-4xl w-full shadow-2xl max-h-[90vh] overflow-hidden flex flex-col`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${borderClass}`}>
          <div>
            <h3 className="text-xl font-bold">👨‍👩‍👧 Parental Dashboard</h3>
            <p className={`text-sm ${textMuted} mt-1`}>Monitoring {studentName}'s study activities</p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 hover:${darkMode ? 'bg-white/10' : 'bg-gray-100'} rounded-lg transition-colors`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className={`flex border-b ${borderClass} px-6`}>
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-500'
                : `border-transparent ${textMuted} hover:text-white`
            }`}
          >
            📊 Overview
          </button>
          <button
            onClick={() => setActiveTab('controls')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'controls'
                ? 'border-blue-500 text-blue-500'
                : `border-transparent ${textMuted} hover:text-white`
            }`}
          >
            ⚙️ Controls
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'reports'
                ? 'border-blue-500 text-blue-500'
                : `border-transparent ${textMuted} hover:text-white`
            }`}
          >
            📈 Reports
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Weekly Stats */}
              <div>
                <h4 className="font-semibold mb-3">This Week's Activity</h4>
                <div className="grid grid-cols-4 gap-4">
                  <div className={`${cardBg} rounded-lg p-4 text-center`}>
                    <div className="text-3xl font-bold">{weeklyStats.totalHours}h</div>
                    <div className={`text-xs ${textMuted} mt-1`}>Total Hours</div>
                  </div>
                  <div className={`${cardBg} rounded-lg p-4 text-center`}>
                    <div className="text-3xl font-bold">{weeklyStats.tasksCompleted}</div>
                    <div className={`text-xs ${textMuted} mt-1`}>Tasks Done</div>
                  </div>
                  <div className={`${cardBg} rounded-lg p-4 text-center`}>
                    <div className="text-3xl font-bold">{weeklyStats.averageDaily}h</div>
                    <div className={`text-xs ${textMuted} mt-1`}>Daily Average</div>
                  </div>
                  <div className={`${cardBg} rounded-lg p-4 text-center`}>
                    <div className="text-3xl font-bold">{weeklyStats.longestSession}h</div>
                    <div className={`text-xs ${textMuted} mt-1`}>Longest Session</div>
                  </div>
                </div>
              </div>

              {/* Recent Sessions */}
              <div>
                <h4 className="font-semibold mb-3">Recent Study Sessions</h4>
                <div className={`${cardBg} rounded-lg overflow-hidden`}>
                  {recentSessions.length === 0 ? (
                    <div className="p-8 text-center text-white/40">
                      No study sessions yet
                    </div>
                  ) : (
                    <div className="divide-y divide-white/5">
                      {recentSessions.slice(0, 5).map((session) => (
                        <div key={session.id} className="p-4 flex items-center justify-between">
                          <div>
                            <div className="font-medium">
                              {new Date(session.startTime).toLocaleDateString()} - {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className={`text-sm ${textMuted}`}>
                              {session.duration} min • {session.tasksCompleted} tasks • {session.subjects.join(', ')}
                            </div>
                          </div>
                          <div className="text-green-400">✓</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Health Indicators */}
              <div className={`${darkMode ? 'bg-green-500/10' : 'bg-green-50'} border ${darkMode ? 'border-green-500/30' : 'border-green-200'} rounded-lg p-4`}>
                <div className="flex gap-2">
                  <span className="text-green-500">✓</span>
                  <div>
                    <div className="font-semibold text-green-500">Healthy Study Habits</div>
                    <div className={`text-sm ${textMuted} mt-1`}>
                      • Regular breaks taken<br />
                      • No late-night studying<br />
                      • Consistent daily routine
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'controls' && (
            <div className="space-y-6">
              {/* Time Limits */}
              <div>
                <h4 className="font-semibold mb-3">⏰ Time Management</h4>
                <div className={`${cardBg} rounded-lg p-4 space-y-4`}>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Maximum Daily Study Hours
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={localControls.maxDailyHours}
                      onChange={(e) => setLocalControls({ ...localControls, maxDailyHours: parseInt(e.target.value) })}
                      className={`w-full ${darkMode ? 'bg-white/10 border-white/20' : 'bg-white border-gray-300'} border rounded-lg px-4 py-2`}
                    />
                    <p className={`text-xs ${textMuted} mt-1`}>
                      Recommended: 6-8 hours for students
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Mandatory Break (minutes after continuous study)
                    </label>
                    <input
                      type="number"
                      min="15"
                      max="120"
                      step="15"
                      value={localControls.mandatoryBreakMinutes}
                      onChange={(e) => setLocalControls({ ...localControls, mandatoryBreakMinutes: parseInt(e.target.value) })}
                      className={`w-full ${darkMode ? 'bg-white/10 border-white/20' : 'bg-white border-gray-300'} border rounded-lg px-4 py-2`}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Enforce Pomodoro Timer</div>
                      <div className={`text-xs ${textMuted}`}>Force 25min focus / 5min break cycles</div>
                    </div>
                    <button
                      onClick={() => setLocalControls({ ...localControls, enforcePomodoroTimer: !localControls.enforcePomodoroTimer })}
                      className={`relative w-14 h-7 rounded-full transition-colors ${localControls.enforcePomodoroTimer ? 'bg-blue-500' : 'bg-gray-300'}`}
                    >
                      <div className={`absolute w-5 h-5 bg-white rounded-full top-1 transition-transform ${localControls.enforcePomodoroTimer ? 'translate-x-8' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Safety Controls */}
              <div>
                <h4 className="font-semibold mb-3">🛡️ Safety & Restrictions</h4>
                <div className={`${cardBg} rounded-lg p-4 space-y-4`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Require Approval for Account Deletion</div>
                      <div className={`text-xs ${textMuted}`}>Student needs parent permission to delete account</div>
                    </div>
                    <button
                      onClick={() => setLocalControls({ ...localControls, requireApprovalForDelete: !localControls.requireApprovalForDelete })}
                      className={`relative w-14 h-7 rounded-full transition-colors ${localControls.requireApprovalForDelete ? 'bg-blue-500' : 'bg-gray-300'}`}
                    >
                      <div className={`absolute w-5 h-5 bg-white rounded-full top-1 transition-transform ${localControls.requireApprovalForDelete ? 'translate-x-8' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Lock Critical Settings</div>
                      <div className={`text-xs ${textMuted}`}>Prevent changes to prayer times, notifications</div>
                    </div>
                    <button
                      onClick={() => setLocalControls({ ...localControls, lockSettings: !localControls.lockSettings })}
                      className={`relative w-14 h-7 rounded-full transition-colors ${localControls.lockSettings ? 'bg-blue-500' : 'bg-gray-300'}`}
                    >
                      <div className={`absolute w-5 h-5 bg-white rounded-full top-1 transition-transform ${localControls.lockSettings ? 'translate-x-8' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Notifications */}
              <div>
                <h4 className="font-semibold mb-3">📬 Parent Notifications</h4>
                <div className={`${cardBg} rounded-lg p-4 space-y-4`}>
                  <div className="flex items-center justify-between">
                    <div className="font-medium">Notify on Login</div>
                    <button
                      onClick={() => setLocalControls({ ...localControls, notifyOnLogin: !localControls.notifyOnLogin })}
                      className={`relative w-14 h-7 rounded-full transition-colors ${localControls.notifyOnLogin ? 'bg-blue-500' : 'bg-gray-300'}`}
                    >
                      <div className={`absolute w-5 h-5 bg-white rounded-full top-1 transition-transform ${localControls.notifyOnLogin ? 'translate-x-8' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="font-medium">Weekly Progress Report</div>
                    <button
                      onClick={() => setLocalControls({ ...localControls, weeklyReportEnabled: !localControls.weeklyReportEnabled })}
                      className={`relative w-14 h-7 rounded-full transition-colors ${localControls.weeklyReportEnabled ? 'bg-blue-500' : 'bg-gray-300'}`}
                    >
                      <div className={`absolute w-5 h-5 bg-white rounded-full top-1 transition-transform ${localControls.weeklyReportEnabled ? 'translate-x-8' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="font-medium">Alert on Long Sessions (&gt;2 hours)</div>
                    <button
                      onClick={() => setLocalControls({ ...localControls, notifyOnLongSession: !localControls.notifyOnLongSession })}
                      className={`relative w-14 h-7 rounded-full transition-colors ${localControls.notifyOnLongSession ? 'bg-blue-500' : 'bg-gray-300'}`}
                    >
                      <div className={`absolute w-5 h-5 bg-white rounded-full top-1 transition-transform ${localControls.notifyOnLongSession ? 'translate-x-8' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSaveControls}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
              >
                Save Parental Controls
              </button>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-6">
              <div className={`${cardBg} rounded-lg p-6 text-center`}>
                <div className="text-4xl mb-3">📊</div>
                <h4 className="font-semibold mb-2">Weekly Report</h4>
                <p className={textMuted}>
                  Detailed reports coming soon! You'll receive weekly summaries via email.
                </p>
                <button className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors">
                  Generate Report Now
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}