// components/SubjectPlanner.tsx
import React from "react";
import type { Subject } from "@/app/page";

// SVG Icons for better consistency
const TrashIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

type Props = {
  subjects: Subject[];
  addSubject: () => void;
  handleChange: (i:number, field: keyof Subject, value: string) => void;
  removeSubject: (id:string) => void;
  generateWeeklyTimetable: () => void;
  totalRequestedHours: number;
  maxPossibleDailyHours: number;
  COMMON_SUBJECTS: string[];
};

export const SubjectPlanner: React.FC<Props> = ({ subjects, addSubject, handleChange, removeSubject, generateWeeklyTimetable, totalRequestedHours, maxPossibleDailyHours, COMMON_SUBJECTS }) => {
  // Check if requested hours exceed the maximum available study slots for a week
  const maxWeeklyHours = maxPossibleDailyHours * 7; 
  const isOverBudget = totalRequestedHours > maxWeeklyHours;

  return (
    <div className="glass-card">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white">📚</div>
        <div>
          <h3 className="text-lg font-semibold">Study Subjects</h3>
          <div className="text-sm text-white/75">Add subjects and weekly hour goals</div>
        </div>
      </div>

      {/* Column Headers for Clarity (Fixing Ambiguity) */}
      <div className="flex gap-2 items-center text-xs font-semibold text-white/50 mb-2 px-1">
        <div className="flex-1">SUBJECT NAME</div>
        <div className="w-20 text-center">HRS/WEEK</div>
        <div className="w-32 text-center">PRIORITY</div>
        <div className="w-8"></div> {/* Placeholder for remove button */}
      </div>

      <div className="space-y-3">
        {subjects.map((s, i) => (
          <div key={s.id} className="flex gap-2 items-center">
            {/* Subject Name Input */}
            <input value={s.name} onChange={(e)=>handleChange(i,"name", e.target.value)} placeholder="Subject" className="flex-1" />
            
            {/* Hours Input */}
            <input value={s.hours} onChange={(e)=>handleChange(i,"hours", e.target.value)} type="number" min={0} placeholder="Hrs" className="w-20 text-center" />
            
            {/* Priority Select */}
            <select value={s.priority || "3"} onChange={(e)=>handleChange(i,"priority", e.target.value)} className="w-32">
              <option value="3">High</option>
              <option value="2">Medium</option>
              <option value="1">Low</option>
            </select>
            
            {/* Remove Button (Using SVG Icon) */}
            <button onClick={()=>removeSubject(s.id)} className="p-2 w-8 h-8 rounded-lg text-red-400 hover:bg-white/10 transition">
                <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-3 mt-4">
        <button onClick={addSubject} className="flex-1 text-white/80 hover:bg-white/10 transition">+ Add Subject</button>
        <button onClick={generateWeeklyTimetable} disabled={totalRequestedHours === 0} className={`flex-1 transition ${totalRequestedHours === 0 ? "bg-gray-700/50 cursor-not-allowed" : "bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90"}`}>
            Generate Schedule
        </button>
      </div>

      <div className="mt-4 pt-4 border-t border-white/6 text-sm">
        <div className="grid grid-cols-2 gap-3">
          <div className={`p-3 rounded transition ${isOverBudget ? "bg-red-900/40 border border-red-500" : "bg-white/4"}`}>
            Requested Weekly: <strong className={isOverBudget ? "text-red-300" : "text-white"}>{totalRequestedHours}h</strong>
            {isOverBudget && <div className="text-xs text-red-300 mt-1">Total weekly hours exceed max study slots!</div>}
          </div>
          <div className="p-3 bg-white/4 rounded">
            Max Daily Study Slots: <strong>{maxPossibleDailyHours}h</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubjectPlanner;