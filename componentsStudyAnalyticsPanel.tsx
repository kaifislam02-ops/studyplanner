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
    
    const targetPercent = Math.min(100, (weeklyTotalStudyHours / weeklyTargetHours) * 100 || 0);

    return (
        <div className="glass-card rounded-2xl p-6 h-full">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold">📊</span>
                </div>
                <div>
                    <h3 className="font-semibold text-gray-900 text-lg">Study Analytics</h3>
                    <p className="text-sm text-gray-600">Track your progress and performance</p>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
                {/* Daily Completion */}
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                    <div className="text-2xl font-bold text-blue-600 mb-1">
                        {dailyCompletionRate.toFixed(0)}%
                    </div>
                    <div className="text-sm text-blue-600 font-medium">Today</div>
                    <div className="text-xs text-blue-500 mt-1">Completion</div>
                </div>

                {/* Weekly Hours */}
                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                    <div className="text-2xl font-bold text-green-600 mb-1">
                        {weeklyTotalStudyHours}
                    </div>
                    <div className="text-sm text-green-600 font-medium">Hours</div>
                    <div className="text-xs text-green-500 mt-1">This Week</div>
                </div>

                {/* Progress */}
                <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                    <div className="text-2xl font-bold text-purple-600 mb-1">
                        {targetPercent.toFixed(0)}%
                    </div>
                    <div className="text-sm text-purple-600 font-medium">Target</div>
                    <div className="text-xs text-purple-500 mt-1">Achieved</div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-3">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-700 font-medium">Weekly Progress</span>
                    <span className="text-gray-600">{weeklyTotalStudyHours} / {weeklyTargetHours} hours</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div 
                        className="bg-gradient-to-r from-green-400 to-blue-500 h-3 rounded-full transition-all duration-1000 ease-out shadow-inner" 
                        style={{ width: `${targetPercent}%` }}
                    />
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                    <span>Keep going!</span>
                    <span>{targetPercent.toFixed(1)}% complete</span>
                </div>
            </div>
        </div>
    );
};