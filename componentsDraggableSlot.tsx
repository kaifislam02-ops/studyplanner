import React, { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Subject, TimetableSlot } from '@/app/page';

// Simple Custom Dropdown (dark-friendly)
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
        className="w-full bg-white/6 text-white/95 px-3 py-2 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/40 hover:bg-white/8 transition-all flex justify-between items-center"
      >
        <span className="truncate font-medium">{value || placeholder}</span>
        <svg
          className={`w-4 h-4 text-white/70 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-[#0b1220] border border-white/6 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => handleSelect(option)}
              className={`w-full px-3 py-2 text-left text-white/90 hover:bg-[#0b1430] transition-all border-b border-white/6 last:border-b-0 ${
                option === value ? 'bg-[#071025] text-white' : ''
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
        opacity: isDragging ? 0.75 : 1,
        zIndex: isDragging ? 40 : 1,
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
            className={`relative w-full rounded-xl p-3 transition-all ${slot.isCompleted && !isNamaz && !isFree ? 'opacity-60' : ''}`}
            {...(!isNamaz && { ...attributes })}
        >
            <div className={`rounded-xl border ${isNamaz ? 'border-cyan-600 bg-[#052f33]/20' : isFree ? 'border-white/8 bg-transparent' : 'border-white/8 bg-[#071025]/50' } p-3`}>
                {/* Header */}
                <div className="flex justify-between items-start mb-3">
                    <div className="text-xs font-medium text-white/80 bg-white/6 px-2 py-1 rounded">
                        {formatHour(slot.hour)}
                    </div>

                    {!isNamaz && !isFree && (
                        <button
                            onClick={() => toggleCompletion(index)}
                            {...(!isNamaz && { ...listeners })}
                            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                                slot.isCompleted 
                                    ? 'bg-green-500 border-green-500 text-white' 
                                    : 'bg-white/6 border-white/10 text-white/90 hover:bg-white/10'
                            }`}
                            title={slot.isCompleted ? "Mark Incomplete" : "Mark Completed"}
                        >
                            {slot.isCompleted ? (
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </button>
                    )}
                </div>

                {/* Content */}
                {isNamaz ? (
                    <div className="text-center">
                        <div className="w-10 h-10 bg-cyan-900/20 rounded-full flex items-center justify-center mx-auto mb-2">
                            <span className="text-cyan-300 text-lg">🕌</span>
                        </div>
                        <div className="font-semibold text-cyan-200">{item.split(' ')[1]}</div>
                        <div className="text-xs text-cyan-300">Prayer Time</div>
                    </div>
                ) : (
                    <CleanDropdown
                        value={item}
                        onChange={(newValue) => updateSlotSubject(index, newValue)}
                        options={dropdownOptions}
                        placeholder="Free Time"
                    />
                )}

                {/* Drag Handle (small, subtle) */}
                {!isNamaz && (
                    <div
                        className="absolute bottom-3 right-3 text-white/50 hover:text-white/80 transition-colors cursor-grab active:cursor-grabbing"
                        title="Drag to reorder"
                        {...(!isNamaz && { ...listeners })}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                        </svg>
                    </div>
                )}
            </div>
        </div>
    );
};
