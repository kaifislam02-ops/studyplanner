// components/StudyAnalyticsPanel.tsx
import React from "react";

type Props = {
  dailyCompletionRate: number;
  weeklyTotalStudyHours: number;
  weeklyTargetHours: number;
};

export const StudyAnalyticsPanel: React.FC<Props> = ({ dailyCompletionRate, weeklyTotalStudyHours, weeklyTargetHours }) => {
  const pct = Math.min(100, weeklyTargetHours === 0 ? 0 : (weeklyTotalStudyHours / weeklyTargetHours) * 100);
  return (
    <div className="glass-card">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-xl flex items-center justify-center">📊</div>
        <div>
          <h3 className="text-lg font-semibold">Study Analytics</h3>
          <div className="text-sm text-white/70">Track progress</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="p-3 rounded bg-white/4 text-center">
          <div className="text-2xl font-bold">{Math.round(dailyCompletionRate)}%</div>
          <div className="text-sm text-white/70">Today</div>
        </div>
        <div className="p-3 rounded bg-white/4 text-center">
          <div className="text-2xl font-bold">{weeklyTotalStudyHours}</div>
          <div className="text-sm text-white/70">Hours (week)</div>
        </div>
        <div className="p-3 rounded bg-white/4 text-center">
          <div className="text-2xl font-bold">{Math.round(pct)}%</div>
          <div className="text-sm text-white/70">Target</div>
        </div>
      </div>

      <div>
        <div className="flex justify-between text-sm text-white/70 mb-2">
          <div>Weekly Progress</div>
          <div>{weeklyTotalStudyHours} / {weeklyTargetHours} h</div>
        </div>
        <div className="w-full bg-white/6 h-2 rounded-full overflow-hidden">
          <div className="h-2 rounded-full" style={{ width: `${pct}%`, background: "linear-gradient(90deg,#10b981,#06b6d4)" }} />
        </div>
      </div>
    </div>
  );
};

export default StudyAnalyticsPanel;
