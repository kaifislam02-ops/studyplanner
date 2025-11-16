import React, { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Subject, TimetableSlot } from '@/app/page';

// Simple Custom Dropdown
const CleanDropdown: React.FC<{
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
    <div ref={dropdownRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white border border-gray-200 text-gray-900 px-3 py-2 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-gray-50 transition-all flex justify-between items-center"
      >
        <span className="truncate font-medium">{value || placeholder}</span>
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

interface DraggableSlotProps {
    slot: TimetableSlot;
    index: number;
    subjects: Subject[];
    toggleCompletion: (i: number) => void;
    updateSlotSubject: (i: number, sub: string) => void;
    formatHour: (h: number) => string;
    getColor: (subject: string, subjects: Subject[]) => string;
    darkenColor: (color: string, percent: number) => string;
    COMMON_SUBJECTS: string[];
}

export const DraggableSlot: React.FC<DraggableSlotProps> = ({
    slot,
    index,
    subjects,
    toggleCompletion,
    updateSlotSubject,
    formatHour,
    getColor,
    darkenColor,
    COMMON_SUBJECTS,
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: slot.hour });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 10 : 1,
        cursor: slot.isNamaz ? 'default' : 'grab',
    };

    const item = slot.subject;
    const isNamaz = slot.isNamaz;
    const isFree = item === 'Free';
    const bg = getColor(item, subjects);

    // Prepare dropdown options
    const dropdownOptions = [
        'Free',
        ...COMMON_SUBJECTS,
        ...subjects.filter(s => s.name.trim() !== "").map(s => s.name)
    ];

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`bg-white rounded-xl border-2 p-4 transition-all hover:shadow-md ${
                isNamaz ? 'border-cyan-200 bg-cyan-50' : 
                isFree ? 'border-gray-200' : 
                'border-gray-200 hover:border-blue-200'
            } ${slot.isCompleted && !isNamaz && !isFree ? 'opacity-60' : ''}`}
            {...(!isNamaz && { ...attributes, ...listeners })}
        >
            {/* Header */}
            <div className="flex justify-between items-start mb-3">
                <div className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {formatHour(slot.hour)}
                </div>
                
                {!isNamaz && !isFree && (
                    <button
                        onClick={() => toggleCompletion(index)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                            slot.isCompleted 
                                ? 'bg-green-500 border-green-500 text-white' 
                                : 'bg-white border-gray-300 hover:border-green-500'
                        }`}
                        title={slot.isCompleted ? "Mark Incomplete" : "Mark Completed"}
                    >
                        {slot.isCompleted && (
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        )}
                    </button>
                )}
            </div>

            {/* Content */}
            {isNamaz ? (
                <div className="text-center">
                    <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="text-cyan-600 text-lg">🕌</span>
                    </div>
                    <div className="font-semibold text-cyan-700">{item.split(' ')[1]}</div>
                    <div className="text-xs text-cyan-600">Prayer Time</div>
                </div>
            ) : (
                <CleanDropdown
                    value={item}
                    onChange={(newValue) => updateSlotSubject(index, newValue)}
                    options={dropdownOptions}
                    placeholder="Free Time"
                />
            )}
            
            {/* Drag Handle */}
            {!isNamaz && (
                <div 
                    className="absolute bottom-2 right-2 text-gray-300 hover:text-gray-500 transition-colors cursor-grab active:cursor-grabbing"
                    title="Drag to reorder"
                    {...(!isNamaz && { ...attributes, ...listeners })}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                    </svg>
                </div>
            )}
        </div>
    );
};