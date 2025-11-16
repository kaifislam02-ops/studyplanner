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

// Dnd Kit Imports (unchanged)
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

// Component Imports (unchanged)
import { DraggableSlot } from "../componentsDraggableSlot"; 
import { SubjectPlanner } from "../componentsSubjectPlanner";
import { StudyAnalyticsPanel } from "../componentsStudyAnalyticsPanel"; 

// CONSTANTS (unchanged)
const COMMON_SUBJECTS = [
  "Mathematics","Physics","Chemistry","Biology","English","Computer Science",
  "History","Geography","Political Science","Economics","Psychology","Sociology",
  "Hindi","Urdu","Physical Education","Art","Music","Philosophy","Environmental Science",
];

const WEEK_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

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

const COLORS = ["#6366F1","#EC4899","#8B5CF6","#10B981","#F59E0B","#EF4444","#06B6D4"];

// TYPES
export type Subject = { id: string; name: string; hours: string; priority: string };
export type TimetableSlot = { 
    subject: string; 
    isNamaz: boolean; 
    isCompleted: boolean; 
    hour: number;
};
export type WeeklyTimetable = { [key: string]: TimetableSlot[] };

// UTILITIES (unchanged)
const shuffleArray = (array: any[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const createId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

const getTodayName = () => {
    const d = new Date();
    return d.toLocaleDateString('en-US', { weekday: 'long' });
};

const getColor = (subject: string, subjects: Subject[]) => {
    if (!subject || subject === "Free") return "#6B7280";
    if (subject.includes('🔔')) return "#06b6d4";
    const idx = COMMON_SUBJECTS.indexOf(subject);
    if (idx >= 0) return COLORS[idx % COLORS.length];
    const customIdx = subjects.findIndex(s => s.name === subject);
    if (customIdx >= 0) return COLORS[customIdx % COLORS.length];
    return "#6B7280";
};

const formatHour = (h:number) => {
    const ampm = h >= 12 ? "PM" : "AM";
    const hour = h % 12 === 0 ? 12 : h % 12;
    return `${hour} ${ampm}`;
};

const darkenColor = (color: string, percent: number) => {
  if (!color || !color.startsWith("#")) return color;
  let [r, g, b] = (color.match(/\w\w/g) || []).map(h => parseInt(h, 16));
  const p = 1 - percent / 100;
  r = Math.floor(r * p);
  g = Math.floor(g * p);
  b = Math.floor(b * p);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).padStart(6, '0')}`;
};

// Pomodoro Timer (unchanged logic; classes updated)
const PomodoroTimer = () => {
    const WORK_TIME = 25 * 60;
    const BREAK_TIME = 5 * 60;
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
        <div className="glass-card card-pad h-full">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-orange-500 rounded-xl flex items-center justify-center shadow-md">
                    <span className="text-white font-bold">🍅</span>
                </div>
                <div>
                    <h3 className="header-title text-primary">Focus Timer</h3>
                    <p className="small-muted"> {isWork ? "Time to focus! 💪" : "Take a break! 🌴"}</p>
                </div>
            </div>
            
            <div className="text-center mb-4">
                <div className={`text-4xl font-mono font-bold mb-1 ${isActive ? (isWork ? 'text-primary' : 'text-muted') : 'text-muted'}`}>
                    {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </div>
                <div className="text-sm text-muted font-medium">
                    {isWork ? "Focus Session" : "Break Time"}
                </div>
            </div>
            
            <div className="flex gap-3">
                <button 
                    onClick={toggle}
                    className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300 shadow-md ${
                        isActive 
                            ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white' 
                            : 'bg-gradient-to-r from-green-500 to-teal-600 text-white'
                    }`}
                >
                    {isActive ? "⏸️ Pause" : "▶️ Start"}
                </button>
                <button 
                    onClick={reset}
                    className="py-3 px-4 bg-white/5 hover:bg-white/8 text-primary rounded-xl font-medium transition-all duration-300 border border-white/6"
                >
                    🔄 Reset
                </button>
            </div>
        </div>
    );
};

