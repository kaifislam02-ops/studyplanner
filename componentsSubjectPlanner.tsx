import React from 'react';
import { Subject } from './app/page'; 

// CRITICAL FIX: The missing SubjectPlannerProps interface
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
                    {/* Name Input/Select */}
                    <select
                        value={sub.name}
                        onChange={(e) => handleChange(i, "name", e.target.value)}
                        // FIX: Force deep black background on select
                        className="flex-1 bg-[#030008] border-b border-purple-700/50 focus:border-[#A855F7] text-sm p-1 outline-none text-white appearance-none"
                    >
                        {/* FIX: Force deep black background and white text on options */}
                        <option value="" className="bg-[#030008] text-gray-400">Select Subject</option>
                        {COMMON_SUBJECTS.map(s => <option key={s} value={s} className="bg-[#030008] text-white">{s}</option>)}
                        <option value={sub.name} disabled className="bg-[#030008] text-gray-500">--- Custom ---</option>
                    </select>
                    
                    {/* Hours Input */}
                    <input
                        type="number"
                        placeholder="Hrs/Day"
                        value={sub.hours}
                        onChange={(e) => handleChange(i, "hours", e.target.value)}
                        // FIX: Force deep black background on input
                        className="w-16 bg-[#030008] text-center border-b border-purple-700/50 focus:border-[#A855F7] text-sm p-1 outline-none text-white placeholder-gray-400"
                        min="0"
                    />
                    
                    {/* Priority Select */}
                    <select
                        value={sub.priority}
                        onChange={(e) => handleChange(i, "priority", e.target.value)}
                        // FIX: Force deep black background on select
                        className="w-20 bg-[#030008] border-b border-purple-700/50 focus:border-[#A855F7] text-sm p-1 outline-none text-white appearance-none"
                    >
                        {/* FIX: Force deep black background and white text on options */}
                        <option value="3" className="bg-[#030008] text-white">High</option>
                        <option value="2" className="bg-[#030008] text-white">Medium</option>
                        <option value="1" className="bg-[#030008] text-white">Low</option>
                    </select>
                    
                    {/* Remove Button */}
                    <button onClick={() => removeSubject(sub.id)} className="text-red-400 hover:text-red-300 p-1">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                            <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.5H4.25a.75.75 0 0 0 0 1.5h.581l1.194 7.32a3 3 0 0 0 2.966 2.68h3.338a3 3 0 0 0 2.965-2.68l1.194-7.32h.581a.75.75 0 0 0 0-1.5H14v-.5A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4.25a1.25 1.25 0 1 1 2.5 0 1.25 1.25 0 0 1-2.5 0ZM6.75 6.25l-.426 6.81a1.5 1.5 0 0 0 1.48 1.34h3.338a1.5 1.5 0 0 0 1.48-1.34l-.426-6.81H6.75Z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            ))}

            <div className="flex gap-2">
                <button 
                    onClick={addSubject} 
                    className={neonButtonClass("flex-1 bg-gray-600 hover:bg-gray-700 text-white")}
                >
                    + Add Subject
                </button>
                <button 
                    onClick={generateWeeklyTimetable} 
                    className={neonButtonClass("flex-1 bg-[#A855F7] hover:bg-[#9333ea] text-white")}
                >
                    Generate Weekly Timetable
                </button>
            </div>

            <div className="text-xs text-[#cfc0f8] border-t border-purple-900/50 pt-3">
                <p>Requested Hours: <strong className="text-[#A855F7]">{totalRequestedHours}</strong> / day</p>
                <p>Available Slots: <strong className="text-[#A855F7]">{maxPossibleDailyHours}</strong> / day (After Namaz)</p>
            </div>
        </div>
    );
};