import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Subject, TimetableSlot } from './app/page'; 

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

    return (
        <div
            ref={setNodeRef}
            style={{ ...slotStyles, ...style }}
            className={slotClasses}
            {...(!isNamaz && { ...attributes, ...listeners })}
        >
            {!isNamaz && !isFree && (
                <button
                    onClick={() => toggleCompletion(index)}
                    className={`absolute top-2 right-2 p-1 rounded-full completion-toggle transition-all ${
                        slot.isCompleted 
                            ? 'bg-green-500 text-white shadow-lg shadow-green-700/50' 
                            : 'bg-black/50 text-gray-400 hover:bg-black/70'
                    }`}
                    title={slot.isCompleted ? "Mark Incomplete" : "Mark Completed"}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                </button>
            )}

            <div className="text-xs text-[#cfc0f8] mb-1 font-mono font-bold tracking-wider">
                {formatHour(slot.hour)}
            </div>

            {isNamaz ? (
                <div className="p-2 rounded-lg text-center text-white font-extrabold text-lg">
                    {item.split(' ')[1]}
                </div>
            ) : (
                <select
                    value={item}
                    onChange={(e) => updateSlotSubject(index, e.target.value)}
                    // FIX: Replaced 'bg-white/10' with solid 'bg-gray-900' for reliable darkness
                    className={`w-full ${isFree ? 'bg-[#080216] border border-[#2b173d]' : 'bg-gray-900 border border-white/20'} text-white px-3 py-2 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-[#9b6cf0] edit-select`}
                >
                    {/* FIX: Use deepest black background and explicitly set text-white on options */}
                    <option value="Free" className="bg-[#030008] text-white">Free</option> 
                    {COMMON_SUBJECTS.map(s => <option key={s} value={s} className="bg-[#030008] text-white">{s}</option>)}
                    {subjects.filter(s => s.name.trim() !== "").map(s => <option key={s.name} value={s.name} className="bg-[#030008] text-white">{s.name}</option>)}
                </select>
            )}
            
            {!isNamaz && (
                <div className="absolute bottom-1 right-2 text-gray-400/50 hover:text-gray-300 transition-colors" title="Drag to reorder">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                    </svg>
                </div>
            )}
        </div>
    );
};