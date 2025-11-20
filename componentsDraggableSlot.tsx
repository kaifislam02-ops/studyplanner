// components/DraggableSlot.tsx
import React, { useEffect, useRef, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Subject, TimetableSlot } from "@/app/page";

// SVG Icons
const MosqueIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L4 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-8-5zm0 18c-4.52-1.29-7-5.81-7-10V8.3l7-4.2 7 4.2V10c0 4.19-2.48 8.71-7 10zm-1-6h2v2h-2v-2zm0-6h2v5h-2V8z"/>
  </svg>
);

const CheckIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const RotateIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
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
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: slot.hour });
  const isNamaz = slot.isNamaz;
  const isFree = slot.subject === "Free";

  const style = { 
    transform: CSS.Transform.toString(transform), 
    transition, 
    opacity: isDragging ? 0.7 : 1, 
    zIndex: isDragging ? 40 : 1,
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

  const validUserSubjects = subjects.map(s => s.name.trim()).filter(name => name !== "");
  const options = ["Free", ...COMMON_SUBJECTS, ...validUserSubjects];
  
  const baseColor = getColor(slot.subject, subjects);
  const darkBg = darkenColor(baseColor, 85);

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`relative w-full rounded-xl transition-all ${slot.isCompleted && !isNamaz && !isFree ? "opacity-60" : ""}`} 
      {...(!isNamaz ? attributes : {})}
    >
      <div 
        className={`rounded-xl p-4 h-full border transition-all ${
          isNamaz 
            ? "bg-cyan-900/20 border-cyan-500/30" 
            : isFree 
            ? "bg-white/[0.02] border-white/[0.04]" 
            : `border-white/[0.06]`
        }`}
        style={{ 
          backgroundColor: !isNamaz && !isFree ? darkBg : undefined,
          borderColor: !isNamaz && !isFree ? `${baseColor}40` : undefined
        }}
      >
        
        <div className="flex justify-between items-start mb-3">
          <div className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg ${
            isNamaz 
              ? "bg-cyan-500/20 text-cyan-300" 
              : "bg-white/10 text-white/90"
          }`}>
            {formatHour(slot.hour)}
          </div>

          {!isNamaz && !isFree && (
            <button 
              onClick={() => toggleCompletion(index)} 
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                slot.isCompleted 
                  ? "bg-green-500 text-white shadow-lg shadow-green-500/30" 
                  : "bg-white/10 text-white/90 hover:bg-white/20"
              }`} 
              title={slot.isCompleted ? "Mark incomplete" : "Mark completed"}
            >
              {slot.isCompleted ? <CheckIcon className="w-4 h-4" /> : <RotateIcon className="w-4 h-4" />}
            </button>
          )}
        </div>

        {isNamaz ? (
          <div className="text-center py-4">
            <MosqueIcon className="w-10 h-10 text-cyan-400 mx-auto mb-3" />
            <div className="font-semibold text-lg text-cyan-200">{slot.subject}</div>
            <div className="text-xs text-cyan-300/70 mt-1">Prayer Time</div>
          </div>
        ) : (
          <div ref={dropdownRef} className="relative">
            <button 
              type="button" 
              onClick={() => setOpen(o=>!o)} 
              className="w-full text-left px-3 py-2.5 rounded-lg transition hover:bg-white/5"
              style={{ 
                backgroundColor: isFree ? "rgba(255,255,255,0.02)" : `${baseColor}20`
              }}
            >
              <div className="flex justify-between items-center">
                <div className="truncate font-medium text-sm">
                    {slot.subject === "Free" ? "Available Slot" : slot.subject}
                </div>
                <ChevronDownIcon className={`w-4 h-4 text-white/60 transition-transform ml-2 flex-shrink-0 ${open ? "rotate-180" : ""}`} />
              </div>
            </button>
            {open && (
              <div className="absolute left-0 right-0 mt-2 dropdown-menu rounded-lg shadow-2xl max-h-48 overflow-y-auto z-50">
                {options.map(opt => (
                  <button 
                    key={opt} 
                    onClick={()=>{ updateSlotSubject(index, opt); setOpen(false); }} 
                    className={`w-full text-left px-3 py-2.5 text-sm hover:bg-white/5 transition ${
                      opt===slot.subject ? "bg-white/10 font-semibold" : ""
                    }`}
                  >
                    {opt === "Free" ? "Available Slot" : opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {!isNamaz && (
          <div 
            className="absolute bottom-3 right-3 text-white/30 cursor-grab hover:text-white/60 transition" 
            {...listeners}
          >
            <DragHandleIcon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
};

export default DraggableSlot;