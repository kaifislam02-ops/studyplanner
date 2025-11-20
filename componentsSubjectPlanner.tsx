// components/SubjectPlanner.tsx
import React from "react";
import type { Subject } from "@/app/page";

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
  return (
    <div className="glass-card">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">📚</div>
        <div>
          <h3 className="text-lg font-semibold">Study Subjects</h3>
          <div className="text-sm text-white/75">Add subjects and hours</div>
        </div>
      </div>

      <div className="space-y-3">
        {subjects.map((s, i) => (
          <div key={s.id} className="flex gap-2 items-center">
            <input value={s.name} onChange={(e)=>handleChange(i,"name", e.target.value)} placeholder="Subject" className="flex-1" />
            <input value={s.hours} onChange={(e)=>handleChange(i,"hours", e.target.value)} type="number" min={0} placeholder="hrs" className="w-20" />
            <select value={s.priority || "3"} onChange={(e)=>handleChange(i,"priority", e.target.value)} className="w-32">
              <option value="3">High priority</option>
              <option value="2">Medium</option>
              <option value="1">Low</option>
            </select>
            <button onClick={()=>removeSubject(s.id)} className="p-2">🗑</button>
          </div>
        ))}
      </div>

      <div className="flex gap-3 mt-4">
        <button onClick={addSubject} className="flex-1">+ Add Subject</button>
        <button onClick={generateWeeklyTimetable} className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600">Generate</button>
      </div>

      <div className="mt-4 pt-4 border-t border-white/6 text-sm">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-white/4 rounded">Requested: <strong>{totalRequestedHours}h</strong></div>
          <div className="p-3 bg-white/4 rounded">Available: <strong>{maxPossibleDailyHours} slots</strong></div>
        </div>
      </div>
    </div>
  );
};

export default SubjectPlanner;
