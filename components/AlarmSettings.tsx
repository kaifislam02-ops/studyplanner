import { useState, useEffect } from "react";
import { soundManager } from "@/lib/sounds";

type Alarm = {
  id: string;
  time: string; // HH:MM format
  title: string;
  enabled: boolean;
  repeat: boolean;
  days?: number[]; // 0-6 for Sun-Sat
};

type Props = {
  darkMode: boolean;
  onClose: () => void;
};

export default function AlarmSettings({ darkMode, onClose }: Props) {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAlarm, setNewAlarm] = useState({
    time: "08:00",
    title: "Study Session",
    enabled: true,
    repeat: false,
    days: [] as number[],
  });

  const bgClass = darkMode ? 'bg-[#0F1419]' : 'bg-white';
  const borderClass = darkMode ? 'border-white/10' : 'border-gray-200';
  const textMuted = darkMode ? 'text-white/60' : 'text-gray-600';
  const cardBg = darkMode ? 'bg-white/5' : 'bg-gray-100';

  useEffect(() => {
    // Load saved alarms
    const saved = localStorage.getItem('study-alarms');
    if (saved) {
      setAlarms(JSON.parse(saved));
    }

    // Check alarms every minute
    const interval = setInterval(checkAlarms, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Save alarms when changed
    localStorage.setItem('study-alarms', JSON.stringify(alarms));
  }, [alarms]);

  const checkAlarms = () => {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const currentDay = now.getDay();

    alarms.forEach(alarm => {
      if (!alarm.enabled) return;
      
      if (alarm.time === currentTime) {
        // Check if should ring today
        if (!alarm.repeat || (alarm.days && alarm.days.includes(currentDay))) {
          triggerAlarm(alarm);
        }
      }
    });
  };

  const triggerAlarm = (alarm: Alarm) => {
    soundManager.play('alarm');
    soundManager.notify(
      `⏰ ${alarm.title}`,
      `It's ${alarm.time} - Time to study!`,
      'alarm'
    );
  };

  const handleAddAlarm = () => {
    const alarm: Alarm = {
      id: Date.now().toString(),
      ...newAlarm,
    };
    setAlarms([...alarms, alarm]);
    setShowAddForm(false);
    setNewAlarm({
      time: "08:00",
      title: "Study Session",
      enabled: true,
      repeat: false,
      days: [],
    });
  };

  const toggleAlarm = (id: string) => {
    setAlarms(alarms.map(a => 
      a.id === id ? { ...a, enabled: !a.enabled } : a
    ));
  };

  const deleteAlarm = (id: string) => {
    setAlarms(alarms.filter(a => a.id !== id));
  };

  const toggleDay = (day: number) => {
    const days = newAlarm.days.includes(day)
      ? newAlarm.days.filter(d => d !== day)
      : [...newAlarm.days, day].sort();
    setNewAlarm({ ...newAlarm, days });
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className={`${bgClass} border ${borderClass} rounded-xl max-w-lg w-full shadow-2xl max-h-[90vh] flex flex-col`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${borderClass}`}>
          <div>
            <h3 className="text-xl font-bold">⏰ Study Alarms</h3>
            <p className={`text-sm ${textMuted} mt-1`}>Set reminders for study sessions</p>
          </div>
          <button
            onClick={onClose}
            className={`p-1 hover:${darkMode ? 'bg-white/10' : 'bg-gray-100'} rounded-lg transition-colors`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Alarms List */}
          {alarms.length === 0 ? (
            <div className="text-center py-12 text-white/40">
              <div className="text-4xl mb-3">⏰</div>
              <p>No alarms set</p>
              <p className="text-sm mt-1">Create your first study alarm below</p>
            </div>
          ) : (
            alarms.map(alarm => (
              <div key={alarm.id} className={`${cardBg} rounded-lg p-4`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl font-bold">{alarm.time}</div>
                      <div>
                        <div className="font-medium">{alarm.title}</div>
                        {alarm.repeat && alarm.days && alarm.days.length > 0 && (
                          <div className={`text-xs ${textMuted}`}>
                            {alarm.days.map(d => weekDays[d]).join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleAlarm(alarm.id)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${alarm.enabled ? 'bg-blue-500' : 'bg-gray-300'}`}
                    >
                      <div className={`absolute w-4 h-4 bg-white rounded-full top-1 transition-transform ${alarm.enabled ? 'translate-x-7' : 'translate-x-1'}`} />
                    </button>
                    
                    <button
                      onClick={() => deleteAlarm(alarm.id)}
                      className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Add Alarm Form */}
          {showAddForm ? (
            <div className={`${cardBg} rounded-lg p-4 space-y-4`}>
              <h4 className="font-semibold">New Alarm</h4>
              
              <div>
                <label className="block text-sm font-medium mb-2">Time</label>
                <input
                  type="time"
                  value={newAlarm.time}
                  onChange={(e) => setNewAlarm({ ...newAlarm, time: e.target.value })}
                  className={`w-full ${darkMode ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-gray-300'} border rounded-lg px-4 py-2`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  value={newAlarm.title}
                  onChange={(e) => setNewAlarm({ ...newAlarm, title: e.target.value })}
                  placeholder="Study Session"
                  className={`w-full ${darkMode ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-gray-300'} border rounded-lg px-4 py-2`}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="font-medium">Repeat</div>
                <button
                  onClick={() => setNewAlarm({ ...newAlarm, repeat: !newAlarm.repeat })}
                  className={`relative w-12 h-6 rounded-full transition-colors ${newAlarm.repeat ? 'bg-blue-500' : 'bg-gray-300'}`}
                >
                  <div className={`absolute w-4 h-4 bg-white rounded-full top-1 transition-transform ${newAlarm.repeat ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>

              {newAlarm.repeat && (
                <div>
                  <label className="block text-sm font-medium mb-2">Repeat on</label>
                  <div className="flex gap-2">
                    {weekDays.map((day, i) => (
                      <button
                        key={i}
                        onClick={() => toggleDay(i)}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                          newAlarm.days.includes(i)
                            ? 'bg-blue-500 text-white'
                            : darkMode ? 'bg-white/10 text-white/60' : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddForm(false)}
                  className={`flex-1 px-4 py-2 ${darkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-200 hover:bg-gray-300'} rounded-lg font-medium`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddAlarm}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium"
                >
                  Add Alarm
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add New Alarm
            </button>
          )}
        </div>
      </div>
    </div>
  );
}