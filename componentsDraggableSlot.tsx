// components/DraggableSlot.tsx
import React, { useEffect, useRef, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Subject, TimetableSlot } from "@/app/page";

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
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.8 : 1, zIndex: isDragging ? 40 : 1 };

  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const options = ["Free", ...COMMON_SUBJECTS, ...subjects.filter(s=>s.name.trim()!=="").map(s=>s.name)];

  const isNamaz = slot.isNamaz;
  const isFree = slot.subject === "Free";

  return (
    <div ref={setNodeRef} style={style} className={`relative w-full rounded-xl p-3 transition-all ${slot.isCompleted && !isNamaz && !isFree ? "opacity-60" : ""}`} {...(!isNamaz ? attributes : {})}>
      <div className={`rounded-xl p-3 ${isNamaz ? "bg-[#062a30]/30 border border-cyan-600" : "bg-[#071025]/60 border border-white/6"}`}>
        <div className="flex justify-between items-start mb-3">
          <div className="text-xs font-medium text-white/80 bg-white/6 px-2 py-1 rounded">
            {formatHour(slot.hour)}
          </div>

          {!isNamaz && !isFree && (
            <button onClick={() => toggleCompletion(index)} {...listeners} className={`w-7 h-7 rounded-full flex items-center justify-center ${slot.isCompleted ? "bg-green-500 text-white" : "bg-white/6 text-white/90"}`} title={slot.isCompleted ? "Mark incomplete" : "Mark completed"}>
              {slot.isCompleted ? "✓" : "⟳"}
            </button>
          )}
        </div>

        {isNamaz ? (
          <div className="text-center">
            <div className="w-10 h-10 bg-cyan-900/20 rounded-full flex items-center justify-center mx-auto mb-2">🕌</div>
            <div className="font-semibold text-cyan-200">{slot.subject.replace("🔔 ","")}</div>
            <div className="text-xs text-cyan-300">Prayer time</div>
          </div>
        ) : (
          <div ref={dropdownRef} className="relative">
            <button type="button" onClick={() => setOpen(o=>!o)} className="w-full text-left px-3 py-2 rounded-lg clean-dropdown-btn">
              <div className="flex justify-between items-center">
                <div className="truncate">{slot.subject}</div>
                <div className="text-white/60">▾</div>
              </div>
            </button>
            {open && (
              <div className="absolute left-0 right-0 mt-2 dropdown-menu rounded shadow-lg max-h-48 overflow-y-auto z-50">
                {options.map(opt => (
                  <button key={opt} onClick={()=>{ updateSlotSubject(index, opt); setOpen(false); }} className={`w-full text-left px-3 py-2 hover:bg-[#071025] ${opt===slot.subject ? "bg-[#071025]" : ""}`}>
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {!isNamaz && <div className="absolute bottom-3 right-3 text-white/40 cursor-grab" {...listeners}><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16"></path></svg></div>}
      </div>
    </div>
  );
};

export default DraggableSlot;
