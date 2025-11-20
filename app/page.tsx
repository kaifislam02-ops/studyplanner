// app/page.tsx
"use client";

import React, { useState, useMemo, useRef } from "react";
import DraggableSlot from "@/componentsDraggableSlot";
import SubjectPlanner from "@/componentsSubjectPlanner";
import StudyAnalyticsPanel from "@/componentsStudyAnalyticsPanel";

/* ---------------------------------- CONSTANTS ---------------------------------- */

const COMMON_SUBJECTS: string[] = [
  "Mathematics","Physics","Chemistry","Biology","English","Computer Science",
  "History","Geography","Political Science","Economics","Psychology","Sociology",
  "Hindi","Urdu","Physical Education","Art","Music","Philosophy","Environmental Science",
];

const WEEK_DAYS: string[] = [
  "Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"
];

const NAMAZ_SLOTS = [
  { name: "Fajr", time: 4 },
  { name: "Zuhr", time: 12 },
  { name: "Asr", time: 17 },
  { name: "Maghrib", time: 19 },
  { name: "Isha", time: 20 },
];

const DAY_HOURS = Array.from({ length: 20 }, (_, i) => i + 4);
const TOTAL_DAILY_STUDY_SLOTS = DAY_HOURS.length - NAMAZ_SLOTS.length;
const MAX_CONSECUTIVE_SLOTS = 3;

const COLORS = [
  "#6366F1","#EC4899","#8B5CF6","#10B981","#F59E0B","#EF4444","#06B6D4"
];

/* ---------------------------------- TYPES ---------------------------------- */

export type Subject = {
  id: string;
  name: string;
  hours: string;
  priority: string;
};

export type TimetableSlot = {
  subject: string;
  isNamaz: boolean;
  isCompleted: boolean;
  hour: number;
};

export type WeeklyTimetable = {
  [day: string]: TimetableSlot[];
};

/* ---------------------------------- UTILITIES ---------------------------------- */

const createId = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

