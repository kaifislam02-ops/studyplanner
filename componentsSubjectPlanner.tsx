// components/SubjectPlanner.tsx
import React from "react";
import type { Subject } from "@/app/page";

const TrashIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const PlusIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const SparklesIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
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

export const SubjectPlanner: React.FC<Props> = ({ 
  subjects, 
  addSubject, 
  handleChange, 
  removeSubject, 
  generateWeeklyTimetable, 
  totalRequestedHours, 
  maxPossibleDailyHours, 
}) => {
  const maxWeeklyHours = maxPossibleDailyHours * 7; 
  const isOverBudget = totalRequestedHours > maxWeeklyHours;

  return (
    <div className="glass-card">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl">
          📚
        </div>
        <div>
          <h3 className="text-lg font-semibold">Study Subjects</h3>
          <div className="text-sm text-white/70">Plan your weekly study hours</div>
        </div>
      </div>

      {subjects.length > 0 && (
        <div className="grid grid-cols-12 gap-2 items-center text-xs font-semibold text-white/50 mb-2 px-1">
          <div className="col-span-5">SUBJECT</div>
          <div className="col-span-3 text-center">HRS/WK</div>
          <div className="col-span-3 text-center">PRIORITY</div>
          <div className="col-span-1"></div>
        </div>
      )}

      <div className="space-y-2.5 mb-4 min-h-[60px]">
        {subjects.length === 0 ? (
          <div className="text-center py-6 text-white/50 text-sm">
            <p>No subjects added yet</p>
            <p className="text-xs mt-1 text-white/40">Click "Add Subject" below</p>
          </div>
        ) : (
          subjects.map((s, i) => (
            <div key={s.id} className="grid grid-cols-12 gap-2 items-center">
              <input 
                value={s.name} 
                onChange={(e)=>handleChange(i,"name", e.target.value)} 
                placeholder="Subject name" 
                className="col-span-5 text-sm" 
              />
              
              <input 
                value={s.hours} 
                onChange={(e)=>handleChange(i,"hours", e.target.value)} 
                type="number" 
                min={1} 
                max={20}
                placeholder="5" 
                className="col-span-3 text-center text-sm" 
              />
              
              <select 
                value={s.priority || "3"} 
                onChange={(e)=>handleChange(i,"priority", e.target.value)} 
                className="col-span-3 text-sm"
              >
                <option value="3">High</option>
                <option value="2">Medium</option>
                <option value="1">Low</option>
              </select>
              
              <button 
                onClick={()=>removeSubject(s.id)} 
                className="col-span-1 p-2 h-9 rounded-lg text-red-400 hover:bg-red-500/10 transition flex items-center justify-center"
                title="Remove subject"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="flex gap-3">
        <button 
          onClick={addSubject} 
          className="flex-1 text-white/80 hover:bg-white/10 transition rounded-lg px-4 py-2.5 flex items-center justify-center gap-2 text-sm font-medium"
        >
          <PlusIcon className="w-4 h-4" />
          Add Subject
        </button>
        <button 
          onClick={generateWeeklyTimetable} 
          disabled={totalRequestedHours === 0} 
          className={`flex-1 transition rounded-lg px-4 py-2.5 flex items-center justify-center gap-2 text-sm font-medium ${
            totalRequestedHours === 0 
              ? "bg-gray-700/50 cursor-not-allowed text-white/40" 
              : "bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90 text-white shadow-lg"
          }`}
        >
          <SparklesIcon className="w-4 h-4" />
          Generate Schedule
        </button>
      </div>

      {subjects.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/6">
          <div className="grid grid-cols-2 gap-3">
            <div className={`p-3 rounded-lg transition ${
              isOverBudget 
                ? "bg-red-900/30 border border-red-500/50" 
                : "bg-white/5"
            }`}>
              <div className="text-xs text-white/60 mb-1">Weekly Total</div>
              <div className={`text-xl font-bold ${isOverBudget ? "text-red-300" : "text-white"}`}>
                {totalRequestedHours}h
              </div>
              {isOverBudget && (
                <div className="text-xs text-red-300 mt-1">⚠️ Exceeds limit!</div>
              )}
            </div>
            <div className="p-3 bg-white/5 rounded-lg">
              <div className="text-xs text-white/60 mb-1">Max Daily Slots</div>
              <div className="text-xl font-bold text-white">{maxPossibleDailyHours}h</div>
              <div className="text-xs text-white/40 mt-1">Per day available</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectPlanner;