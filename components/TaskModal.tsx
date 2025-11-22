import { useState, useEffect } from "react";
import type { Task, Subject } from "@/app/page";

type Props = {
  task: Task | null;
  subjects: Subject[];
  selectedDate: string;
  darkMode: boolean;
  onSave: (task: Omit<Task, "id">) => void;
  onClose: () => void;
};

export default function TaskModal({ task, subjects, selectedDate, darkMode, onSave, onClose }: Props) {
  const [formData, setFormData] = useState({
    title: task?.title || "",
    subjectId: task?.subjectId || (subjects[0]?.id || ""),
    date: task?.date || selectedDate,
    startTime: task?.startTime || 9,
    endTime: task?.endTime || 10,
    completed: task?.completed || false,
    notes: task?.notes || "",
    isRecurring: task?.isRecurring || false,
    recurringDays: task?.recurringDays || [],
  });

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    if (formData.startTime >= formData.endTime) {
      alert("End time must be after start time");
      return;
    }
    onSave(formData);
  };

  const hours = Array.from({ length: 19 }, (_, i) => i + 5);

  const formatHour = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:00 ${period}`;
  };

  const toggleRecurringDay = (day: number) => {
    const days = formData.recurringDays || [];
    if (days.includes(day)) {
      setFormData({ ...formData, recurringDays: days.filter(d => d !== day) });
    } else {
      setFormData({ ...formData, recurringDays: [...days, day].sort() });
    }
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const bgClass = darkMode ? 'bg-[#0F1419]' : 'bg-white';
  const borderClass = darkMode ? 'border-white/10' : 'border-gray-200';
  const textMuted = darkMode ? 'text-white/80' : 'text-gray-700';
  const inputBg = darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-300';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className={`${bgClass} border ${borderClass} rounded-xl max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${borderClass} sticky top-0 ${bgClass} z-10`}>
          <h3 className="text-lg font-bold">
            {task ? "Edit Task" : "Add New Task"}
          </h3>
          <button
            onClick={onClose}
            className={`p-1 hover:${darkMode ? 'bg-white/10' : 'bg-gray-100'} rounded-lg transition-colors`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Task Title */}
          <div>
            <label className={`block text-sm font-medium ${textMuted} mb-2`}>
              Task Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Calculus Practice"
              className={`w-full ${inputBg} border rounded-lg px-4 py-2.5 ${darkMode ? 'text-white placeholder-white/40' : 'text-gray-900'} focus:border-blue-500 focus:outline-none`}
              required
            />
          </div>

          {/* Subject */}
          <div>
            <label className={`block text-sm font-medium ${textMuted} mb-2`}>
              Subject *
            </label>
            <select
              value={formData.subjectId}
              onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
              className={`w-full ${inputBg} border rounded-lg px-4 py-2.5 ${darkMode ? 'text-white' : 'text-gray-900'} focus:border-blue-500 focus:outline-none`}
              required
            >
              {subjects.map(subject => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className={`block text-sm font-medium ${textMuted} mb-2`}>
              Date *
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className={`w-full ${inputBg} border rounded-lg px-4 py-2.5 ${darkMode ? 'text-white' : 'text-gray-900'} focus:border-blue-500 focus:outline-none`}
              required
            />
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-sm font-medium ${textMuted} mb-2`}>
                Start Time *
              </label>
              <select
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: parseInt(e.target.value) })}
                className={`w-full ${inputBg} border rounded-lg px-4 py-2.5 ${darkMode ? 'text-white' : 'text-gray-900'} focus:border-blue-500 focus:outline-none`}
              >
                {hours.map(hour => (
                  <option key={hour} value={hour}>
                    {formatHour(hour)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium ${textMuted} mb-2`}>
                End Time *
              </label>
              <select
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: parseInt(e.target.value) })}
                className={`w-full ${inputBg} border rounded-lg px-4 py-2.5 ${darkMode ? 'text-white' : 'text-gray-900'} focus:border-blue-500 focus:outline-none`}
              >
                {hours.filter(h => h > formData.startTime).map(hour => (
                  <option key={hour} value={hour}>
                    {formatHour(hour)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Recurring */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isRecurring}
                onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                className="w-4 h-4 accent-blue-500"
              />
              <span className={`text-sm font-medium ${textMuted}`}>Recurring Task</span>
            </label>

            {formData.isRecurring && (
              <div className="mt-3 flex gap-2">
                {weekDays.map((day, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleRecurringDay(i)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                      formData.recurringDays?.includes(i)
                        ? 'bg-blue-500 text-white'
                        : darkMode ? 'bg-white/10 text-white/60' : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className={`block text-sm font-medium ${textMuted} mb-2`}>
              Notes (optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any additional notes..."
              rows={3}
              className={`w-full ${inputBg} border rounded-lg px-4 py-2.5 ${darkMode ? 'text-white placeholder-white/40' : 'text-gray-900'} focus:border-blue-500 focus:outline-none resize-none`}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-4 py-2.5 ${darkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-200 hover:bg-gray-300'} rounded-lg font-medium transition-colors`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 rounded-lg font-medium transition-colors text-white"
            >
              {task ? "Save Changes" : "Add Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}