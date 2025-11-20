import React, { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Subject, TimetableSlot } from '@/app/page';

// Simple Dropdown
const CleanDropdown: React.FC<{
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
}> = ({ value, onChange, options, placeholder = "Select..." }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={dropdownRef} className="relative w-full">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white/90 border border-gray-300 text-gray-900 px-3 py-2 rounded-lg
                   flex justify-between items-center shadow-sm hover:bg-gray-100"
      >
        <span className="truncate">{value || placeholder}</span>
        <svg className={`w-4 h-4 transition ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24">
          <path stroke="currentColor" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute w-full z-50 bg-white border border-gray-200 mt-1 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {options.map(opt => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setIsOpen(false); }}
              className={`w-full px-3 py-2 text-left text-gray-800 hover:bg-blue-50 
                ${value === opt ? 'bg-blue-50 font-medium' : ''}`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

interface Props {
  slot: TimetableSlot;
  index: number;
  subjects: Subject[];
  toggleCompletion: (i: number) => void;
  updateSlotSubject: (i: number, sub: string) => void;
  formatHour: (h: number) => string;
  getColor: (subject: string, subjects: Subject[]) => string;
  darkenColor: (c: string, p: number) => string;
  COMMON_SUBJECTS: string[];
}

export const DraggableSlot: React.FC<Props> = ({
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

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: slot.hour });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 20 : 1,
  };

  const isNamaz = slot.isNamaz;
  const item = slot.subject;

  const dropdownOptions = [
    "Free",
    ...COMMON_SUBJECTS,
    ...subjects.map(s => s.name).filter(Boolean)
  ];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="
        relative 
        rounded-xl border border-gray-300 
        p-4 
        bg-white/90 backdrop-blur-xl 
        shadow-md 
        h-[160px]         /* FIXED HEIGHT */
        flex flex-col justify-between
        hover:shadow-lg transition
      "
      {...(!isNamaz && { ...attributes, ...listeners })}
    >

      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <div className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
          {formatHour(slot.hour)}
        </div>

        {!isNamaz && item !== "Free" && (
          <button
            onClick={() => toggleCompletion(index)}
            className={`w-6 h-6 rounded-full border flex items-center justify-center
              ${slot.isCompleted
                ? "bg-green-500 border-green-500 text-white"
                : "border-gray-300 text-gray-400 hover:border-green-500"
              }
            `}
          >
            {slot.isCompleted && (
              <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                <path d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 011.4-1.4L8 12.6l7.3-7.3a1 1 0 011.4 0z" />
              </svg>
            )}
          </button>
        )}
      </div>

      {/* Content */}
      {isNamaz ? (
        <div className="text-center">
          <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center mx-auto mb-2">
            🕌
          </div>
          <div className="font-semibold text-blue-700">{item.split(" ")[1]}</div>
          <div className="text-xs text-blue-600">Prayer Time</div>
        </div>
      ) : (
        <CleanDropdown
          value={item}
          onChange={(v) => updateSlotSubject(index, v)}
          options={dropdownOptions}
        />
      )}

      {/* Drag Handle */}
      {!isNamaz && (
        <div
          className="absolute bottom-2 right-2 text-gray-400 cursor-grab"
          {...attributes} {...listeners}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeWidth="2" d="M4 8h16M4 16h16" />
          </svg>
        </div>
      )}
    </div>
  );
};
