import React from 'react';

interface StudyAnalyticsPanelProps {
    dailyCompletionRate: number;
    weeklyTotalStudyHours: number;
    weeklyTargetHours: number;
}

export const StudyAnalyticsPanel: React.FC<StudyAnalyticsPanelProps> = ({
    dailyCompletionRate,
    weeklyTotalStudyHours,
    weeklyTargetHours
}) => {
    
    // Calculate progress as a percentage
    const targetPercent = Math.min(100, (weeklyTotalStudyHours / weeklyTargetHours) * 100 || 0);

    return (
        <div className="bg-black/40 border border-purple-900/40 rounded-2xl p-5 shadow-2xl space-y-4">
            <h3 className="text-2xl font-extrabold text-[#efe7ff] border-b border-purple-900/50 pb-3">
                📈 Study Analytics
            </h3>

            <div className="grid grid-cols-3 gap-4 text-center">
                {/* Daily Completion Rate */}
                <div className="p-3 bg-black/20 rounded-lg border border-purple-800/50">
                    <p className="text-3xl font-bold text-green-400">
                        {dailyCompletionRate.toFixed(0)}%
                    </p>
                    <p className="text-xs text-[#cfc0f8] mt-1">Today's Completion</p>
                </div>

                {/* Total Hours Studied */}
                <div className="p-3 bg-black/20 rounded-lg border border-purple-800/50">
                    <p className="text-3xl font-bold text-yellow-400">
                        {weeklyTotalStudyHours}
                    </p>
                    <p className="text-xs text-[#cfc0f8] mt-1">Weekly Study Hrs</p>
                </div>

                {/* Progress Bar */}
                <div className="p-3 bg-black/20 rounded-lg border border-purple-800/50 flex flex-col justify-center">
                    <p className="text-xs text-[#cfc0f8] mb-1">Target Progress ({weeklyTargetHours} Hrs)</p>
                    <div className="h-2 w-full bg-gray-700 rounded-full overflow-hidden">
                        <div 
                            className="h-2 bg-pink-500 rounded-full transition-all duration-500" 
                            style={{ width: `${targetPercent}%` }}
                        />
                    </div>
                    <p className="text-xs text-pink-400 mt-1">{targetPercent.toFixed(1)}%</p>
                </div>
            </div>
        </div>
    );
};