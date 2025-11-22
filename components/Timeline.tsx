import type { Task, Subject } from "@/app/page";

type Props = {
  tasks: Task[];
  subjects: Subject[];
  prayerTimes: { name: string; time: number }[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleComplete: (taskId: string) => void;
};

export default function Timeline({ 
  tasks, 
  subjects, 
  prayerTimes, 
  onEditTask, 
  onDeleteTask, 
  onToggleComplete 
}: Props) {
  const hours = Array.from({ length: 19 }, (_, i) => i + 5); // 5 AM to 11 PM

  const getSubject = (subjectId: string) => {
    return subjects.find(s => s.id === subjectId);
  };

  const getTasksForHour = (hour: number) => {
    return tasks.filter(task => task.startTime === hour);
  };

  const getPrayerForHour = (hour: number) => {
    return prayerTimes.find(p => p.time === hour);
  };

  const formatTime = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour} ${period}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-3">
      {hours.map(hour => {
        const hourTasks = getTasksForHour(hour);
        const prayer = getPrayerForHour(hour);

        return (
          <div key={hour} className="flex gap-4">
            {/* Time Label */}
            <div className="w-20 pt-1 text-sm font-semibold text-white/60 flex-shrink-0">
              {formatTime(hour)}
            </div>

            {/* Content */}
            <div className="flex-1">
              {prayer ? (
                // Prayer Time Card
                <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                      🕌
                    </div>
                    <div>
                      <div className="font-semibold text-cyan-300">{prayer.name}</div>
                      <div className="text-xs text-cyan-400/70">Prayer Time</div>
                    </div>
                  </div>
                </div>
              ) : hourTasks.length > 0 ? (
                // Task Cards
                <div className="space-y-2">
                  {hourTasks.map(task => {
                    const subject = getSubject(task.subjectId);
                    const duration = task.endTime - task.startTime;

                    return (
                      <div
                        key={task.id}
                        className={`border rounded-lg p-4 hover:border-white/20 transition-all group ${
                          task.completed ? 'opacity-60' : ''
                        }`}
                        style={{
                          backgroundColor: subject ? `${subject.color}15` : '#ffffff08',
                          borderColor: subject ? `${subject.color}40` : '#ffffff10',
                        }}
                      >
                        <div className="flex items-start gap-3">
                          {/* Checkbox */}
                          <button
                            onClick={() => onToggleComplete(task.id)}
                            className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                              task.completed
                                ? 'bg-green-500 text-white'
                                : 'bg-white/10 hover:bg-white/20'
                            }`}
                          >
                            {task.completed && (
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {subject && (
                                <div
                                  className="w-2 h-2 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: subject.color }}
                                />
                              )}
                              <span className={`font-semibold ${task.completed ? 'line-through' : ''}`}>
                                {task.title}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-white/60">
                              <span>{subject?.name}</span>
                              <span>•</span>
                              <span>{formatTime(task.startTime)} - {formatTime(task.endTime)}</span>
                              <span>•</span>
                              <span>{duration}h</span>
                            </div>
                            {task.notes && (
                              <div className="mt-2 text-sm text-white/70">{task.notes}</div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="opacity-0 group-hover:opacity-100 flex gap-1 flex-shrink-0">
                            <button
                              onClick={() => onEditTask(task)}
                              className="p-1.5 hover:bg-white/10 rounded text-blue-400"
                              title="Edit"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => onDeleteTask(task.id)}
                              className="p-1.5 hover:bg-white/10 rounded text-red-400"
                              title="Delete"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                // Empty Slot
                <div className="bg-white/[0.02] border border-white/5 rounded-lg p-4 text-center text-white/40 text-sm">
                  Free
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}