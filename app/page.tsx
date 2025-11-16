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

// Colors for subjects (used for small legend chips)
const COLORS = ["#A855F7","#EC4899","#8B5CF6","#7C3AED","#E879F9","#C084FC","#D946EF"];

// --- TYPES ---
type Subject = { id: string; name: string; hours: string; priority: string };
type TimetableSlot = { 
    subject: string; 
    isNamaz: boolean; 
    isCompleted: boolean; 
    hour: number;
};
type WeeklyTimetable = { [key: string]: TimetableSlot[] };


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


// --- Timetable Display Component (NEW/REFACTORED) ---
const TimetableDisplay = ({ weeklyTimetable, selectedDay, setSelectedDay, subjects, toggleCompletion, updateSlotSubject, viewMode, setViewMode }: {
    weeklyTimetable: WeeklyTimetable,
    selectedDay: string,
    setSelectedDay: (day: string) => void,
    subjects: Subject[],
    toggleCompletion: (i: number) => void,
    updateSlotSubject: (i: number, sub: string) => void,
    viewMode: 'daily' | 'weekly',
    setViewMode: (mode: 'daily' | 'weekly') => void
}) => {
    const isWeekly = viewMode === 'weekly';
    const currentDaySchedule = weeklyTimetable[selectedDay] || [];

    const handleViewToggle = () => {
        const newMode = isWeekly ? 'daily' : 'weekly';
        setViewMode(newMode);
        if (newMode === 'daily') { 
            setSelectedDay(getTodayName());
        } else { 
            // When switching to weekly, if the current day is not in the WEEK_DAYS list, default to Monday
            if (!WEEK_DAYS.includes(selectedDay)) {
                setSelectedDay('Monday');
            }
        }
    };
    
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {currentDaySchedule.length === 0 ? (
                  <div className="col-span-full text-center text-[#bfaaff] p-10 rounded-xl bg-[#0a0420]/40 border border-dashed border-[#2b173d]">
                    {isWeekly 
                        ? `No timetable for **${selectedDay}** yet — check other days or press **Generate Weekly Timetable**.`
                        : `No schedule found for today (**${selectedDay}**). Please load or generate a weekly timetable.`}
                  </div>
                ) : currentDaySchedule.map((slot, i) => {
                  const item = slot.subject;
                  const isNamaz = slot.isNamaz;
                  const isFree = item === 'Free';
                  const bg = getColor(item, subjects);
                  const darkBg = isNamaz ? "#0891b2" : isFree ? "#2b173d" : darkenColor(bg, 20); 

                  // Set distinct styles for the timetable card/slot
                  const slotStyles = isNamaz 
                    ? { background: `linear-gradient(145deg, ${bg} 0%, ${darkBg} 100%)`, border: "1px solid #0891b2" } 
                    : isFree
                    ? { background: "rgba(14,6,32,0.45)", border: "1px solid #2b173d" }
                    : { background: `linear-gradient(145deg, ${bg} 0%, ${darkBg} 100%)`, border: `1px solid ${darkBg}`, opacity: slot.isCompleted ? 0.7 : 1 };
                    
                  const slotClasses = "relative p-3 rounded-xl shadow-lg transition duration-200 hover:shadow-xl hover:scale-[1.01]";
                  
                  return (
                    <div
                      key={i}
                      className={slotClasses}
                      style={slotStyles}
                    >
                      {/* Completion Toggle */}
                      {!isNamaz && !isFree && (
                        <button
                          onClick={() => toggleCompletion(i)}
                          className={`absolute top-2 right-2 p-1 rounded-full completion-toggle transition-all ${
                            slot.isCompleted 
                              ? 'bg-green-500 text-white shadow-lg shadow-green-700/50' 
                              : 'bg-black/50 text-gray-400 hover:bg-black/70'
                          }`}
                          title={slot.isCompleted ? "Mark Incomplete" : "Mark Completed"}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                            </svg>
                        </button>
                      )}


                      {/* Time Label */}
                      <div className="text-xs text-[#cfc0f8] mb-1 font-mono font-bold tracking-wider">
                        {formatHour(slot.hour)}
                      </div>

                      {isNamaz ? (
                        <div className="p-2 rounded-lg text-center text-white font-extrabold text-lg">
                          {item.split(' ')[1]}
                        </div>
                      ) : (
                        <select
                          value={item}
                          onChange={(e) => updateSlotSubject(i, e.target.value)} // Use new update function
                          className={`w-full ${isFree ? 'bg-[#080216] border border-[#2b173d]' : 'bg-white/10 border border-white/20'} text-[#efe7ff] px-3 py-2 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-[#9b6cf0] edit-select`}
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
    );
};
// --- END: Timetable Display Component ---


export default function Home() {
  const [subjects, setSubjects] = useState<Subject[]>([{ id: createId(), name: "", hours: "", priority: "3" }]);
  
  const [weeklyTimetable, setWeeklyTimetable] = useState<WeeklyTimetable>({}); 
  const [selectedDay, setSelectedDay] = useState<string>("Monday"); 
  // NEW STATE: View mode
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');

  const [user, setUser] = useState<User | null>(null);
  const [timetableName, setTimetableName] = useState("");
  const [savedTimetables, setSavedTimetables] = useState<{id:string,name:string}[]>([]);
  const [selectedTimetableId, setSelectedTimetableId] = useState<string>("");
  const timetableRef = useRef<HTMLDivElement | null>(null);
  const [loadingSave, setLoadingSave] = useState(false);
  const [notes, setNotes] = useState<string>(""); 

  // Google Sign-In & Auth
  const login = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
      loadAllTimetables(result.user.uid);
    } catch (e) {
      console.error("Sign-In error:", e);
      alert("Sign-In failed. Check console.");
    }
  };

  const logout = async () => {
    try { await signOut(auth); } catch (e) { console.error(e); }
    setUser(null);
    setSubjects([{ id: createId(), name: "", hours: "", priority: "3" }]);
    setWeeklyTimetable({});
    setSelectedDay(getTodayName()); // Reset to today
    setViewMode('daily'); // Reset to daily
    setSavedTimetables([]);
    setSelectedTimetableId("");
    setTimetableName("");
    setNotes("");
  };

  // Subject Management
  const addSubject = () => setSubjects(prev => [...prev, { id: createId(), name: "", hours: "", priority: "3" }]);

  const handleChange = (i: number, field: keyof Subject, value: string) => {
    const newSubjects = [...subjects];
    (newSubjects[i] as any)[field] = value; 
    setSubjects(newSubjects);
  };
  
  const removeSubject = (id: string) => setSubjects(prev => prev.filter(s => s.id !== id));
  
  // Function to toggle the completion status of a timetable slot
  const toggleCompletion = (slotIndex: number) => {
      setWeeklyTimetable(prev => {
          const dailySchedule = prev[selectedDay] || [];
          if (dailySchedule[slotIndex] && !dailySchedule[slotIndex].isNamaz && dailySchedule[slotIndex].subject !== 'Free') {
              const newDailySchedule = [...dailySchedule];
              newDailySchedule[slotIndex] = { 
                  ...newDailySchedule[slotIndex], 
                  isCompleted: !newDailySchedule[slotIndex].isCompleted 
              };
              return { ...prev, [selectedDay]: newDailySchedule };
          }
          return prev;
      });
  };

  // Function to manually change a slot's subject
  const updateSlotSubject = (slotIndex: number, newSubject: string) => {
    setWeeklyTimetable(prev => {
        const dailySchedule = prev[selectedDay] || [];
        if (dailySchedule[slotIndex]) {
            const newDailySchedule = [...dailySchedule];
            newDailySchedule[slotIndex] = {
                ...newDailySchedule[slotIndex],
                subject: newSubject,
                isCompleted: newSubject === 'Free' || newDailySchedule[slotIndex].isNamaz ? false : newDailySchedule[slotIndex].isCompleted
            };
            return { ...prev, [selectedDay]: newDailySchedule };
        }
        return prev;
    });
  }

  // CORE LOGIC: Generates a single day's timetable
  const generateDailyTimetable = useCallback((): TimetableSlot[] => {
    const dailyGrid: TimetableSlot[] = [];
    
    // 1. Filter and sort subjects by priority (highest priority first)
    const validSubjects = subjects
        .filter(s => s.name && s.hours && s.priority)
        .sort((a, b) => {
          const pA = parseInt(a.priority || "0");
          const pB = parseInt(b.priority || "0");
          return pB - pA; 
        });

    // 2. Total hours needed across the day
    let subjectQueue: string[] = [];
    validSubjects.forEach(s => {
      const hrs = parseInt(s.hours || "0"); 
      for (let i = 0; i < hrs; i++) subjectQueue.push(s.name); 
    });
    
    // 3. Shuffle the entire queue
    subjectQueue = shuffleArray(subjectQueue);

    DAY_HOURS.forEach(h => {
      const namaz = NAMAZ_SLOTS.find(n => n.time === h);
      const subjectName = namaz ? `🔔 ${namaz.name}` : (subjectQueue.shift() || "Free");

      dailyGrid.push({ 
          subject: subjectName, 
          isNamaz: !!namaz, 
          isCompleted: false, 
          hour: h 
      });
    });
    return dailyGrid;
  }, [subjects]); 

  // Function to generate the entire weekly timetable
  const generateWeeklyTimetable = () => {
    const newWeeklyTimetable: WeeklyTimetable = {};
    WEEK_DAYS.forEach(day => {
        // Generate a fresh, random schedule for each day
        newWeeklyTimetable[day] = generateDailyTimetable();
    });
    setWeeklyTimetable(newWeeklyTimetable);
    
    // Switch to daily view and select today's day after generation
    setViewMode('daily');
    setSelectedDay(getTodayName());
  };

  // Firestore Logic
  const saveTimetable = async () => {
    if (!user) return alert("Please sign in first!");
    if (!timetableName.trim()) return alert("Enter timetable name!");
    if (Object.keys(weeklyTimetable).length === 0) return alert("Generate a weekly timetable first!");
    
    setLoadingSave(true);
    try {
      const subjectsToSave = subjects.map(({ id, ...rest }) => rest);

      const dataToSave = {
        uid: user.uid,
        name: timetableName.trim(),
        subjects: subjectsToSave,
        weeklyTimetable, 
        notes, 
      };
      
      if (selectedTimetableId) {
        const ref = doc(db, "timetables", selectedTimetableId);
        await updateDoc(ref, { ...dataToSave, updatedAt: new Date() });
        alert("Timetable updated!");
      } else {
        await addDoc(collection(db, "timetables"), {
          ...dataToSave,
          createdAt: new Date()
        });
        alert("Timetable saved!");
      }
      setTimetableName("");
      setSelectedTimetableId("");
      await loadAllTimetables(user.uid);
    } catch (e) {
      console.error("Firebase Save Error:", e); 
      alert("Failed to save. Check your browser's console (F12).");
    } finally {
      setLoadingSave(false);
    }
  };


  const deleteTimetable = async (id: string) => {
    if (!user) return;
    const ok = confirm("Are you sure you want to delete this timetable?");
    if (!ok) return;
    try {
      await deleteDoc(doc(db, "timetables", id));
      if (selectedTimetableId === id) {
        setSelectedTimetableId("");
        setWeeklyTimetable({});
        setSubjects([{ id: createId(), name: "", hours: "", priority: "3" }]);
        setTimetableName("");
        setNotes("");
        setSelectedDay(getTodayName());
        setViewMode('daily');
      }
      await loadAllTimetables(user.uid);
    } catch (e) {
      console.error("Delete error:", e);
      alert("Failed to delete. Check console.");
    }
  };


  const loadAllTimetables = async (uid: string) => {
    try {
      const q = query(collection(db, "timetables"), where("uid", "==", uid));
      const snap = await getDocs(q);
      const list: {id:string,name:string}[] = [];
      snap.forEach(d => list.push({ id: d.id, name: d.data().name || "Unnamed" }));
      setSavedTimetables(list);
    } catch (e) {
      console.error("Load all error:", e);
    }
  };


  const loadTimetable = async (id: string) => {
    try {
      const q = query(collection(db, "timetables"), where("__name__", "==", id));
      const snap = await getDocs(q);
      
      snap.forEach(docSnap => {
        if (docSnap.id === id) {
          const data = docSnap.data();
          
          const loadedSubjects: Subject[] = (data.subjects || []).map((s: any) => ({
              id: createId(), 
              name: s.name || "",
              hours: s.hours || "",
              priority: s.priority || "3" 
          }));

          const loadedWeeklyTimetable: WeeklyTimetable = data.weeklyTimetable || {};

          // Fallback for old single-day saves
          if (Object.keys(loadedWeeklyTimetable).length === 0 && data.timetable && Array.isArray(data.timetable)) {
             loadedWeeklyTimetable[getTodayName()] = (data.timetable as any[]).map((slot: any, i: number) => {
                if (typeof slot === 'string') {
                    const subject = slot;
                    const namaz = NAMAZ_SLOTS.find(n => subject.includes(n.name));
                    return { subject: subject, isNamaz: !!namaz, isCompleted: false, hour: DAY_HOURS[i] || 0, };
                }
                return { subject: slot.subject || "Free", isNamaz: !!slot.isNamaz, isCompleted: !!slot.isCompleted, hour: slot.hour || DAY_HOURS[i] || 0 };
             });
          }
          
          setSubjects(loadedSubjects.length > 0 ? loadedSubjects : [{ id: createId(), name: "", hours: "", priority: "3" }]);
          setWeeklyTimetable(loadedWeeklyTimetable);
          setTimetableName(data.name || "");
          setNotes(data.notes || ""); 
          setSelectedTimetableId(id);
          
          // Switch to daily view and select today's day after load
          setViewMode('daily');
          setSelectedDay(getTodayName());
        }
      });
    } catch (e) {
      console.error("Load timetable error:", e);
    }
  };


  // Export PDF Logic
  const exportToPDF = async () => {
    if (!timetableRef.current) return alert("Nothing to export");
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");
      
      // Temporary hide completion/edit elements before export
      const editElements = document.querySelectorAll('.completion-toggle, .edit-select, .day-selector');
      editElements.forEach(el => (el as HTMLElement).style.display = 'none');
      
      // The timetableRef is now inside TimetableDisplay and contains the full content
      const canvas = await html2canvas(timetableRef.current, { scale: 2 });
      
      editElements.forEach(el => (el as HTMLElement).style.display = 'block');

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${timetableName || "weekly-timetable"}.pdf`);
    } catch (e) {
      console.error("Export error:", e);
      alert("Export failed. Check console.");
    }
  };

  // Set the initial selected day to today and load auth state
  useEffect(() => {
    setSelectedDay(getTodayName());
    if (auth.currentUser) {
      setUser(auth.currentUser);
      loadAllTimetables(auth.currentUser.uid);
    }
  }, []);

  // --- Reusable button classes for a unified neon style ---
  const neonButtonClass = (color: string) =>
    `px-4 py-2 rounded-xl text-sm font-semibold transition btn-neon shadow-lg hover:shadow-2xl hover:scale-[.995] disabled:opacity-60 disabled:hover:scale-100 ${color}`;

  // Current Day Schedule (Used by Analytics, always reflects the day shown in the UI)
  const currentDaySchedule = weeklyTimetable[selectedDay] || [];


  // --- Study Analytics Panel Component (Modified to use selectedDay) ---
  const StudyAnalyticsPanel = () => {
      const analysis = useMemo(() => {
          const scheduledMap: { [key: string]: number } = {};
          const completedMap: { [key: string]: number } = {};
          let totalScheduled = 0;
          let totalCompleted = 0;

          currentDaySchedule.forEach(slot => {
              if (!slot.isNamaz && slot.subject !== 'Free') {
                  const subject = slot.subject;
                  scheduledMap[subject] = (scheduledMap[subject] || 0) + 1;
                  totalScheduled++;

                  if (slot.isCompleted) {
                      completedMap[subject] = (completedMap[subject] || 0) + 1;
                      totalCompleted++;
                  }
              }
          });

          const subjectsInUse = new Set([...Object.keys(scheduledMap)]);

          return {
              scheduledMap,
              completedMap,
              totalScheduled,
              totalCompleted,
              subjectsInUse: Array.from(subjectsInUse).sort(),
          };
      }, [currentDaySchedule]);

      if (analysis.totalScheduled === 0) {
          return null; 
      }
      
      return (
          <div className="bg-black/40 border border-purple-900/40 rounded-2xl p-5 shadow-2xl space-y-4">
              <h3 className="text-2xl font-extrabold text-[#e9ddfa] border-b border-purple-900/50 pb-3">📈 Analytics - {selectedDay}</h3>
              
              <p className="text-sm text-[#d3c6ef]">
                  Total Study Slots Scheduled: <strong className="text-green-400">{analysis.totalScheduled}</strong>, 
                  Total Completed: <strong className="text-pink-400">{analysis.totalCompleted}</strong>. Overall Completion: <strong className="text-yellow-400">{analysis.totalScheduled > 0 ? `${Math.round((analysis.totalCompleted / analysis.totalScheduled) * 100)}%` : '0%'}</strong>
              </p>

              <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                  {analysis.subjectsInUse.map(subject => {
                      const scheduled = analysis.scheduledMap[subject] || 0;
                      const completed = analysis.completedMap[subject] || 0;
                      const color = getColor(subject, subjects);
                      const completionPercentage = scheduled > 0 ? (completed / scheduled) * 100 : 0;
                      
                      return (
                          <div key={subject} className="rounded-lg p-2 bg-[#0e0620]/70 border border-[#2b173d] flex flex-col">
                              <div className="flex justify-between items-center mb-1">
                                  <span className="text-sm font-semibold" style={{ color: color }}>{subject}</span>
                                  <span className="text-xs text-[#d3c6ef]">
                                      Completed: <strong className="text-pink-400">{completed}</strong> / Scheduled: <strong className="text-green-400">{scheduled}</strong> {scheduled > 0 && `(${Math.round(completionPercentage)}%)`}
                                  </span>
                              </div>
                              <div className="w-full bg-gray-700 rounded-full h-2.5">
                                  <div 
                                      className="h-2.5 rounded-full" 
                                      style={{ width: `${completionPercentage}%`, backgroundColor: color }}
                                  ></div>
                              </div>
                          </div>
                      );
                  })}
              </div>
          </div>
      );
  };
  // --- END: Study Analytics Panel ---


  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b0211] via-[#0f0420] to-[#140426] text-slate-100 p-6">
      {/* NAVBAR */}
      <header className="max-w-6xl mx-auto mb-6">
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

      {/* MAIN */}
      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Controls */}
        <section className="lg:col-span-1 space-y-6">
            
            {/* Subject Panel */}
            <div className="bg-black/40 border border-purple-900/40 rounded-2xl p-5 space-y-5 shadow-2xl h-fit">
                <h2 className="text-2xl font-extrabold text-[#e9ddfa] border-b border-purple-900/50 pb-3">📚 Plan Your Subjects</h2>
                <p className="text-sm text-[#d3c6ef]">Define your subjects, daily hours, and priority (5=high).</p>

                {/* Subjects list */}
                <div className="space-y-3">
                    {subjects.map((s, i) => (
                    <div key={s.id} className="flex gap-2 items-center rounded-lg p-2 bg-[#0e0620]/70 border border-[#2b173d]">
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
                        title="Total hours required per day"
                        />
                        {/* Priority Input (1-5) */}
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
                        onClick={() => removeSubject(s.id)}
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

                {/* New Weekly Generator Button */}
                <div className="flex gap-2">
                    <button onClick={addSubject} className={neonButtonClass("flex-1 bg-gradient-to-r from-[#A855F7] to-[#EC4899] text-white")}>+ Add Subject</button>
                    <button onClick={generateWeeklyTimetable} className={neonButtonClass("bg-green-500 hover:bg-green-600 text-white")}>Generate Weekly Timetable</button>
                </div>

                {/* Save / load */}
                <div className="pt-5 border-t border-purple-900/50 space-y-3">
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

                    <button onClick={exportToPDF} className={neonButtonClass("bg-yellow-500 hover:bg-yellow-600 text-black")}>Export PDF (All Days)</button>
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
            </div>
            
            {/* Notes Section */}
            <div className="bg-black/40 border border-purple-900/40 rounded-2xl p-5 shadow-2xl space-y-3">
                <h3 className="text-2xl font-extrabold text-[#e9ddfa] border-b border-purple-900/50 pb-3">📝 Daily Notes</h3>
                <textarea
                    placeholder="Write down today's goals, thoughts, or reflections. (Saved with timetable)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={6}
                    className="w-full bg-[#0e0620] border border-[#2b173d] px-3 py-2 rounded-lg text-sm text-[#efe7ff] placeholder:text-[#b9a9d9] focus:outline-none focus:ring-2 focus:ring-[#9b6cf0] resize-none"
                />
            </div>

            {/* Tips Section */}
            <div className="bg-black/40 border border-purple-900/40 rounded-2xl p-5 space-y-3 text-xs text-[#d3c6ef]">
                <p className="font-bold">Tips:</p>
                <ul className="list-disc ml-4 space-y-1">
                    <li>Use **Generate Weekly Timetable** to create 7 different schedules based on your set hours.</li>
                    <li>**Priority** (1-5) influences the scheduling order (5 is highest).</li>
                    <li>Toggle between **Daily Focus** and **Weekly View** above the schedule.</li>
                </ul>
            </div>
        </section>

        {/* RIGHT: Pomodoro, Analytics and Timetable */}
        <section className="lg:col-span-2 space-y-6">
            
          <PomodoroTimer neonButtonClass={neonButtonClass} />
          <StudyAnalyticsPanel />

          {/* Timetable Display Component (Refactored) */}
          <div ref={timetableRef}> {/* Attach ref here for PDF export of the displayed content */}
              <TimetableDisplay 
                  weeklyTimetable={weeklyTimetable}
                  selectedDay={selectedDay}
                  setSelectedDay={setSelectedDay}
                  subjects={subjects}
                  toggleCompletion={toggleCompletion}
                  updateSlotSubject={updateSlotSubject}
                  viewMode={viewMode}
                  setViewMode={setViewMode}
              />
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
        Made with ❤️ • StudyPlanner — Purple Galaxy
      </footer>
    </div>
  );
}