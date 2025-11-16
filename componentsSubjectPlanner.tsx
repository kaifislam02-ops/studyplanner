import React, { useState, useRef, useEffect } from 'react';
import { Subject } from '@/app/page';

// Clean Dropdown Component
const CleanDropdown: React.FC<{
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  className?: string;
}> = ({ value, onChange, options, placeholder = "Select...", className = "" }) => {
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
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white border border-gray-200 text-gray-900 px-3 py-2 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-gray-50 transition-all flex justify-between items-center"
      >
        <span className="truncate">{value || placeholder}</span>
        <svg 
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          <button
            type="button"
            onClick={() => handleSelect("")}
            className="w-full px-3 py-2 text-left text-gray-500 hover:bg-gray-50 transition-all border-b border-gray-100"
          >
            {placeholder}
          </button>
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => handleSelect(option)}
              className={`w-full px-3 py-2 text-left text-gray-900 hover:bg-blue-50 transition-all border-b border-gray-100 last:border-b-0 ${
                option === value ? 'bg-blue-50 text-blue-600' : ''
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
    { value: "3", label: "High Priority", color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
    { value: "2", label: "Medium Priority", color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-200" },
    { value: "1", label: "Low Priority", color: "text-green-600", bg: "bg-green-50", border: "border-green-200" }
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
        className={`w-28 bg-white border ${currentPriority.border} text-gray-900 px-3 py-2 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-gray-50 transition-all flex justify-between items-center`}
      >
        <span className={`font-medium ${currentPriority.color}`}>
          {currentPriority.label.split(' ')[0]}
        </span>
        <svg 
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
          {priorities.map((priority) => (
            <button
              key={priority.value}
              type="button"
              onClick={() => handleSelect(priority.value)}
              className={`w-full px-3 py-2 text-left ${priority.color} hover:${priority.bg} transition-all border-b border-gray-100 last:border-b-0 ${
                priority.value === value ? priority.bg : ''
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
    COMMON_SUBJECTS
}) => {
    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold">📚</span>
                </div>
                <div>
                    <h3 className="font-semibold text-gray-900">Study Subjects</h3>
                    <p className="text-sm text-gray-500">Add subjects and set study hours</p>
                </div>
            </div>

            <div className="space-y-4">
                {subjects.map((sub, i) => (
                    <div key={sub.id} className="flex gap-3 items-center p-4 bg-gray-50 rounded-xl border border-gray-200">
                        {/* Subject Dropdown */}
                        <CleanDropdown
                            value={sub.name}
                            onChange={(value) => handleChange(i, "name", value)}
                            options={COMMON_SUBJECTS}
                            placeholder="Select subject"
                            className="flex-1"
                        />
                        
                        {/* Hours Input */}
                        <div className="relative">
                            <input
                                type="number"
                                placeholder="Hrs"
                                value={sub.hours}
                                onChange={(e) => handleChange(i, "hours", e.target.value)}
                                className="w-20 bg-white border border-gray-200 text-center text-gray-900 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                min="0"
                                max="24"
                            />
                            <div className="absolute inset-y-0 right-2 flex items-center text-gray-400 text-sm">
                                h
                            </div>
                        </div>
                        
                        {/* Priority Dropdown */}
                        <PriorityDropdown
                            value={sub.priority}
                            onChange={(value) => handleChange(i, "priority", value)}
                        />
                        
                        {/* Remove Button */}
                        <button 
                            onClick={() => removeSubject(sub.id)} 
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title="Remove subject"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                ))}
            </div>

            <div className="flex gap-3 mt-6">
                <button 
                    onClick={addSubject} 
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Subject
                </button>
                <button 
                    onClick={generateWeeklyTimetable} 
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Generate Schedule
                </button>
            </div>

            {/* Stats */}
            <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="font-semibold text-blue-600">{totalRequestedHours}h</div>
                        <div className="text-blue-500">Requested</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="font-semibold text-green-600">{maxPossibleDailyHours}h</div>
                        <div className="text-green-500">Available</div>
                    </div>
                </div>
                {totalRequestedHours > maxPossibleDailyHours && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center gap-2 text-red-700">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm font-medium">More hours requested than available slots</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};