import React from 'react';
import { Subject } from '@/app/page';

interface SubjectPlannerProps {
    subjects: Subject[];
    addSubject: () => void;
    handleChange: (i: number, field: keyof Subject, value: string) => void;
    removeSubject: (id: string) => void;
    generateWeeklyTimetable: () => void;
    totalRequestedHours: number;
    maxPossibleDailyHours: number;
    neonButtonClass: (color: string) => string;
    COMMON_SUBJECTS: string[];
}

export const SubjectPlanner: React.FC<SubjectPlannerProps> = ({
    subjects,
    addSubject,
    handleChange,
    removeSubject,
    generateWeeklyTimetable,
    totalRequestedHours,
    maxPossibleDailyHours,
    neonButtonClass,
    COMMON_SUBJECTS
}) => {
    return (
        <div className="space-y-3">
            <h4 className="text-lg font-semibold text-[#cfc0f8]">Subjects & Goals</h4>
            {subjects.map((sub, i) => (
                <div key={sub.id} className="flex gap-2 items-center bg-black/20 p-2 rounded-lg border border-purple-900/40">
                    
                    {/* Name Input/Select - FIXED CONTRAST */}
                    <select
                        value={sub.name}
                        onChange={(e) => handleChange(i, "name", e.target.value)}
                        className="flex-1 bg-[#0a0420] border border-purple-700/50 focus:border-[#A855F7] text-sm p-2 rounded-lg outline-none text-white appearance-none hover:bg-[#0f062a] transition-colors"
                    >
                        <option value="" className="bg-[#0a0420] text-gray-300">Select Subject</option>
                        {COMMON_SUBJECTS.map(s => <option key={s} value={s} className="bg-[#0a0420] text-white">{s}</option>)}
                        <option value={sub.name} disabled className="bg-[#0a0420] text-gray-500">--- Custom ---</option>
                    </select>
                    
                    {/* Hours Input - FIXED CONTRAST */}
                    <input
                        type="number"
                        placeholder="Hrs/Day"
                        value={sub.hours}
                        onChange={(e) => handleChange(i, "hours", e.target.value)}
                        className="w-20 bg-[#0a0420] text-center border border-purple-700/50 focus:border-[#A855F7] text-sm p-2 rounded-lg outline-none text-white placeholder-gray-400 hover:bg-[#0f062a] transition-colors"
                        min="0"
                        max="24"
                    />
                    
                    {/* Priority Select - FIXED CONTRAST */}
                    <select
                        value={sub.priority}
                        onChange={(e) => handleChange(i, "priority", e.target.value)}
                        className="w-24 bg-[#0a0420] border border-purple-700/50 focus:border-[#A855F7] text-sm p-2 rounded-lg outline-none text-white appearance-none hover:bg-[#0f062a] transition-colors"
                    >
                        <option value="3" className="bg-[#0a0420] text-green-400">🔥 High</option>
                        <option value="2" className="bg-[#0a0420] text-yellow-400">⚡ Medium</option>
                        <option value="1" className="bg-[#0a0420] text-blue-400">💧 Low</option>
                    </select>
                    
                    {/* Remove Button */}
                    <button 
                        onClick={() => removeSubject(sub.id)} 
                        className="text-red-400 hover:text-red-300 p-2 hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Remove subject"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                            <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.5H4.25a.75.75 0 0 0 0 1.5h.581l1.194 7.32a3 3 0 0 0 2.966 2.68h3.338a3 3 0 0 0 2.965-2.68l1.194-7.32h.581a.75.75 0 0 0 0-1.5H14v-.5A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4.25a1.25 1.25 0 1 1 2.5 0 1.25 1.25 0 0 1-2.5 0ZM6.75 6.25l-.426 6.81a1.5 1.5 0 0 0 1.48 1.34h3.338a1.5 1.5 0 0 0 1.48-1.34l-.426-6.81H6.75Z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            ))}

            <div className="flex gap-2">
                <button 
                    onClick={addSubject} 
                    className={neonButtonClass("flex-1 bg-purple-800 hover:bg-purple-700 text-white flex items-center justify-center gap-2")}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Add Subject
                </button>
                <button 
                    onClick={generateWeeklyTimetable} 
                    className={neonButtonClass("flex-1 bg-gradient-to-r from-[#A855F7] to-[#EC4899] hover:from-[#9333ea] hover:to-[#db2777] text-white flex items-center justify-center gap-2")}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                    </svg>
                    Generate Timetable
                </button>
            </div>

            {/* Stats Section - IMPROVED VISIBILITY */}
            <div className="text-sm text-[#cfc0f8] border-t border-purple-900/50 pt-3 space-y-1">
                <div className="flex justify-between">
                    <span>Requested Hours:</span>
                    <strong className={`${totalRequestedHours > maxPossibleDailyHours ? 'text-red-400' : 'text-green-400'}`}>
                        {totalRequestedHours} / day
                    </strong>
                </div>
                <div className="flex justify-between">
                    <span>Available Slots:</span>
                    <strong className="text-[#A855F7]">{maxPossibleDailyHours} / day</strong>
                </div>
                {totalRequestedHours > maxPossibleDailyHours && (
                    <div className="text-xs text-red-400 bg-red-900/20 p-2 rounded-lg mt-2">
                        ⚠️ You're requesting more hours than available slots! Some subjects may not fit.
                    </div>
                )}
            </div>
        </div>
    );
};