const formatHour = (h: number): string => {
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour} ${ampm}`;
};

const getTodayName = () => {
  return new Date().toLocaleDateString("en-US", { weekday: "long" });
};

/* ---------------------------------- MAIN PAGE ---------------------------------- */

export default function HomePage() {
  // FIX: Start with empty subjects array - no pre-populated data
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const [weeklyTimetable, setWeeklyTimetable] = useState<WeeklyTimetable>({});
  const [selectedDay, setSelectedDay] = useState<string>(getTodayName());
  const [viewMode, setViewMode] = useState<"daily" | "weekly">("daily");
  const [timetableName, setTimetableName] = useState<string>("");

  const timetableRef = useRef<HTMLDivElement | null>(null);

  /* ----------------------------- COLOR UTILITIES ----------------------------- */

  const getColor = (subject: string, subs: Subject[]): string => {
    if (!subject || subject === "Free") return "#4b5563"; 
    if (subject.includes("Prayer")) return "#06b6d4";

    const idx = COMMON_SUBJECTS.indexOf(subject);
    if (idx >= 0) return COLORS[idx % COLORS.length];

    const customIdx = subs.findIndex((s) => s.name === subject);
    if (customIdx >= 0) return COLORS[customIdx % COLORS.length];

    return "#6B7280";
  };

  const darkenColor = (color: string, percent: number): string => {
    if (!color.startsWith("#")) return color;

    let [r, g, b] = (color.match(/\w\w/g) || []).map((h) => parseInt(h, 16));
    const p = 1 - percent / 100;

    r = Math.floor(r * p);
    g = Math.floor(g * p);
    b = Math.floor(b * p);

    return `#${((1 << 24) + (r << 16) + (g << 8) + b)
      .toString(16)
      .slice(1)}`;
  };

  /* ----------------------------- SUBJECT MANAGEMENT ----------------------------- */

  const addSubject = () => {
    setSubjects((prev) => [
      ...prev,
      { id: createId(), name: "", hours: "2", priority: "3" }, 
    ]);
  };

  const handleChange = (i: number, field: keyof Subject, value: string) => {
    setSubjects((prev) => {
      const copy = [...prev];
      if (field === "hours" && parseInt(value) < 0) return prev; 
      
      copy[i][field] = value;
      return copy;
    });
  };

  const removeSubject = (id: string) => {
    setSubjects((prev) => prev.filter((s) => s.id !== id));
  };

  const totalRequestedHours = subjects.reduce(
    (s, sub) => s + (parseInt(sub.hours || "0") || 0),
    0
  );

  const maxPossibleDailyHours = TOTAL_DAILY_STUDY_SLOTS;

  /* ------------------------------ GENERATE DAILY ------------------------------ */

  const generateDaily = (): TimetableSlot[] => {
    const grid: TimetableSlot[] = [];

    const valid = subjects
      .filter((s) => s.name.trim() && parseInt(s.hours || "0") > 0) 
      .sort(
        (a, b) => parseInt(b.priority || "0") - parseInt(a.priority || "0")
      );

    let queue: string[] = [];

    valid.forEach((s) => {
      const hrs = parseInt(s.hours || "0");
      for (let i = 0; i < hrs; i++) queue.push(s.name);
    });

    // Shuffle queue for variety
    for (let i = queue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [queue[i], queue[j]] = [queue[j], queue[i]];
    }

    let curr = "";
    let consec = 0;

    DAY_HOURS.forEach((h) => {
      const namaz = NAMAZ_SLOTS.find((n) => n.time === h);
      if (namaz) {
        grid.push({
          subject: `${namaz.name} Prayer`,
          isNamaz: true,
          isCompleted: false,
          hour: h,
        });
        curr = "";
        consec = 0;
        return;
      }

      let chosen = "Free";
      let found = false;

      for (let i = 0; i < queue.length; i++) {
        if (queue[i] === curr && consec >= MAX_CONSECUTIVE_SLOTS) continue;

        chosen = queue.splice(i, 1)[0];
        found = true;
        break;
      }

      if (!found) chosen = "Free";

      if (chosen === curr) consec++;
      else {
        curr = chosen;
        consec = chosen === "Free" ? 0 : 1;
      }

      grid.push({
        subject: chosen,
        isNamaz: false,
        isCompleted: false,
        hour: h,
      });
    });

    return grid;
  };

  /* ----------------------------- GENERATE WEEKLY ----------------------------- */

  const generateWeekly = () => {
    if (totalRequestedHours === 0) {
      alert("Please add subjects and set hours before generating a schedule.");
      return;
    }

    const maxWeeklyHours = maxPossibleDailyHours * 7;
    if (totalRequestedHours > maxWeeklyHours) {
        if (!window.confirm(`Your requested weekly hours (${totalRequestedHours}h) exceed the maximum possible study time in a week (${maxWeeklyHours}h). The generated schedule will not cover all requested hours. Continue?`)) {
            return;
        }
    }

    const week: WeeklyTimetable = {};

    WEEK_DAYS.forEach((d) => (week[d] = generateDaily()));

    setWeeklyTimetable(week);
    setViewMode("daily");
    setSelectedDay(getTodayName());
  };

  /* ----------------------------- TIMETABLE ACTIONS ----------------------------- */

  const toggleCompletion = (index: number) => {
    setWeeklyTimetable((prev) => {
      const day = prev[selectedDay] || [];
      const copy = [...day];

      if (!copy[index] || copy[index].isNamaz) return prev;

      copy[index] = {
        ...copy[index],
        isCompleted: !copy[index].isCompleted,
      };

      return { ...prev, [selectedDay]: copy };
    });
  };

  const updateSlotSubject = (index: number, subject: string) => {
    setWeeklyTimetable((prev) => {
      const day = prev[selectedDay] || [];
      const copy = [...day];

      if (!copy[index]) return prev;

      copy[index] = {
        ...copy[index],
        subject,
        isCompleted: subject === "Free" ? false : copy[index].isCompleted,
      };

      return { ...prev, [selectedDay]: copy };
    });
  };

  /* ----------------------------- ANALYTICS ----------------------------- */

  const {
    dailyCompletionRate,
    weeklyTotalStudyHours,
    weeklyTargetHours,
  } = useMemo(() => {
    const today = weeklyTimetable[getTodayName()] || [];

    let totalToday = 0,
      doneToday = 0;

    today.forEach((slot) => {
      if (!slot.isNamaz && slot.subject !== "Free") {
        totalToday++;
        if (slot.isCompleted) doneToday++;
      }
    });

    const rate = totalToday ? (doneToday / totalToday) * 100 : 0;

    let weeklyDone = 0;
    Object.values(weeklyTimetable).forEach((day) =>
      day.forEach((slot) => {
        if (
          !slot.isNamaz &&
          slot.subject !== "Free" &&
          slot.isCompleted
        )
          weeklyDone++;
      })
    );

    return {
      dailyCompletionRate: rate,
      weeklyTotalStudyHours: weeklyDone,
      weeklyTargetHours: totalRequestedHours,
    };
  }, [weeklyTimetable, totalRequestedHours]);

  /* -------------------------------- UI RENDER -------------------------------- */

  return (
    <div className="min-h-screen px-6 py-8 max-w-7xl mx-auto">
      
      {/* ------------------- HEADER ------------------- */}
      <header className="mb-6">
        <div className="glass-card flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl">
              📚
            </div>
            <div>
              <h1 className="text-2xl font-bold">StudyFlow</h1>
              <p className="text-sm text-white/70">
                Smart scheduling for focused learning
              </p>
            </div>
          </div>

          <button className="px-4 py-2 bg-white/6 rounded-lg text-white/80 hover:bg-white/10 transition">
            Sign In
          </button>
        </div>
      </header>

      {/* ------------------- MAIN GRID ------------------- */}

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT PANEL */}
        <section className="space-y-6">
          <SubjectPlanner
            subjects={subjects}
            addSubject={addSubject}
            handleChange={handleChange}
            removeSubject={removeSubject}
            generateWeeklyTimetable={generateWeekly}
            totalRequestedHours={totalRequestedHours}
            maxPossibleDailyHours={maxPossibleDailyHours}
            COMMON_SUBJECTS={COMMON_SUBJECTS}
          />

          <div className="glass-card">
            <p className="text-sm text-white/70 mb-3">Save & Export</p>
            <input
              value={timetableName}
              onChange={(e) => setTimetableName(e.target.value)}
              placeholder="Timetable name (e.g., Spring 2026)"
              className="w-full"
            />
            <div className="mt-3 flex gap-2">
              <button className="flex-1 bg-gradient-to-r from-green-500 to-blue-600 hover:opacity-90 transition rounded-lg px-4 py-2">
                Save
              </button>
              <button className="px-4 py-2 bg-white/6 hover:bg-white/10 transition rounded-lg">Export</button>
            </div>
          </div>
        </section>

        {/* RIGHT PANEL */}
        <section className="lg:col-span-2 space-y-6">

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="glass-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-pink-500 rounded-xl flex items-center justify-center text-2xl">⏱️</div>
                <div>
                  <h3 className="text-lg font-semibold">Focus Timer</h3>
                  <div className="text-sm text-white/70">Coming soon</div>
                </div>
              </div>
              <p className="text-white/60 text-sm">Pomodoro timer will help you stay focused during study sessions.</p>
            </div>

            <StudyAnalyticsPanel
              dailyCompletionRate={dailyCompletionRate}
              weeklyTotalStudyHours={weeklyTotalStudyHours}
              weeklyTargetHours={weeklyTargetHours}
            />
          </div>

          {/* TIMETABLE DISPLAY */}
          <div ref={timetableRef} className="glass-card">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-semibold">
                  {viewMode === "daily" ? "Daily Schedule" : "Weekly Schedule"}
                </h3>
                <p className="text-sm text-white/70">{selectedDay}</p>
              </div>

              <div className="flex gap-2">
                <select 
                  value={selectedDay} 
                  onChange={(e) => setSelectedDay(e.target.value)}
                  className="px-3 py-2 bg-white/6 rounded-lg text-white/80 hover:bg-white/10 transition"
                >
                  {WEEK_DAYS.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>
            </div>

            {!weeklyTimetable[selectedDay] ||
            weeklyTimetable[selectedDay].length === 0 ? (
              <div className="text-center py-16 text-white/60">
                <div className="text-4xl mb-4">📅</div>
                <p className="text-lg mb-2">No schedule generated yet</p>
                <p className="text-sm">Add subjects in the left panel and click "Generate Schedule"</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {weeklyTimetable[selectedDay].map((slot, idx) => (
                  <DraggableSlot
                    key={slot.hour}
                    slot={slot}
                    index={idx}
                    subjects={subjects}
                    COMMON_SUBJECTS={COMMON_SUBJECTS}
                    toggleCompletion={toggleCompletion}
                    updateSlotSubject={updateSlotSubject}
                    formatHour={formatHour}
                    getColor={getColor}
                    darkenColor={darkenColor}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="mt-8 text-center text-white/60 text-sm">
        Made with ❤️ • StudyFlow
      </footer>
    </div>
  );
}