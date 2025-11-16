import React, { useState, useRef, useEffect } from 'react';
import { Subject } from '@/app/page';

// Simple Dropdown for Subject Planner
const SubjectDropdown: React.FC<{
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
}> = ({ value, onChange, options, placeholder = "Select..." }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option: string) => {
    onChange(option);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative flex-1">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-[#0a0420] border border-purple-700/50 text-white text-sm p-2 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-[#9b6cf0] hover:bg-[#0f062a] transition-colors flex justify-between items-center"
      >
        <span className="truncate">{value || placeholder}</span>
        <svg 
          className={`w-4 h-4 text-purple-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-[#0a0420] border border-purple-700/50 rounded-lg shadow-lg max-h-40 overflow-y-auto">
          <button
            type="button"
            onClick={() => handleSelect("")}
            className="w-full px-3 py-2 text-left text-gray-400 hover:bg-purple-800/50 transition-colors"
          >
            {placeholder}
          </button>
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => handleSelect(option)}
              className={`w-full px-3 py-2 text-left text-white hover:bg-purple-800/50 transition-colors ${
                option === value ? 'bg-purple-700/50' : ''
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Priority Dropdown
const PriorityDropdown: React.FC<{
  value: string;
  onChange: (value: string) => void;
}> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const priorities = [
    { value: "3", label: "🔥 High", color: "text-green-400" },
    { value: "2", label: "⚡ Medium", color: "text-yellow-400" },
    { value: "1", label: "💧 Low", color: "text-blue-400" }
  ];

  const currentPriority = priorities.find(p => p.value === value) || priorities[0];

  const handleSelect = (priorityValue: string) => {
    onChange(priorityValue);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-24 bg-[#0a0420] border border-purple-700/50 text-white text-sm p-2 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-[#9b6cf0] hover:bg-[#0f062a] transition-colors flex justify-between items-center"
      >
        <span className={currentPriority.color}>{currentPriority.label.split(' ')[1]}</span>
        <svg 
          className={`w-4 h-4 text-purple-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-[#0a0420] border border-purple-700/50 rounded-lg shadow-lg">
          {priorities.map((priority) => (
            <button
              key={priority.value}
              type="button"
              onClick={() => handleSelect(priority.value)}
              className={`w-full px-3 py-2 text-left ${priority.color} hover:bg-purple-800/50 transition-colors ${
                priority.value === value ? 'bg-purple-700/50' : ''
              }`}
            >
              {priority.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

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
                    
                    {/* Name Dropdown */}
                    <SubjectDropdown
                        value={sub.name}
                        onChange={(value) => handleChange(i, "name", value)}
                        options={COMMON_SUBJECTS}
                        placeholder="Select Subject"
                    />
                    
                    {/* Hours Input */}
                    <input
                        type="number"
                        placeholder="Hrs"
                        value={sub.hours}
                        onChange={(e) => handleChange(i, "hours", e.target.value)}
                        className="w-16 bg-[#0a0420] text-center border border-purple-700/50 text-white text-sm p-2 rounded-lg outline-none placeholder-gray-400 hover:bg-[#0f062a] transition-colors"
                        min="0"
                        max="24"
                    />
                    
                    {/* Priority Dropdown */}
                    <PriorityDropdown
                        value={sub.priority}
                        onChange={(value) => handleChange(i, "priority", value)}
                    />
                    
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