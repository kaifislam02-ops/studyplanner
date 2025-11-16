import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Subject, TimetableSlot } from '@/app/page';
import { CustomDropdown } from './CustomDropdown'; // Add this import

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
    const darkBg = isNamaz ? "#0891b2" : isFree ? "#2b173d" : darkenColor(bg, 20);

    const slotStyles = isNamaz
        ? { background: `linear-gradient(145deg, ${bg} 0%, ${darkBg} 100%)`, border: "1px solid #0891b2" }
        : isFree
        ? { background: "rgba(14,6,32,0.45)", border: "1px solid #2b173d" }
        : { background: `linear-gradient(145deg, ${bg} 0%, ${darkBg} 100%)`, border: `1px solid ${darkBg}`, opacity: slot.isCompleted ? 0.7 : 1 };

    const slotClasses = "relative p-3 rounded-xl shadow-lg transition duration-200 hover:shadow-xl hover:scale-[1.01]";

    // Prepare dropdown options
    const dropdownOptions = [
        'Free',
        ...COMMON_SUBJECTS,
        ...subjects.filter(s => s.name.trim() !== "").map(s => s.name)
    ];

    return (
        <div
            ref={setNodeRef}
            style={{ ...slotStyles, ...style }}
            className={slotClasses}
            {...(!isNamaz && { ...attributes, ...listeners })}
        >
            {/* Completion Toggle */}
            {!isNamaz && !isFree && (
                <button
                    onClick={() => toggleCompletion(index)}
                    className={`absolute top-2 right-2 p-1 rounded-full completion-toggle transition-all ${
                        slot.isCompleted 
                            ? 'bg-green-500 text-white shadow-lg shadow-green-700/50' 
                            : 'bg-black/50 text-gray-400 hover:bg-black/70 hover:text-white'
                    }`}
                    title={slot.isCompleted ? "Mark Incomplete" : "Mark Completed"}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                </button>
            )}

            {/* Time Label */}
            <div className="text-xs text-[#cfc0f8] mb-1 font-mono font-bold tracking-wider">
                {formatHour(slot.hour)}
            </div>

            {isNamaz ? (
                <div className="p-2 rounded-lg text-center text-white font-extrabold text-lg bg-cyan-700/30 border border-cyan-500/30">
                    {item.split(' ')[1]}
                </div>
            ) : (
                <CustomDropdown
                    value={item}
                    onChange={(newValue) => updateSlotSubject(index, newValue)}
                    options={dropdownOptions}
                    placeholder="🕊️ Free Time"
                    className="w-full"
                />
            )}
            
            {/* Drag Handle Icon */}
            {!isNamaz && (
                <div 
                    className="absolute bottom-2 right-2 text-gray-400/60 hover:text-gray-300 transition-colors cursor-grab active:cursor-grabbing"
                    title="Drag to reorder"
                    {...(!isNamaz && { ...attributes, ...listeners })}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                    </svg>
                </div>
            )}

            {/* Completion Status Badge */}
            {!isNamaz && !isFree && slot.isCompleted && (
                <div className="absolute top-2 left-2">
                    <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Done
                    </div>
                </div>
            )}
        </div>
    );
};