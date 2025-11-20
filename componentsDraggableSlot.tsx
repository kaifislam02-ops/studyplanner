// components/DraggableSlot.tsx
import React, { useEffect, useRef, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Subject, TimetableSlot } from "@/app/page";

// SVG Icons for better consistency (Replacing 🕌, ✓, ⟳, ▾, grab icon)
const MosqueIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-1 16H8a1 1 0 01-1-1v-4a1 1 0 011-1h3v6zm4-6h-3v6h3a1 1 0 011 1v4a1 1 0 01-1 1h-3V12zM12 4a8 8 0 00-6.103 3.064C6.67 7.026 8.5 7 8.5 7h7c.07 0 1.33-.026 2.603.064A8 8 0 0012 4z"/>
    <path fillRule="evenodd" d="M11 12a1 1 0 102 0 1 1 0 00-2 0z" clipRule="evenodd" />
  </svg>
);

const CheckIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const RotateIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.995 8.995 0 0120 13a9 9 0 01-3.6 7.5l-2.4-2.4m-.796 3.195l-.797.797M4 12a8.995 8.995 0 003.064 6.942l.583-.583m-1.996-3.996L3.9 14.7M5.795 7.195a9 9 0 011.897-3.21l1.547 1.547m.655-.655l.797-.797M4 12a9 9 0 0018 0" />
  </svg>
);

const ChevronDownIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const DragHandleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16"></path>
    </svg>
);


type Props = {
  slot: TimetableSlot;
  index: number;
  subjects: Subject[];
  COMMON_SUBJECTS: string[];
  toggleCompletion: (index: number) => void;
  updateSlotSubject: (index: number, subject: string) => void;
  formatHour: (h: number) => string;
  getColor: (subject: string, subjects: Subject[]) => string;
  darkenColor: (color: string, percent: number) => string;
};

export const DraggableSlot: React.FC<Props> = ({
  slot,
  index,
  subjects,
  COMMON_SUBJECTS,
  toggleCompletion,
  updateSlotSubject,
  formatHour,
  getColor,
  darkenColor,
}) => {
  // We use slot.hour as the ID for sorting
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: slot.hour });
  const isNamaz = slot.isNamaz;
  const isFree = slot.subject === "Free";

  const style = { 
    transform: CSS.Transform.toString(transform), 
    transition, 
    opacity: isDragging ? 0.7 : 1, 
    zIndex: isDragging ? 40 : 1,
    // Add background color based on subject
    border: isDragging ? "2px dashed #6366F1" : `1px solid ${isNamaz ? "#06b6d4" : "rgba(255,255,255,0.06)"}` 
  };

  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // Filter out empty subject names and include "Free" as the first option
  const validUserSubjects = subjects.map(s => s.name.trim()).filter(name => name !== "");
  const options = ["Free", ...COMMON_SUBJECTS, ...validUserSubjects];
  
  // Custom background for the inner div of the slot
  const slotBgColor = isNamaz 
    ? "bg-[#062a30]/30" 
    : isFree 
    ? "bg-[#071025]/60" 
    : `bg-[${darkenColor(getColor(slot.subject, subjects), 90)}]`; // Use a very dark version of the subject color

  return (
    // Apply styling to the outer div
    <div ref={setNodeRef} style={style} className={`relative w-full rounded-xl p-0 transition-all ${slot.isCompleted && !isNamaz && !isFree ? "opacity-60" : ""}`} {...(!isNamaz ? attributes : {})}>
      <div className={`rounded-xl p-3 h-full ${slotBgColor} ${isNamaz ? "border border-cyan-600/50" : "border border-transparent"}`}>
        
        <div className="flex justify-between items-start mb-3">
          {/* Time Display */}
          <div className={`text-xs font-medium text-white/80 px-2 py-1 rounded ${isNamaz ? "bg-cyan-800/50" : "bg-white/6"}`}>
            {formatHour(slot.hour)}
          </div>

          {/* Completion Toggle Button (Fixed icons) */}
          {!isNamaz && !isFree && (
            <button onClick={() => toggleCompletion(index)} {...listeners} className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${slot.isCompleted ? "bg-green-500 text-white" : "bg-white/10 text-white/90 hover:bg-white/20"}`} title={slot.isCompleted ? "Mark incomplete" : "Mark completed"}>
              {slot.isCompleted ? <CheckIcon className="w-4 h-4" /> : <RotateIcon className="w-4 h-4" />}
            </button>
          )}
        </div>

        {isNamaz ? (
          /* NAMAZ SLOT DISPLAY (Fixed icon and text) */
          <div className="text-center py-4">
            <MosqueIcon className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
            <div className="font-semibold text-cyan-200">{slot.subject.replace("🔔 ","")}</div>
            <div className="text-xs text-cyan-300/80">Prayer time</div>
          </div>
        ) : (
          /* STUDY SLOT DROPDOWN */
          <div ref={dropdownRef} className="relative">
            {/* Dropdown Button (Subject Name) */}
            <button type="button" onClick={() => setOpen(o=>!o)} className="w-full text-left px-3 py-2 rounded-lg transition hover:bg-white/10 clean-dropdown-btn" style={{ backgroundColor: isFree ? "rgba(255,255,255,0.03)" : darkenColor(getColor(slot.subject, subjects), 20) }}>
              <div className="flex justify-between items-center">
                <div className="truncate font-medium text-sm">
                    {/* Explicitly check for 'Free' and rename to 'Available Slot' for clarity */}
                    {slot.subject === "Free" ? "Available Slot" : slot.subject}
                </div>
                <ChevronDownIcon className={`w-4 h-4 text-white/60 transition-transform ${open ? "rotate-180" : ""}`} />
              </div>
            </button>
            {open && (
              /* Dropdown Menu */
              <div className="absolute left-0 right-0 mt-2 dropdown-menu rounded shadow-xl max-h-48 overflow-y-auto z-50 transform translate-y-0 opacity-100 transition-all duration-100">
                {options.map(opt => (
                  <button key={opt} onClick={()=>{ updateSlotSubject(index, opt); setOpen(false); }} className={`w-full text-left px-3 py-2 text-sm hover:bg-[#071025] transition ${opt===slot.subject ? "bg-[#071025] font-semibold" : ""}`}>
                    {opt === "Free" ? "Available Slot (Free)" : opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Drag Handle (Fixed icon and listeners) */}
        {!isNamaz && <div className="absolute bottom-3 right-3 text-white/40 cursor-grab hover:text-white/80 transition" {...listeners}><DragHandleIcon className="w-4 h-4" /></div>}
      </div>
    </div>
  );
};

export default DraggableSlot;