import React from 'react';
import { Subject } from './app/page'; 
// NEW IMPORT: Headless UI Listbox
import { Listbox } from '@headlessui/react';

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

// Helper list for priority mapping
const priorityOptions = [
    { name: 'High', value: '3' },
    { name: 'Medium', value: '2' },
    { name: 'Low', value: '1' },
];

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
                    
                    {/* 1. Subject Name Listbox */}
                    <Listbox 
                        value={sub.name} 
                        onChange={(value) => handleChange(i, "name", value)}
                    >
                        <div className="relative flex-1">
                            <Listbox.Button 
                                className="w-full text-left bg-[#030008] border-b border-purple-700/50 focus:border-[#A855F7] text-sm p-1 outline-none text-white appearance-none flex justify-between items-center"
                            >
                                {sub.name || 'Select Subject'}
                            </Listbox.Button>
                            <Listbox.Options className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md bg-[#030008] py-1 text-base shadow-lg ring-1 ring-white/20 focus:outline-none sm:text-sm">
                                <Listbox.Option value="" className={({ active }) => `relative cursor-default select-none py-2 pl-3 pr-4 text-gray-400 ${active ? 'bg-purple-700/50' : 'bg-[#030008]'}`}>
                                    Select Subject
                                </Listbox.Option>
                                {COMMON_SUBJECTS.map((s, idx) => (
                                    <Listbox.Option
                                        key={idx}
                                        value={s}
                                        className={({ active }) => `relative cursor-default select-none py-2 pl-3 pr-4 text-white ${active ? 'bg-purple-700/50' : 'bg-[#030008]'}`}
                                    >
                                        {s}
                                    </Listbox.Option>
                                ))}
                            </Listbox.Options>
                        </div>
                    </Listbox>
                    
                    {/* Hours Input (Standard Input) */}
                    <input
                        type="number"
                        placeholder="Hrs/Day"
                        value={sub.hours}
                        onChange={(e) => handleChange(i, "hours", e.target.value)}
                        // FIX: Force deep black background on input
                        className="w-16 bg-[#030008] text-center border-b border-purple-700/50 focus:border-[#A855F7] text-sm p-1 outline-none text-white placeholder-gray-400"
                        min="0"
                    />
                    
                    {/* 2. Priority Listbox */}
                    <Listbox 
                        value={sub.priority} 
                        onChange={(value) => handleChange(i, "priority", value)}
                    >
                        <div className="relative w-20">
                            <Listbox.Button 
                                className="w-full text-left bg-[#030008] border-b border-purple-700/50 focus:border-[#A855F7] text-sm p-1 outline-none text-white appearance-none flex justify-between items-center"
                            >
                                {priorityOptions.find(o => o.value === sub.priority)?.name}
                            </Listbox.Button>
                            <Listbox.Options className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md bg-[#030008] py-1 text-base shadow-lg ring-1 ring-white/20 focus:outline-none sm:text-sm">
                                {priorityOptions.map((option, idx) => (
                                    <Listbox.Option
                                        key={idx}
                                        value={option.value}
                                        className={({ active }) => `relative cursor-default select-none py-2 pl-3 pr-4 text-white ${active ? 'bg-purple-700/50' : 'bg-[#030008]'}`}
                                    >
                                        {option.name}
                                    </Listbox.Option>
                                ))}
                            </Listbox.Options>
                        </div>
                    </Listbox>

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