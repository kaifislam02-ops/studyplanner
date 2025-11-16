"use client";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { db, auth, provider } from "../firebaseConfig";
import { signInWithPopup, signOut, User } from "firebase/auth";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

// --- Dnd Kit Imports ---
import {
  DndContext,
  closestCenter,
  useSensors,
  useSensor,
  PointerSensor,
  KeyboardSensor,
  DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';


// --- Component Imports (UPDATED: Using separate components now) ---
import { DraggableSlot } from "../componentsDraggableSlot"; 
import { SubjectPlanner } from "../componentsSubjectPlanner";
import { StudyAnalyticsPanel } from "../componentsStudyAnalyticsPanel"; 


// --- CONSTANTS ---
const COMMON_SUBJECTS = [
  "Mathematics","Physics","Chemistry","Biology","English","Computer Science",
  "History","Geography","Political Science","Economics","Psychology","Sociology",
  "Hindi","Urdu","Physical Education","Art","Music","Philosophy","Environmental Science",
];

const WEEK_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Namaz times
const NAMAZ_SLOTS = [
  { name: "Fajr", time: 4 },
  { name: "Zuhr", time: 12 },
  { name: "Asr", time: 17 },
  { name: "Maghrib", time: 19 },
  { name: "Isha", time: 20 },
];

// Hours of the day (4 AM to 11 PM) - 20 slots
const DAY_HOURS = Array.from({ length: 20 }, (_, i) => i + 4);

// The number of available slots per day for study (Total slots - Namaz slots)
const TOTAL_DAILY_STUDY_SLOTS = DAY_HOURS.length - NAMAZ_SLOTS.length; // 20 - 5 = 15

// NEW CONSTRAINT: Maximum consecutive slots for the same subject
const MAX_CONSECUTIVE_SLOTS = 3;

// Colors for subjects (used for small legend chips)
const COLORS = ["#A855F7","#EC4899","#8B5CF6","#7C3AED","#E879F9","#C084FC","#D946EF"];

// --- TYPES (Exported for use in other components) ---
export type Subject = { id: string; name: string; hours: string; priority: string };
export type TimetableSlot = { 
    subject: string; 
    isNamaz: boolean; 
    isCompleted: boolean; 
    hour: number;
};
export type WeeklyTimetable = { [key: string]: TimetableSlot[] };


// --- UTILITIES ---

// Utility for shuffling
const shuffleArray = (array: any[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

// Utility to generate unique ID
const createId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

// NEW UTILITY: Get today's day name (e.g., "Monday")
const getTodayName = () => {
    const d = new Date();
    return d.toLocaleDateString('en-US', { weekday: 'long' });
};

// Helper function to get color
const getColor = (subject: string, subjects: Subject[]) => {
    if (!subject || subject === "Free") return "#2d2d2d";
    if (subject.includes('🔔')) return "#06b6d4"; // Namaz color
    const idx = COMMON_SUBJECTS.indexOf(subject);
    if (idx >= 0) return COLORS[idx % COLORS.length];
    const customIdx = subjects.findIndex(s => s.name === subject);
    if (customIdx >= 0) return COLORS[customIdx % COLORS.length];
    return "#6B7280";
};

// Helper function to format hour
const formatHour = (h:number) => {
    const ampm = h >= 12 ? "PM" : "AM";
    const hour = h % 12 === 0 ? 12 : h % 12;
    return `${hour} ${ampm}`;
};

// Helper function to darken a hex color (for styling)
const darkenColor = (color: string, percent: number) => {
  if (!color || !color.startsWith("#")) return color;
  let [r, g, b] = (color.match(/\w\w/g) || []).map(h => parseInt(h, 16));
  const p = 1 - percent / 100;
  r = Math.floor(r * p);
  g = Math.floor(g * p);
  b = Math.floor(b * p);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).padStart(6, '0')}`;
};


// --- Pomodoro Timer Component ---
const PomodoroTimer = ({ neonButtonClass }: { neonButtonClass: (color: string) => string }) => {
    const WORK_TIME = 25 * 60; // 25 minutes
    const BREAK_TIME = 5 * 60; // 5 minutes
    const [time, setTime] = useState(WORK_TIME);
    const [isActive, setIsActive] = useState(false);
    const [isWork, setIsWork] = useState(true);

    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const toggle = () => setIsActive(!isActive);
    const reset = () => {
        setIsActive(false);
        setIsWork(true);
        setTime(WORK_TIME);
    };

    useEffect(() => {
        if (isActive && time > 0) {
            timerRef.current = setTimeout(() => setTime(t => t - 1), 1000);
        } else if (time === 0) {
            // Auto-switch
            const audio = new Audio('https://cdn.jsdelivr.net/gh/tahnik/tunes@latest/bell.mp3');
            audio.play().catch(e => console.log("Failed to play sound: ", e));
            
            setIsWork(!isWork);
            setTime(isWork ? BREAK_TIME : WORK_TIME);
        }
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [isActive, time, isWork]);

    const minutes = Math.floor(time / 60);
    const seconds = time % 60;

    return (
        <div className="bg-black/40 border border-purple-900/40 rounded-2xl p-5 shadow-2xl space-y-4">
            <h3 className="text-2xl font-extrabold text-[#e9ddfa] border-b border-purple-900/50 pb-3">🍅 Pomodoro Timer</h3>
            <div className="text-center">
                <p className={`text-sm font-semibold mb-2 ${isWork ? 'text-green-400' : 'text-pink-400'}`}>
                    {isWork ? "Focus Time" : "Break Time"}
                </p>
                <div className={`text-6xl font-mono font-bold tracking-wider ${isActive ? 'text-white' : 'text-gray-400'}`}>
                    {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </div>
            </div>
            <div className="flex gap-2">
                <button onClick={toggle} className={neonButtonClass(`flex-1 ${isActive ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white`)}>
                    {isActive ? "Pause" : "Start"}
                </button>
                <button onClick={reset} className={neonButtonClass("bg-gray-700 hover:bg-gray-600 text-white")}>
                    Reset
                </button>
            </div>
        </div>
    );
};


// --- Timetable Display Component ---
const TimetableDisplay = ({ weeklyTimetable, selectedDay, setSelectedDay, subjects, toggleCompletion, updateSlotSubject, setWeeklyTimetable, viewMode, setViewMode }: {
    weeklyTimetable: WeeklyTimetable,
    selectedDay: string,
    setSelectedDay: (day: string) => void,
    subjects: Subject[],
    toggleCompletion: (i: number) => void,
    updateSlotSubject: (i: number, sub: string) => void,
    setWeeklyTimetable: React.Dispatch<React.SetStateAction<WeeklyTimetable>>,
    viewMode: 'daily' | 'weekly',
    setViewMode: (mode: 'daily' | 'weekly') => void
}) => {
    const isWeekly = viewMode === 'weekly';
    const currentDaySchedule = weeklyTimetable[selectedDay] || [];
    
    // Dnd Kit Sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor),
    );

    const handleViewToggle = () => {
        const newMode = isWeekly ? 'daily' : 'weekly';
        setViewMode(newMode);
        if (newMode === 'daily') { 
            setSelectedDay(getTodayName());
        } else { 
            if (!WEEK_DAYS.includes(selectedDay)) {
                setSelectedDay('Monday');
            }
        }
    };
    
    // Core function to handle the end of a drag operation
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            setWeeklyTimetable((prev) => {
                const daySchedule = prev[selectedDay] || [];
                const oldIndex = daySchedule.findIndex(slot => slot.hour === active.id);
                const newIndex = daySchedule.findIndex(slot => slot.hour === over?.id);

                if (oldIndex === -1 || newIndex === -1) return prev;
                
                // IMPORTANT: Namaz slots are locked and shouldn't be swapped with other slots.
                if (daySchedule[oldIndex].isNamaz || daySchedule[newIndex].isNamaz) {
                    console.log("Cannot drag into or out of a Namaz slot.");
                    return prev;
                }

                const finalSchedule = arrayMove(daySchedule, oldIndex, newIndex);

                return {
                    ...prev,
                    [selectedDay]: finalSchedule,
                };
            });
        }
    }


    return (
        <div className="bg-black/40 border border-purple-900/40 rounded-2xl p-4 shadow-2xl">
            <div className="flex justify-between items-center mb-2 border-b border-purple-900/50 pb-3">
                <h3 className="text-2xl font-extrabold text-[#efe7ff]">
                    🗓️ {isWeekly ? "Weekly Schedule" : `Daily Focus`}
                </h3>
                {/* View Toggle Button */}
                <button
                    onClick={handleViewToggle}
                    className="px-3 py-1 text-xs rounded-full bg-purple-600 hover:bg-purple-700 text-white transition-colors day-selector"
                    title={isWeekly ? "Switch to current day view" : "Switch to full weekly planner"}
                >
                    {isWeekly ? "→ Daily Focus" : "← Weekly View"}
                </button>
            </div>
            
            <h4 className="text-xl font-bold mb-4 text-[#cfc0f8]">
                {selectedDay}
            </h4>

            {/* Day Selector Tabs (only shown in weekly view) */}
            {isWeekly && (
                <div className="flex flex-wrap gap-2 mb-4 day-selector border-b border-purple-900/50 pb-3 -mt-2">
                    {WEEK_DAYS.map(day => (
                        <button
                            key={day}
                            onClick={() => setSelectedDay(day)}
                            className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                                selectedDay === day
                                    ? 'bg-[#A855F7] text-white shadow-lg shadow-purple-900/50'
                                    : 'bg-black/40 text-[#cfc0f8] hover:bg-black/60'
                            }`}
                        >
                            {day}
                        </button>
                    ))}
                </div>
            )}


            <div className="w-full">
                {currentDaySchedule.length === 0 ? (
                  <div className="col-span-full text-center text-[#bfaaff] p-10 rounded-xl bg-[#0a0420]/40 border border-dashed border-[#2b173d]">
                    {isWeekly 
                        ? `No timetable for **${selectedDay}** yet — check other days or press **Generate Weekly Timetable**.`
                        : `No schedule found for today (**${selectedDay}**). Please load or generate a weekly timetable.`}
                  </div>
                ) : (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        {/* We use the hour property as the Dnd ID, which is unique per slot */}
                        <SortableContext 
                            items={currentDaySchedule.map(slot => slot.hour)} 
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                {currentDaySchedule.map((slot, i) => (
                                    <DraggableSlot
                                        key={slot.hour} // Use the hour as the key and Dnd ID
                                        slot={slot}
                                        index={i}
                                        subjects={subjects}
                                        toggleCompletion={toggleCompletion}
                                        updateSlotSubject={updateSlotSubject}
                                        formatHour={formatHour}
                                        getColor={getColor}
                                        darkenColor={darkenColor}
                                        COMMON_SUBJECTS={COMMON_SUBJECTS}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                )}
            </div>
          </div>

          {/* Quick legend / colors */}
          <div className="bg-black/40 border border-purple-900/40 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between shadow-lg">
            <div className="flex gap-3 flex-wrap">
              <span className="text-sm font-semibold text-[#efe7ff]">Key:</span>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full bg-[#06b6d4]" />
                <div className="text-[#efe7ff]">Namaz Slot</div>
              </div>
              {COMMON_SUBJECTS.slice(0,6).map((s,idx) => (
                <div key={s} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <div className="text-[#efe7ff]">{s}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="max-w-6xl mx-auto mt-8 text-center text-sm text-[#bfb0f7]">
        Made with ❤️ • StudyPlanner — Simple, Effective Time Management.
      </footer>
    </div>
  );
}