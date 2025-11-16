"use client";
import { useState, useEffect, useRef, useMemo } from "react";
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

// Predefined subjects
const COMMON_SUBJECTS = [
  "Mathematics","Physics","Chemistry","Biology","English","Computer Science",
  "History","Geography","Political Science","Economics","Psychology","Sociology",
  "Hindi","Urdu","Physical Education","Art","Music","Philosophy","Environmental Science",
];

// Namaz times
const NAMAZ_SLOTS = [
  { name: "Fajr", time: 4 },
  { name: "Zuhr", time: 12 },
  { name: "Asr", time: 17 },
  { name: "Maghrib", time: 19 },
  { name: "Isha", time: 20 },
];

// Hours of the day (4 AM to 11 PM)
const DAY_HOURS = Array.from({ length: 20 }, (_, i) => i + 4);

// Colors for subjects (used for small legend chips)
const COLORS = ["#A855F7","#EC4899","#8B5CF6","#7C3AED","#E879F9","#C084FC","#D946EF"];

// MODIFIED: Added priority field
type Subject = { name: string; hours: string; priority: string };

// --- Utility function for shuffling ---
const shuffleArray = (array: any[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

// --- Helper function to darken a hex color for gradients ---
const darkenColor = (color: string, percent: number) => {
  if (!color.startsWith("#")) return color;
  let [r, g, b] = (color.match(/\w\w/g) || []).map(h => parseInt(h, 16));
  const p = 1 - percent / 100;
  r = Math.floor(r * p);
  g = Math.floor(g * p);
  b = Math.floor(b * p);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).padStart(6, '0')}`;
};

// --- NEW COMPONENT: Pomodoro Timer ---
const PomodoroTimer = () => {
  const STUDY_TIME = 25 * 60; // 25 minutes
  const BREAK_TIME = 5 * 60;  // 5 minutes

  const [time, setTime] = useState(STUDY_TIME);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isStudyMode, setIsStudyMode] = useState(true); // true = Study, false = Break

  const minutes = Math.floor(time / 60).toString().padStart(2, '0');
  const seconds = (time % 60).toString().padStart(2, '0');
  const modeText = isStudyMode ? 'Study Mode' : 'Break Time';

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isTimerActive && time > 0) {
      interval = setInterval(() => {
        setTime(prevTime => prevTime - 1);
      }, 1000);
    } else if (time === 0) {
      // Time's up!
      setIsTimerActive(false);
      // Automatically switch mode
      setIsStudyMode(prevMode => !prevMode);
      setTime(isStudyMode ? BREAK_TIME : STUDY_TIME);
      alert(`Time for ${isStudyMode ? 'Break' : 'Study'}!`);
      // Optional: Play a sound
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerActive, time, isStudyMode]);

  const toggleTimer = () => setIsTimerActive(prev => !prev);
  
  const resetTimer = () => {
    setIsTimerActive(false);
    setTime(isStudyMode ? STUDY_TIME : BREAK_TIME);
  };

  const toggleMode = () => {
    setIsTimerActive(false);
    setIsStudyMode(prev => !prev);
    setTime(isStudyMode ? BREAK_TIME : STUDY_TIME);
  };

  const neonButtonClass = (color: string) =>
    `px-3 py-1.5 rounded-lg text-sm font-semibold transition btn-neon shadow-lg hover:shadow-2xl hover:scale-[.995] disabled:opacity-60 disabled:hover:scale-100 ${color}`;


  return (
    <div className="p-4 bg-[#0e0620]/70 rounded-xl border border-[#2b173d] text-center space-y-3 shadow-inner shadow-purple-900/10">
      <h3 className={`text-xl font-bold tracking-wider ${isStudyMode ? 'text-purple-400' : 'text-green-400'}`}>
        {modeText}
      </h3>
      <div className="text-6xl font-mono font-extrabold text-white bg-black/30 p-4 rounded-lg">
        {minutes}:{seconds}
      </div>
      <div className="flex justify-center gap-2">
        <button 
          onClick={toggleTimer} 
          className={neonButtonClass(isTimerActive ? "bg-yellow-600 hover:bg-yellow-700 text-black" : "bg-green-600 hover:bg-green-700 text-white")}
        >
          {isTimerActive ? 'Pause' : 'Start'}
        </button>
        <button 
          onClick={resetTimer} 
          className={neonButtonClass("bg-gray-600 hover:bg-gray-700 text-white")}
        >
          Reset
        </button>
        <button 
          onClick={toggleMode} 
          className={neonButtonClass("bg-indigo-600 hover:bg-indigo-700 text-white")}
        >
          {isStudyMode ? 'Break' : 'Study'}
        </button>
      </div>
    </div>
  );
};
// --- END: Pomodoro Timer ---

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  // MODIFIED: Added priority to initial state
  const [subjects, setSubjects] = useState<Subject[]>([{ name: "", hours: "", priority: "3" }]);
  const [timetable, setTimetable] = useState<string[]>([]);
  const [timetableName, setTimetableName] = useState("");
  const [savedTimetables, setSavedTimetables] = useState<{id:string,name:string}[]>([]);
  const [selectedTimetableId, setSelectedTimetableId] = useState<string>("");
  const [notes, setNotes] = useState(""); // NEW: Notes State
  const timetableRef = useRef<HTMLDivElement | null>(null);
  const [loadingSave, setLoadingSave] = useState(false);
  const [mounted, setMounted] = useState(false);


  // MODIFIED: Changed Subject type
  const handleChange = (i: number, field: keyof Subject, value: string) => {
    const newSubjects = [...subjects];
    newSubjects[i][field] = value;
    setSubjects(newSubjects);
  };

  const formatHour = (h:number) => {
    const ampm = h >= 12 ? "PM" : "AM";
    const hour = h % 12 === 0 ? 12 : h % 12;
    return `${hour} ${ampm}`;
  };

  const getColor = (subject: string) => {
    if (!subject || subject === "Free") return "#2d2d2d";
    const idx = COMMON_SUBJECTS.indexOf(subject);
    if (idx >= 0) return COLORS[idx % COLORS.length];
    const customIdx = subjects.findIndex(s => s.name === subject);
    if (customIdx >= 0) return COLORS[customIdx % COLORS.length];
    return "#6B7280";
  };

  // MODIFIED: Timetable generation logic now uses priority
  const generateTimetable = () => {
    const grid: string[] = [];
    let subjectQueue: string[] = [];
    
    // 1. Filter out empty subjects and sort by priority (descending: 5 first)
    const validSubjects = subjects
        .filter(s => s.name && s.hours && s.priority)
        .sort((a, b) => {
          const pA = parseInt(a.priority || "0");
          const pB = parseInt(b.priority || "0");
          return pB - pA; // Descending sort
        });

    // 2. Create the subject queue based on sorted priority
    validSubjects.forEach(s => {
      const hrs = parseInt(s.hours || "0");
      for (let i = 0; i < hrs; i++) subjectQueue.push(s.name);
    });

    // 3. Shuffle the entire queue for randomness while maintaining priority bias
    subjectQueue = shuffleArray(subjectQueue);

    DAY_HOURS.forEach(h => {
      const namaz = NAMAZ_SLOTS.find(n => n.time === h);
      if (namaz) grid.push(`🔔 ${namaz.name} (${formatHour(h)})`);
      else grid.push(subjectQueue.shift() || "Free");
    });

    setTimetable(grid);
  };
  
  // Save, Load, Delete functions are kept the same but will now handle the 'priority' field in Firestore.

  // Export PDF function is unchanged.
  
  // UseEffect and auth functions are unchanged.

  useEffect(() => {
    if (auth.currentUser) {
      setUser(auth.currentUser);
      loadAllTimetables(auth.currentUser.uid);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  const neonButtonClass = (color: string) =>
    `px-4 py-2 rounded-xl text-sm font-semibold transition btn-neon shadow-lg hover:shadow-2xl hover:scale-[.995] disabled:opacity-60 disabled:hover:scale-100 ${color}`;


  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b0211] via-[#0f0420] to-[#140426] text-slate-100 p-6">
      <header className="max-w-6xl mx-auto mb-6">
        {/* Navbar component (Sign In/Out) */}
        <nav className="flex items-center justify-between bg-black/40 backdrop-blur-md rounded-2xl p-3 border border-purple-900/40 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-[#6D28D9] to-[#C026D3] rounded-xl flex items-center justify-center text-white font-bold shadow-md">
              SP
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-wide">StudyPlanner</h1>
              <p className="text-xs text-[#d6c5f0]">Purple Galaxy — neon study vibes</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="text-sm text-[#e7defb] hidden sm:inline">Signed in as <strong className="ml-1">{user.displayName}</strong></span>
                <button onClick={logout} className="px-3 py-1 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-sm transition-shadow shadow-sm">Sign Out</button>
              </>
            ) : (
              <button onClick={login} className={neonButtonClass("bg-gradient-to-r from-[#8B5CF6] to-[#C084FC] text-white")}>
                Sign in with Google
              </button>
            )}
          </div>
        </nav>
      </header>

      <main className={`max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {/* LEFT: Controls */}
        <section className="lg:col-span-1 bg-black/40 border border-purple-900/40 rounded-2xl p-5 space-y-5 shadow-2xl">
          <h2 className="text-2xl font-extrabold text-[#e9ddfa] border-b border-purple-900/50 pb-3">📚 Plan Your Subjects</h2>
          
          {/* Subjects list */}
          <div className="space-y-3">
            {subjects.map((s, i) => (
              <div key={i} className="flex gap-2 items-center rounded-lg p-2 bg-[#0e0620]/70 border border-[#2b173d]">
                <input
                  type="text"
                  placeholder="Subject Name"
                  value={s.name}
                  onChange={(e) => handleChange(i, "name", e.target.value)}
                  className="flex-1 bg-transparent px-2 py-1 text-sm text-[#efe7ff] placeholder:text-[#b9a9d9] focus:outline-none focus:ring-0"
                />
                <input
                  type="number"
                  placeholder="Hrs"
                  min={0}
                  value={s.hours}
                  onChange={(e) => handleChange(i, "hours", e.target.value)}
                  className="w-16 bg-transparent py-1 text-sm text-center text-[#efe7ff] focus:outline-none focus:ring-0 border-l border-purple-900/50"
                />
                {/* NEW: Priority Input (1-5) */}
                <input
                  type="number"
                  placeholder="Prio (1-5)"
                  min={1}
                  max={5}
                  value={s.priority}
                  onChange={(e) => handleChange(i, "priority", e.target.value)}
                  className="w-20 bg-transparent py-1 text-sm text-center text-yellow-300 placeholder:text-yellow-600 focus:outline-none focus:ring-0 border-l border-purple-900/50"
                  title="Priority: 5 is highest, 1 is lowest. Influences scheduling order."
                />
                <button
                  onClick={() => setSubjects(prev => prev.filter((_, idx) => idx !== i))}
                  className="p-1.5 rounded-full text-red-400 hover:text-red-300 bg-red-900/50 hover:bg-red-800/70 transition-all"
                  title="Remove subject"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button onClick={addSubject} className={neonButtonClass("flex-1 bg-gradient-to-r from-[#A855F7] to-[#EC4899] text-white")}>+ Add Subject</button>
            <button onClick={generateTimetable} className={neonButtonClass("bg-green-500 hover:bg-green-600 text-white")}>Generate Timetable</button>
          </div>

          {/* Save / load */}
          <div className="pt-5 border-t border-purple-900/50 space-y-3">
            {/* ... Save/Load UI (Unchanged) ... */}
            <input
              type="text"
              placeholder="Timetable name (required to save)"
              value={timetableName}
              onChange={(e) => setTimetableName(e.target.value)}
              className="w-full bg-[#0e0620] border border-[#2b173d] px-3 py-2 rounded-lg text-sm text-[#efe7ff] focus:outline-none focus:ring-2 focus:ring-[#9b6cf0]"
            />

            <div className="flex gap-2">
              <button
                onClick={saveTimetable}
                className={neonButtonClass("flex-1 bg-gradient-to-r from-[#7c3aed] to-[#a855f7] text-white")}
                disabled={loadingSave}
              >
                {selectedTimetableId ? "Update" : "Save New"}
              </button>

              <button onClick={exportToPDF} className={neonButtonClass("bg-yellow-500 hover:bg-yellow-600 text-black")}>Export PDF</button>
            </div>

            {user && (
              <div className="mt-2">
                <label className="text-sm text-[#d3c6ef] block mb-1">Load or Delete Saved Timetables</label>
                <div className="flex gap-2 mt-1">
                  <select
                    value={selectedTimetableId}
                    onChange={(e) => { if (e.target.value) loadTimetable(e.target.value); }}
                    className="flex-1 bg-[#0e0620] border border-[#2b173d] px-3 py-2 rounded-lg text-sm text-[#efe7ff]"
                  >
                    <option value="">-- Load saved timetable --</option>
                    {savedTimetables.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                  {selectedTimetableId && (
                    <button onClick={() => deleteTimetable(selectedTimetableId)} className="px-3 py-2 rounded-lg bg-[#ef4444] hover:bg-[#dc2626] text-white">Delete</button>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* NEW: Notes Section */}
          <div className="pt-5 border-t border-purple-900/50 space-y-3">
            <h3 className="text-xl font-extrabold text-[#e9ddfa]">📝 Quick Notes</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Write down today's goals or quick thoughts here..."
              rows={4}
              className="w-full bg-[#0e0620] border border-[#2b173d] px-3 py-2 rounded-lg text-sm text-[#efe7ff] placeholder:text-[#b9a9d9] focus:outline-none focus:ring-2 focus:ring-[#9b6cf0]"
            />
            <p className="text-xs text-[#d3c6ef]/70">Note: For now, these notes are local (not saved to Firebase).</p>
          </div>

          <div className="pt-3 border-t border-black/30 text-xs text-[#d3c6ef] space-y-1">
            <p className="font-bold">Tips:</p>
            <ul className="list-disc ml-4">
              <li>Timetables are now generated with a **priority bias** (5 is high).</li>
              <li>Namaz slots are protected and cannot be edited.</li>
            </ul>
          </div>
        </section>

        {/* MIDDLE/RIGHT: Pomodoro and Timetable */}
        <section className="lg:col-span-2 space-y-6">
          {/* NEW: Pomodoro Timer */}
          <PomodoroTimer />

          {/* Timetable Display */}
          <div className="bg-black/40 border border-purple-900/40 rounded-2xl p-4 shadow-2xl">
            <h3 className="text-2xl font-extrabold mb-5 text-[#efe7ff]">🗓️ Your Daily Schedule</h3>

            <div ref={timetableRef} className="w-full">
              {/* ... Timetable Grid (Unchanged) ... */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {timetable.length === 0 ? (
                  <div className="col-span-full text-center text-[#bfaaff] p-10 rounded-xl bg-[#0a0420]/40 border border-dashed border-[#2b173d]">
                    No timetable yet — add subjects and press <strong className="text-green-400 animate-pulse">Generate Timetable</strong>.
                  </div>
                ) : timetable.map((item, i) => {
                  const isNamaz = NAMAZ_SLOTS.some(n => item.includes(n.name));
                  const isFree = item === 'Free';
                  const bg = isNamaz ? "#06b6d4" : getColor(item);
                  const darkBg = isNamaz ? "#0891b2" : isFree ? "#2b173d" : darkenColor(bg, 20);

                  const slotStyles = isNamaz 
                    ? { background: `linear-gradient(145deg, ${bg} 0%, ${darkBg} 100%)`, border: "1px solid #0891b2" } 
                    : isFree
                    ? { background: "rgba(14,6,32,0.45)", border: "1px solid #2b173d" }
                    : { background: `linear-gradient(145deg, ${bg} 0%, ${darkBg} 100%)`, border: `1px solid ${darkBg}` };
                    
                  const slotClasses = "relative p-3 rounded-xl shadow-lg transition duration-200 hover:shadow-xl hover:scale-[1.01]";
                  
                  return (
                    <div
                      key={i}
                      className={slotClasses}
                      style={slotStyles}
                    >
                      <div className="text-xs text-[#cfc0f8] mb-1 font-mono font-bold tracking-wider">
                        {DAY_HOURS[i] !== undefined ? formatHour(DAY_HOURS[i]) : ""}
                      </div>

                      {isNamaz ? (
                        <div className="p-2 rounded-lg text-center text-white font-extrabold text-lg">
                          {item.split(' ')[1]}
                        </div>
                      ) : (
                        <select
                          value={item}
                          onChange={(e) => {
                            const newTT = [...timetable];
                            newTT[i] = e.target.value;
                            setTimetable(newTT);
                          }}
                          className={`w-full ${isFree ? 'bg-[#080216] border border-[#2b173d]' : 'bg-white/10 border border-white/20'} text-[#efe7ff] px-3 py-2 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-[#9b6cf0]`}
                        >
                          <option value="Free" className="bg-[#080216]">Free</option>
                          {COMMON_SUBJECTS.map(s => <option key={s} value={s} className="bg-[#080216]">{s}</option>)}
                          {subjects.filter(s => s.name.trim() !== "").map(s => <option key={s.name} value={s.name} className="bg-[#080216]">{s.name}</option>)}
                        </select>
                      )}
                      
                    </div>
                  );
                })}
              </div>
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

      <footer className="max-w-6xl mx-auto mt-8 text-center text-sm text-[#bfb0f7]">
        Made with ❤️ • StudyPlanner — Purple Galaxy
      </footer>
    </div>
  );
}