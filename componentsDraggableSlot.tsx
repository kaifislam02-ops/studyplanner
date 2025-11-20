import React, { useState, useRef, useEffect } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Subject, TimetableSlot } from "@/app/page";

/* CLEAN DARK DROPDOWN */
const CleanDropdown = ({ value, onChange, options, placeholder = "Select..." }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const clickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", clickOutside);
    return () => document.removeEventListener("mousedown", clickOutside);
  }, []);

  return (
    <div ref={ref} className="relative w-full">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white/10 text-white px-3 py-2 rounded-lg flex justify-between items-center hover:bg-white/20 transition"
      >
        <span>{value || placeholder}</span>
        <svg
          className={`w-4 h-4 transition ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute w-full bg-[#0e1425] border border-white/10 rounded-lg mt-1 max-h-48 overflow-y-auto z-50">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => {
                onChange(opt);
                setIsOpen(false);
              }}
              className={`w-full px-3 py-2 text-left text-white hover:bg-white/10 ${
                value === opt ? "bg-white/10" : ""
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* DRAGGABLE SLOT */
export const DraggableSlot = ({
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
    opacity: isDragging ? 0.7 : 1,
    zIndex: isDragging ? 50 : 1,
  };

  const item = slot.subject;
  const isNamaz = slot.isNamaz;
  const isFree = item === "Free";

  const dropdownOptions = [
    "Free",
    ...COMMON_SUBJECTS,
    ...subjects.map((s) => s.name),
  ];

  return (
    <div ref={setNodeRef} style={style} className="relative mb-3">
      <div
        className={`rounded-xl p-4 border bg-[#0d1323]/50 border-white/10 ${
          slot.isCompleted ? "opacity-60" : ""
        }`}
        {...(!isNamaz && attributes)}
      >
        {/* Header */}
        <div className="flex justify-between mb-3">
          <div className="text-xs text-white/70 bg-white/10 px-2 py-1 rounded">
            {formatHour(slot.hour)}
          </div>

          {!isNamaz && !isFree && (
            <button
              onClick={() => toggleCompletion(index)}
              className="w-6 h-6 rounded-full flex items-center justify-center bg-white/10 text-white hover:bg-white/20"
            >
              {slot.isCompleted ? "✔" : ""}
            </button>
          )}
        </div>

        {/* Namaz Block */}
        {isNamaz ? (
          <div className="text-center text-cyan-300">
            <div className="text-2xl">🕌</div>
            {item}
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
            className="absolute bottom-3 right-3 text-white/40 cursor-grab"
            {...listeners}
          >
            ⋮⋮
          </div>
        )}
      </div>
    </div>
  );
};
