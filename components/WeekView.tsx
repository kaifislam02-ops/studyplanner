import type { Task, Subject } from "@/app/page";

type Props = {
  tasks: Task[];
  subjects: Subject[];
  selectedDate: string;
  prayerTimes: { name: string; time: number }[];
  darkMode: boolean;
  onDateChange: (date: string) => void;
  onEditTask: (task: Task) => void;
};

export default function WeekView({ 
  tasks, 
  subjects, 
  selectedDate,
  prayerTimes,
  darkMode,
  onDateChange,
  onEditTask,
}: Props) {
  const getWeekDays = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    const day = date.getDay();
    const diff = date.getDate() - day;
    const sunday = new Date(date.setDate(diff));

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      return {
        date: d.toISOString().split('T')[0],
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: d.getDate(),
      };
    });
  };

  const weekDays = getWeekDays(selectedDate);

  const getTasksForDay = (date: string) => {
    return tasks.filter(task => task.date === date);
  };

  const getSubject = (subjectId: string) => {
    return subjects.find(s => s.id === subjectId);
  };

  const cardBg = darkMode ? 'bg-white/5' : 'bg-white';
  const borderClass = darkMode ? 'border-white/10' : 'border-gray-200';
  const textMuted = darkMode ? 'text-white/60' : 'text-gray-600';

  return (
    <div className="max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Weekly View</h2>
      
      <div className="grid grid-cols-7 gap-3">
        {weekDays.map(({ date, dayName, dayNum }) => {
          const dayTasks = getTasksForDay(date);
          const isToday = date === new Date().toISOString().split('T')[0];
          const isSelected = date === selectedDate;

          return (
            <div 
              key={date}
              className={`${cardBg} border ${borderClass} rounded-lg overflow-hidden ${
                isSelected ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              {/* Day Header */}
              <div 
                className={`p-3 border-b ${borderClass} ${
                  isToday ? 'bg-blue-500 text-white' : ''
                }`}
                onClick={() => onDateChange(date)}
              >
                <div className="text-xs font-semibold">{dayName}</div>
                <div className="text-2xl font-bold">{dayNum}</div>
              </div>

              {/* Tasks */}
              <div className="p-2 space-y-1 max-h-[500px] overflow-y-auto">
                {dayTasks.length === 0 ? (
                  <div className={`text-center text-xs ${textMuted} py-4`}>
                    No tasks
                  </div>
                ) : (
                  dayTasks.map(task => {
                    const subject = getSubject(task.subjectId);
                    return (
                      <button
                        key={task.id}
                        onClick={() => onEditTask(task)}
                        className={`w-full text-left p-2 rounded text-xs hover:opacity-80 ${
                          task.completed ? 'opacity-60 line-through' : ''
                        }`}
                        style={{
                          backgroundColor: subject ? `${subject.color}20` : '#ffffff10',
                          borderLeft: `3px solid ${subject?.color || '#666'}`,
                        }}
                      >
                        <div className="font-medium truncate">{task.title}</div>
                        <div className={textMuted}>
                          {task.startTime}:00 - {task.endTime}:00
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}