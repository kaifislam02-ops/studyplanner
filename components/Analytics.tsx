import type { Task, Subject } from "@/app/page";

type Props = {
  tasks: Task[];
  subjects: Subject[];
  stats: any;
  darkMode: boolean;
};

export default function Analytics({ tasks, subjects, stats, darkMode }: Props) {
  const cardBg = darkMode ? 'bg-white/5' : 'bg-white';
  const borderClass = darkMode ? 'border-white/10' : 'border-gray-200';
  const textMuted = darkMode ? 'text-white/60' : 'text-gray-600';

  // Weekly activity (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const dailyHours = last7Days.map(date => {
    const dayTasks = tasks.filter(t => t.date === date && t.completed);
    return dayTasks.reduce((sum, t) => sum + (t.endTime - t.startTime), 0);
  });

  const maxHours = Math.max(...dailyHours, 1);

  // Subject breakdown
  const subjectStats = subjects.map(subject => {
    const hours = stats.subjectHours[subject.id] || 0;
    return { ...subject, hours };
  }).sort((a, b) => b.hours - a.hours);

  const totalHours = subjectStats.reduce((sum, s) => sum + s.hours, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold">Analytics Dashboard</h2>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4">
        <div className={`${cardBg} border ${borderClass} rounded-lg p-4`}>
          <div className={`text-xs ${textMuted} mb-1`}>Completion Rate</div>
          <div className="text-3xl font-bold">{stats.completionRate}%</div>
        </div>
        <div className={`${cardBg} border ${borderClass} rounded-lg p-4`}>
          <div className={`text-xs ${textMuted} mb-1`}>Weekly Hours</div>
          <div className="text-3xl font-bold">{stats.weeklyHours}h</div>
        </div>
        <div className={`${cardBg} border ${borderClass} rounded-lg p-4`}>
          <div className={`text-xs ${textMuted} mb-1`}>Current Streak</div>
          <div className="text-3xl font-bold">{stats.streak} 🔥</div>
        </div>
        <div className={`${cardBg} border ${borderClass} rounded-lg p-4`}>
          <div className={`text-xs ${textMuted} mb-1`}>Tasks Completed</div>
          <div className="text-3xl font-bold">{stats.completedTasks}/{stats.totalTasks}</div>
        </div>
      </div>

      {/* Weekly Activity Chart */}
      <div className={`${cardBg} border ${borderClass} rounded-lg p-6`}>
        <h3 className="text-lg font-bold mb-4">Weekly Activity</h3>
        <div className="flex items-end justify-between gap-2 h-48">
          {dailyHours.map((hours, i) => {
            const height = (hours / maxHours) * 100;
            const date = new Date(last7Days[i]);
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="flex-1 flex items-end w-full">
                  <div
                    className="w-full bg-gradient-to-t from-blue-500 to-purple-500 rounded-t"
                    style={{ height: `${height}%` }}
                  />
                </div>
                <div className={`text-xs ${textMuted}`}>
                  {date.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div className="text-xs font-bold">{hours}h</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Subject Breakdown */}
      <div className={`${cardBg} border ${borderClass} rounded-lg p-6`}>
        <h3 className="text-lg font-bold mb-4">Subject Breakdown</h3>
        <div className="space-y-3">
          {subjectStats.map(subject => {
            const percentage = totalHours > 0 ? (subject.hours / totalHours) * 100 : 0;
            return (
              <div key={subject.id}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: subject.color }}
                    />
                    <span className="font-medium">{subject.name}</span>
                  </div>
                  <span className={textMuted}>{subject.hours}h ({percentage.toFixed(0)}%)</span>
                </div>
                <div className={`h-2 ${darkMode ? 'bg-white/10' : 'bg-gray-200'} rounded-full overflow-hidden`}>
                  <div
                    className="h-full rounded-full"
                    style={{ 
                      width: `${percentage}%`,
                      backgroundColor: subject.color 
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Study Insights */}
      <div className="grid grid-cols-2 gap-4">
        <div className={`${cardBg} border ${borderClass} rounded-lg p-6`}>
          <h3 className="text-lg font-bold mb-3">Top Subjects</h3>
          <div className="space-y-2">
            {subjectStats.slice(0, 3).map((subject, i) => (
              <div key={subject.id} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full ${darkMode ? 'bg-white/10' : 'bg-gray-200'} flex items-center justify-center font-bold`}>
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{subject.name}</div>
                  <div className={`text-xs ${textMuted}`}>{subject.hours} hours studied</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`${cardBg} border ${borderClass} rounded-lg p-6`}>
          <h3 className="text-lg font-bold mb-3">Progress Towards Goals</h3>
          <div className="space-y-3">
            {subjects.map(subject => {
              const actual = stats.subjectHours[subject.id] || 0;
              const goal = subject.weeklyHours;
              const progress = goal > 0 ? (actual / goal) * 100 : 0;
              return (
                <div key={subject.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{subject.name}</span>
                    <span className={`text-xs ${textMuted}`}>{actual}/{goal}h</span>
                  </div>
                  <div className={`h-1.5 ${darkMode ? 'bg-white/10' : 'bg-gray-200'} rounded-full overflow-hidden`}>
                    <div
                      className="h-full rounded-full"
                      style={{ 
                        width: `${Math.min(progress, 100)}%`,
                        backgroundColor: subject.color 
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}