// TimetableDisplay (only class names changed for aesthetics)
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

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            setWeeklyTimetable((prev) => {
                const daySchedule = prev[selectedDay] || [];
                const oldIndex = daySchedule.findIndex(slot => slot.hour === active.id);
                const newIndex = daySchedule.findIndex(slot => slot.hour === over?.id);
                if (oldIndex === -1 || newIndex === -1) return prev;
                if (daySchedule[oldIndex].isNamaz || daySchedule[newIndex].isNamaz) {
                    return prev;
                }
                const newSchedule = arrayMove(daySchedule, oldIndex, newIndex);
                return { ...prev, [selectedDay]: newSchedule };
            });
        }
    };

    return (
        <div className="glass-card card-pad">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="text-xl font-semibold text-primary">
                        {isWeekly ? "Weekly Schedule" : "Daily Focus"}
                    </h3>
                    <p className="small-muted">{selectedDay}</p>
                </div>
                <button
                    onClick={handleViewToggle}
                    className="px-4 py-2 bg-white/5 hover:bg-white/8 text-primary rounded-xl font-medium transition-all duration-200 border border-white/6"
                >
                    {isWeekly ? "📅 Daily View" : "📊 Weekly View"}
                </button>
            </div>
            
            {isWeekly && (
                <div className="flex gap-2 mb-4 p-2 bg-white/3 rounded-xl">
                    {WEEK_DAYS.map(day => (
                        <button
                            key={day}
                            onClick={() => setSelectedDay(day)}
                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                                selectedDay === day
                                    ? 'bg-gradient-to-r from-[#06b6d4]/80 to-[#7c3aed]/80 text-white shadow-md'
                                    : 'bg-white/5 text-muted hover:bg-white/8'
                            }`}
                        >
                            {day.slice(0, 3)}
                        </button>
                    ))}
                </div>
            )}

            {currentDaySchedule.length === 0 ? (
                <div className="text-center py-8 text-muted">
                    <div className="w-20 h-20 bg-gradient-to-br from-gray-800/30 to-gray-700/10 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                        <span className="text-3xl">📚</span>
                    </div>
                    <p className="text-primary text-lg font-medium">No timetable generated yet</p>
                    <p className="text-sm text-muted mt-2">Add subjects and generate your schedule to get started</p>
                </div>
            ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={currentDaySchedule.map(slot => slot.hour)} strategy={verticalListSortingStrategy}>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {currentDaySchedule.map((slot, i) => (
                                <DraggableSlot
                                    key={slot.hour}
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
    );
};

export default function Home() {
  // STATE (unchanged logic)
  const [subjects, setSubjects] = useState<Subject[]>([{ id: createId(), name: "", hours: "", priority: "3" }]);
  const [weeklyTimetable, setWeeklyTimetable] = useState<WeeklyTimetable>({}); 
  const [selectedDay, setSelectedDay] = useState<string>("Monday"); 
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');
  const [user, setUser] = useState<User | null>(null);
  const [timetableName, setTimetableName] = useState("");
  const [savedTimetables, setSavedTimetables] = useState<{id:string,name:string}[]>([]);
  const [selectedTimetableId, setSelectedTimetableId] = useState<string>("");
  const timetableRef = useRef<HTMLDivElement | null>(null);
  const [loadingSave, setLoadingSave] = useState(false);
  const [notes, setNotes] = useState<string>(""); 

  // THEME: manual toggle — stores in localStorage & sets html[data-theme]
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('sp-theme') : null;
      if (stored === 'light' || stored === 'dark') return stored;
      // fallback to system preference
      return (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
      try { localStorage.setItem('sp-theme', theme); } catch {}
    }
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  // rest of code unchanged (auth, save/load, generate, analytics)
  const { totalRequestedHours, maxPossibleDailyHours } = useMemo(() => {
    const hours = subjects.reduce((sum, s) => {
      const hrs = parseInt(s.hours || "0");
      return sum + hrs;
    }, 0);
    return { totalRequestedHours: hours, maxPossibleDailyHours: TOTAL_DAILY_STUDY_SLOTS };
  }, [subjects]);

  const { dailyCompletionRate, weeklyTotalStudyHours, weeklyTargetHours } = useMemo(() => {
    let completedSlotsToday = 0;
    let totalStudySlotsToday = 0;
    const todaySchedule = weeklyTimetable[getTodayName()] || [];
    todaySchedule.forEach(slot => {
        if (!slot.isNamaz && slot.subject !== 'Free') {
            totalStudySlotsToday++;
            if (slot.isCompleted) completedSlotsToday++;
        }
    });
    const rate = totalStudySlotsToday > 0 ? (completedSlotsToday / totalStudySlotsToday) * 100 : 0;
    const weeklyTarget = WEEK_DAYS.length * totalRequestedHours;
    let completedWeeklyHours = 0;
    Object.values(weeklyTimetable).forEach(daySchedule => {
        daySchedule.forEach(slot => {
            if (!slot.isNamaz && slot.subject !== 'Free' && slot.isCompleted) completedWeeklyHours++;
        });
    });
    return { dailyCompletionRate: rate, weeklyTotalStudyHours: completedWeeklyHours, weeklyTargetHours: weeklyTarget };
  }, [weeklyTimetable, totalRequestedHours]); 

  // Auth & firebase unchanged
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
    setSelectedDay(getTodayName()); 
    setViewMode('daily'); 
    setSavedTimetables([]);
    setSelectedTimetableId("");
    setTimetableName("");
    setNotes("");
    localStorage.removeItem('lastTimetableId');
    localStorage.removeItem('lastTimetableName');
  };

  // Subject management (unchanged)
  const addSubject = () => setSubjects(prev => [...prev, { id: createId(), name: "", hours: "", priority: "3" }]);
  const handleChange = (i: number, field: keyof Subject, value: string) => {
    const newSubjects = [...subjects];
    (newSubjects[i] as any)[field] = value; 
    setSubjects(newSubjects);
  };
  const removeSubject = (id: string) => setSubjects(prev => prev.filter(s => s.id !== id));
  
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

  const generateDailyTimetable = useCallback((): TimetableSlot[] => {
    const dailyGrid: TimetableSlot[] = [];
    const validSubjects = subjects.filter(s => s.name && s.hours && s.priority).sort((a, b) => {
      const pA = parseInt(a.priority || "0");
      const pB = parseInt(b.priority || "0");
      return pB - pA; 
    });

    let subjectQueue: string[] = [];
    validSubjects.forEach(s => {
      const hrs = parseInt(s.hours || "0"); 
      for (let i = 0; i < hrs; i++) subjectQueue.push(s.name); 
    });
    subjectQueue = shuffleArray(subjectQueue);

    let consecutiveCount = 0;
    let currentSubject = "";
    
    DAY_HOURS.forEach(h => {
      const namaz = NAMAZ_SLOTS.find(n => n.time === h);
      if (namaz) {
          dailyGrid.push({ subject: `🔔 ${namaz.name}`, isNamaz: true, isCompleted: false, hour: h });
          currentSubject = "";
          consecutiveCount = 0;
          return;
      }

      let subjectName = "";
      let foundSlot = false;
      for (let i = 0; i < subjectQueue.length; i++) {
        const nextSubject = subjectQueue[i];
        if (nextSubject === currentSubject && consecutiveCount >= MAX_CONSECUTIVE_SLOTS) continue;
        subjectName = nextSubject;
        subjectQueue.splice(i, 1);
        foundSlot = true;
        break;
      }
      if (!foundSlot) subjectName = "Free";

      if (subjectName === currentSubject) consecutiveCount++;
      else { currentSubject = subjectName; consecutiveCount = subjectName === "Free" ? 0 : 1; }

      dailyGrid.push({ subject: subjectName, isNamaz: false, isCompleted: false, hour: h });
    });
    return dailyGrid;
  }, [subjects]); 

  const generateWeeklyTimetable = () => {
    if (totalRequestedHours === 0) {
        alert("Please define at least one subject with study hours before generating the timetable.");
        return;
    }
    if (totalRequestedHours > maxPossibleDailyHours) {
        const confirmExceed = confirm(`You have requested ${totalRequestedHours} hours of study, but there are only ${maxPossibleDailyHours} available slots per day (after Namaz). \n\nDo you want to proceed anyway?`);
        if (!confirmExceed) return;
    } else if (totalRequestedHours < maxPossibleDailyHours / 2) {
        const confirmLow = confirm(`You have requested only ${totalRequestedHours} hours of study for a day that has ${maxPossibleDailyHours} available slots. \n\nMost of your day will be marked as 'Free'. \n\nDo you want to proceed anyway?`);
        if (!confirmLow) return;
    }

    const newWeeklyTimetable: WeeklyTimetable = {};
    WEEK_DAYS.forEach(day => { newWeeklyTimetable[day] = generateDailyTimetable(); });
    setWeeklyTimetable(newWeeklyTimetable);
    setViewMode('daily');
    setSelectedDay(getTodayName());
    setSelectedTimetableId("");
  };

  // Firestore functions (unchanged)
  const saveTimetable = async () => {
    if (!user) return alert("Please sign in first!");
    if (!timetableName.trim()) return alert("Enter timetable name!");
    if (Object.keys(weeklyTimetable).length === 0) return alert("Generate a weekly timetable first!");
    
    setLoadingSave(true);
    try {
      const subjectsToSave = subjects.map(({ id, ...rest }) => rest);
      const weeklyTimetableToSave = Object.keys(weeklyTimetable).reduce((acc, day) => {
          acc[day] = weeklyTimetable[day].map(slot => ({
              subject: slot.subject, isNamaz: slot.isNamaz, isCompleted: slot.isCompleted, hour: slot.hour,
          }));
          return acc;
      }, {} as WeeklyTimetable);

      const dataToSave = { uid: user.uid, name: timetableName.trim(), subjects: subjectsToSave, weeklyTimetable: weeklyTimetableToSave, notes };
      
      let newId = selectedTimetableId;
      if (selectedTimetableId) {
        const ref = doc(db, "timetables", selectedTimetableId);
        await updateDoc(ref, { ...dataToSave, updatedAt: new Date() });
        alert("Timetable updated!");
      } else {
        const docRef = await addDoc(collection(db, "timetables"), { ...dataToSave, createdAt: new Date() });
        newId = docRef.id;
        alert("Timetable saved!");
      }
      setSelectedTimetableId(newId); 
      setTimetableName(timetableName.trim());
      await loadAllTimetables(user.uid);
    } catch (e) {
      console.error("Firebase Save Error:", e); 
      alert("Failed to save. Check your browser's console (F12).");
    } finally { setLoadingSave(false); }
  };

  const deleteTimetable = async (id: string) => {
    if (!user) return;
    const ok = confirm("Are you sure you want to delete this timetable?");
    if (!ok) return;
    try {
      await deleteDoc(doc(db, "timetables", id));
      if (selectedTimetableId === id) {
        setSelectedTimetableId(""); setWeeklyTimetable({}); setSubjects([{ id: createId(), name: "", hours: "", priority: "3" }]);
        setTimetableName(""); setNotes(""); setSelectedDay(getTodayName()); setViewMode('daily');
        localStorage.removeItem('lastTimetableId'); localStorage.removeItem('lastTimetableName');
      }
      await loadAllTimetables(user.uid);
    } catch (e) { console.error("Delete error:", e); alert("Failed to delete. Check console."); }
  };

  const loadAllTimetables = async (uid: string) => {
    try {
      const q = query(collection(db, "timetables"), where("uid", "==", uid));
      const snap = await getDocs(q);
      const list: {id:string,name:string}[] = [];
      snap.forEach(d => list.push({ id: d.id, name: d.data().name || "Unnamed" }));
      setSavedTimetables(list);
    } catch (e) { console.error("Load all error:", e); }
  };

  const loadTimetable = async (id: string) => {
    try {
      const q = query(collection(db, "timetables"), where("__name__", "==", id));
      const snap = await getDocs(q);
      snap.forEach(docSnap => {
        if (docSnap.id === id) {
          const data = docSnap.data();
          const loadedSubjects: Subject[] = (data.subjects || []).map((s: any) => ({
              id: createId(), name: s.name || "", hours: s.hours || "", priority: s.priority || "3" 
          }));
          const loadedWeeklyTimetable: WeeklyTimetable = data.weeklyTimetable || {};
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
          setViewMode('daily');
          setSelectedDay(getTodayName());
        }
      });
    } catch (e) { console.error("Load timetable error:", e); }
  };

  const exportToPDF = async () => {
    if (!timetableRef.current) return alert("Nothing to export");
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");
      const editElements = document.querySelectorAll('.completion-toggle, .edit-select, .day-selector');
      editElements.forEach(el => (el as HTMLElement).style.display = 'none');
      const canvas = await html2canvas(timetableRef.current, { scale: 2 });
      editElements.forEach(el => (el as HTMLElement).style.display = 'block');
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / pdfWidth;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${timetableName || "weekly-timetable"}.pdf`);
    } catch (e) {
      console.error("Export error:", e);
      alert("Export failed. Check console.");
    }
  };

  useEffect(() => {
    if (auth.currentUser) {
      setUser(auth.currentUser);
      loadAllTimetables(auth.currentUser.uid);
    }
  }, []);

  // PAGE UI — redesigned but logic intact
  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, var(--bg-10), var(--bg-00))', color: 'var(--text-primary)' }}>
      {/* Background Orbital Glows */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-36 -right-36 w-96 h-96 rounded-full" style={{ background: 'radial-gradient(closest-side, rgba(124,58,237,0.16), transparent)', filter: 'blur(80px)' }} />
        <div className="absolute -bottom-36 -left-36 w-96 h-96 rounded-full" style={{ background: 'radial-gradient(closest-side, rgba(6,182,212,0.12), transparent)', filter: 'blur(80px)' }} />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div style={{ width: '36rem', height: '36rem', borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(99,102,241,0.06), transparent)', filter: 'blur(140px)' }} />
        </div>
      </div>

      {/* NAVBAR */}
      <header className="relative z-20">
        <nav className="container-centered py-6">
          <div className="glass-card flex items-center justify-between card-pad">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-[#6D28D9] to-[#06b6d4] rounded-2xl flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-xl">SP</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold gradient-text">StudyFlow</h1>
                <p className="small-muted">Smart Scheduling for Focused Learning</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* THEME TOGGLE — premium cosmic toggle */}
              <div className="flex items-center gap-3">
                <div
                  onClick={toggleTheme}
                  role="button"
                  aria-label="Toggle theme"
                  className="relative w-14 h-8 rounded-full p-1 cursor-pointer"
                  style={{
                    background: theme === 'dark' ? 'linear-gradient(90deg,#2a0b2c,#13072a)' : 'linear-gradient(90deg,#eef2ff,#e0f2fe)',
                    boxShadow: theme === 'dark' ? '0 6px 20px rgba(124,58,237,0.14)' : '0 6px 18px rgba(6,182,212,0.06)'
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: 4,
                    left: theme === 'dark' ? 6 : 36,
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    transition: 'all 260ms cubic-bezier(.2,.9,.2,1)',
                    background: theme === 'dark' ? 'linear-gradient(180deg,#7c3aed,#06b6d4)' : 'linear-gradient(180deg,#fff,#f1f5f9)',
                    boxShadow: theme === 'dark' ? '0 6px 20px rgba(124,58,237,0.28)' : '0 6px 18px rgba(2,6,23,0.06)'
                  }} />
                </div>
                <div className="text-sm small-muted">{theme === 'dark' ? 'Dark' : 'Light'}</div>
              </div>

              {/* Auth area */}
              {user ? (
                <>
                  <div className="hidden sm:flex items-center gap-3 bg-white/5 rounded-xl px-3 py-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">
                        {user.displayName?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm text-primary">Hi, {user.displayName?.split(' ')[0]}</span>
                  </div>
                  <button onClick={logout} className="btn-ghost ml-2">Sign Out</button>
                </>
              ) : (
                <button onClick={login} className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#06b6d4] to-[#7c3aed] text-white font-medium shadow-md">Sign in with Google 🚀</button>
              )}
            </div>
          </div>
        </nav>
      </header>

      {/* MAIN */}
      <main className="container-centered py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT controls */}
          <section className="lg:col-span-1 space-y-6">
            <SubjectPlanner
              subjects={subjects}
              addSubject={addSubject}
              handleChange={handleChange}
              removeSubject={removeSubject}
              generateWeeklyTimetable={generateWeeklyTimetable}
              totalRequestedHours={totalRequestedHours}
              maxPossibleDailyHours={maxPossibleDailyHours}
              COMMON_SUBJECTS={COMMON_SUBJECTS}
            />

            <div className="glass-card card-pad">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold">💾</span>
                </div>
                <div>
                  <h3 className="header-title text-primary">Save & Export</h3>
                  <p className="small-muted">Store and share your schedules</p>
                </div>
              </div>

              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="📝 Timetable Name"
                  value={timetableName}
                  onChange={(e) => setTimetableName(e.target.value)}
                  className="w-full rounded-xl px-4 py-3 text-primary bg-transparent border border-white/6"
                />

                <textarea
                  placeholder="📋 Notes (optional)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl px-4 py-3 text-primary bg-transparent border border-white/6 resize-none"
                />

                <div className="flex gap-3">
                  <button 
                    onClick={saveTimetable} 
                    disabled={loadingSave || !user}
                    className="flex-1 rounded-xl py-3 bg-gradient-to-r from-green-500 to-blue-600 text-white font-medium shadow"
                  >
                    {loadingSave ? 'Saving...' : selectedTimetableId ? '🔄 Update' : '💾 Save'}
                  </button>
                  <button 
                    onClick={exportToPDF} 
                    disabled={Object.keys(weeklyTimetable).length === 0}
                    className="px-5 rounded-xl py-3 bg-white/5 text-primary font-medium border border-white/6"
                  >
                    📄 Export
                  </button>
                </div>

                {savedTimetables.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-primary mb-2">📂 Saved Timetables</h4>
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-2">
                      {savedTimetables.map(tt => (
                        <div key={tt.id} className={`flex items-center justify-between p-3 rounded-lg ${tt.id === selectedTimetableId ? 'bg-white/6' : 'bg-white/3'} border border-white/6`}>
                          <span className="text-primary">{tt.name}</span>
                          <div className="flex gap-2">
                            <button onClick={() => loadTimetable(tt.id)} className="p-2">📥</button>
                            <button onClick={() => deleteTimetable(tt.id)} className="p-2">🗑️</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

          </section>

          {/* RIGHT content */}
          <section className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <PomodoroTimer />
              <StudyAnalyticsPanel
                dailyCompletionRate={dailyCompletionRate}
                weeklyTotalStudyHours={weeklyTotalStudyHours}
                weeklyTargetHours={weeklyTargetHours}
              />
            </div>

            <div ref={timetableRef}>
              <TimetableDisplay 
                weeklyTimetable={weeklyTimetable}
                selectedDay={selectedDay}
                setSelectedDay={setSelectedDay}
                subjects={subjects}
                toggleCompletion={toggleCompletion}
                updateSlotSubject={updateSlotSubject}
                setWeeklyTimetable={setWeeklyTimetable}
                viewMode={viewMode}
                setViewMode={setViewMode}
              />
            </div>
          </section>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="relative z-20 container-centered py-8">
        <div className="glass-card card-pad text-center">
          <p className="text-primary">Made with ❤️ • <span className="font-semibold gradient-text">StudyFlow</span> — Elevate Your Learning Journey</p>
          <p className="small-muted mt-2">Stay focused, stay productive, achieve greatness</p>
        </div>
      </footer>
    </div>
  );
}
