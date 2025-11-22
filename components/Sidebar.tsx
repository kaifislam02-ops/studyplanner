import { useState } from "react";
import type { Subject, Template } from "@/app/page";

type Props = {
  open: boolean;
  subjects: Subject[];
  stats: any;
  selectedDate: string;
  templates: Template[];
  darkMode: boolean;
  onDateChange: (date: string) => void;
  onAddSubject: (subject: Omit<Subject, "id">) => void;
  onDeleteSubject: (id: string) => void;
  onOpenTemplates: () => void;
  onOpenPomodoro: () => void;
};

const PRESET_COLORS = [
  "#3B82F6", "#8B5CF6", "#EC4899", "#10B981", "#F59E0B", 
  "#EF4444", "#06B6D4", "#6366F1", "#14B8A6"
];

export default function Sidebar({ 
  open, 
  subjects, 
  stats, 
  selectedDate,
  templates,
  darkMode,
  onDateChange,
  onAddSubject, 
  onDeleteSubject,
  onOpenTemplates,
  onOpenPomodoro,
}: Props) {
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubject, setNewSubject] = useState({ 
    name: "", 
    color: PRESET_COLORS[0], 
    weeklyHours: 5,
    priority: 3 
  });

  const handleAddSubject = () => {
    if (newSubject.name.trim()) {
      onAddSubject(newSubject);
      setNewSubject({ name: "", color: PRESET_COLORS[0], weeklyHours: 5, priority: 3 });
      setShowAddSubject(false);
    }
  };

  if (!open) return null;

  const bgClass = darkMode ? 'bg-[#0F1419]' : 'bg-white';
  const borderClass = darkMode ? 'border-white/5' : 'border-gray-200';
  const cardBg = darkMode ? 'bg-white/5' : 'bg-gray-100';
  const textMuted = darkMode ? 'text-white/60' : 'text-gray-600';

  return (
    <aside className={`w-[320px] ${bgClass} border-r ${borderClass} flex flex-col overflow-hidden`}>
      {/* Logo */}
      <div className={`p-6 border-b ${borderClass}`}>
        <h1 className="text-xl font-bold">📚 StudyFlow</h1>
        <p className={`text-xs ${textMuted} mt-1`}>Smart Study Planner</p>
      </div>

      {/* Stats */}
      <div className="p-4 space-y-3">
        <div className={`${cardBg} rounded-lg p-3`}>
          <div className={`text-xs ${textMuted} mb-1`}>Today's Progress</div>
          <div className="text-2xl font-bold">{stats.completionRate}%</div>
          <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
              style={{ width: `${stats.completionRate}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className={`${cardBg} rounded-lg p-3`}>
            <div className={`text-xs ${textMuted} mb-1`}>Hours</div>
            <div className="text-lg font-bold">{stats.weeklyHours}h</div>
          </div>
          <div className={`${cardBg} rounded-lg p-3`}>
            <div className={`text-xs ${textMuted} mb-1`}>Streak</div>
            <div className="text-lg font-bold">{stats.streak} 🔥</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className={`px-4 py-3 border-t ${borderClass} space-y-2`}>
        <button
          onClick={onOpenPomodoro}
          className={`w-full ${cardBg} hover:bg-white/10 rounded-lg px-3 py-2 text-sm font-medium text-left flex items-center gap-2`}
        >
          ⏱️ Pomodoro Timer
        </button>
        <button
          onClick={onOpenTemplates}
          className={`w-full ${cardBg} hover:bg-white/10 rounded-lg px-3 py-2 text-sm font-medium text-left flex items-center gap-2`}
        >
          📋 Templates ({templates.length})
        </button>
      </div>

      {/* Date Picker */}
      <div className={`px-4 py-3 border-t ${borderClass}`}>
        <div className={`text-xs font-semibold ${textMuted} mb-2`}>DATE</div>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => onDateChange(e.target.value)}
          className={`w-full ${cardBg} border ${darkMode ? 'border-white/10' : 'border-gray-300'} rounded-lg px-3 py-2 text-sm`}
        />
      </div>

      {/* Subjects */}
      <div className={`flex-1 overflow-y-auto px-4 py-3 border-t ${borderClass}`}>
        <div className="flex items-center justify-between mb-3">
          <div className={`text-xs font-semibold ${textMuted}`}>SUBJECTS ({subjects.length})</div>
          <button
            onClick={() => setShowAddSubject(true)}
            className="text-xs text-blue-400 hover:text-blue-300"
          >
            + Add
          </button>
        </div>

        <div className="space-y-2">
          {subjects.map(subject => (
            <div
              key={subject.id}
              className={`flex items-center gap-2 p-2 rounded-lg hover:${cardBg} group`}
            >
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: subject.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{subject.name}</div>
                <div className={`text-xs ${textMuted}`}>
                  {subject.weeklyHours}h/wk · Priority {subject.priority}
                </div>
              </div>
              <button
                onClick={() => onDeleteSubject(subject.id)}
                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 text-xs"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {/* Add Subject Form */}
        {showAddSubject && (
          <div className={`mt-3 p-3 ${cardBg} rounded-lg space-y-2`}>
            <input
              type="text"
              placeholder="Subject name"
              value={newSubject.name}
              onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
              className={`w-full ${darkMode ? 'bg-white/10 border-white/20' : 'bg-white border-gray-300'} border rounded px-2 py-1.5 text-sm`}
            />
            <div className="flex gap-1 flex-wrap">
              {PRESET_COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => setNewSubject({ ...newSubject, color })}
                  className={`w-6 h-6 rounded ${newSubject.color === color ? 'ring-2 ring-blue-500' : ''}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Hours/week"
                value={newSubject.weeklyHours}
                onChange={(e) => setNewSubject({ ...newSubject, weeklyHours: parseInt(e.target.value) || 0 })}
                className={`w-full ${darkMode ? 'bg-white/10 border-white/20' : 'bg-white border-gray-300'} border rounded px-2 py-1.5 text-sm`}
              />
              <select
                value={newSubject.priority}
                onChange={(e) => setNewSubject({ ...newSubject, priority: parseInt(e.target.value) })}
                className={`w-full ${darkMode ? 'bg-white/10 border-white/20' : 'bg-white border-gray-300'} border rounded px-2 py-1.5 text-sm`}
              >
                <option value={3}>High</option>
                <option value={2}>Medium</option>
                <option value={1}>Low</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddSubject}
                className="flex-1 bg-blue-500 hover:bg-blue-600 rounded px-3 py-1.5 text-xs font-medium text-white"
              >
                Add
              </button>
              <button
                onClick={() => setShowAddSubject(false)}
                className={`px-3 py-1.5 text-xs ${textMuted} hover:${darkMode ? 'text-white' : 'text-gray-900'}`}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}