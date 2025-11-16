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


// --- Component Imports (FIXED: ONLY EXISTING FILES ARE IMPORTED) ---
// Removed componentsStudyAnalyticsPanel and componentsSubjectPlanner
import { DraggableSlot } from "../componentsDraggableSlot"; 


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

                const newSchedule = arrayMove(daySchedule, oldIndex, newIndex);
                
                return {
                    ...prev,
                    [selectedDay]: newSchedule,
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
                        <SortableContext 
                            items={currentDaySchedule.map(slot => slot.hour)} 
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                {currentDaySchedule.map((slot, i) => (
                                    <DraggableSlot
                                        key={slot.hour} // Use the hour as the key
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
    );
};
// --- END: Timetable Display Component ---


export default function Home() {
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
  
  // Calculate required vs available hours
  const { totalRequestedHours, maxPossibleDailyHours } = useMemo(() => {
    const hours = subjects.reduce((sum, s) => {
      const hrs = parseInt(s.hours || "0");
      return sum + hrs;
    }, 0);

    return {
        totalRequestedHours: hours,
        maxPossibleDailyHours: TOTAL_DAILY_STUDY_SLOTS // 15
    };
  }, [subjects]);


  // --- LOCAL STORAGE EFFECTS (NEW) ---

  // Effect 1: Load state from localStorage on startup
  useEffect(() => {
    if (typeof window !== 'undefined') {
        const storedId = localStorage.getItem('lastTimetableId');
        const storedName = localStorage.getItem('lastTimetableName');

        if (storedId && storedName && storedId !== "undefined") {
            setSelectedTimetableId(storedId);
            setTimetableName(storedName);
            // We assume the user will be logged in shortly if the ID exists,
            // or they can manually hit load later. 
        }
    }
    // Initial auth load
    setSelectedDay(getTodayName());
    if (auth.currentUser) {
      setUser(auth.currentUser);
      loadAllTimetables(auth.currentUser.uid);
    }
  }, []);

  // Effect 2: Save state to localStorage whenever ID or Name changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
        if (selectedTimetableId) {
            localStorage.setItem('lastTimetableId', selectedTimetableId);
        } else {
             // Clear local storage if the user explicitly clears the timetable state
             localStorage.removeItem('lastTimetableId');
        }
        
        // Always save the timetable name, even if unsaved
        localStorage.setItem('lastTimetableName', timetableName);
    }
  }, [selectedTimetableId, timetableName]);
  // --- END LOCAL STORAGE EFFECTS ---


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
    setSelectedDay(getTodayName()); 
    setViewMode('daily'); 
    setSavedTimetables([]);
    setSelectedTimetableId("");
    setTimetableName("");
    setNotes("");
    
    // Clear local storage on full logout
    localStorage.removeItem('lastTimetableId');
    localStorage.removeItem('lastTimetableName');
  };

  // Subject Management Functions
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

    let consecutiveCount = 0;
    let currentSubject = "";
    
    DAY_HOURS.forEach(h => {
      const namaz = NAMAZ_SLOTS.find(n => n.time === h);
      
      if (namaz) {
          // If it's Namaz, reset consecutive count
          dailyGrid.push({ subject: `🔔 ${namaz.name}`, isNamaz: true, isCompleted: false, hour: h });
          currentSubject = "";
          consecutiveCount = 0;
          return;
      }

      let subjectName = "";
      let foundSlot = false;
      
      // Look through the subject queue for the next slot
      for (let i = 0; i < subjectQueue.length; i++) {
        const nextSubject = subjectQueue[i];
        
        // Check for consecutive limit
        if (nextSubject === currentSubject && consecutiveCount >= MAX_CONSECUTIVE_SLOTS) {
            continue; // Skip this subject for now, try the next one in the queue
        }
        
        // Found a valid subject (or a free slot will be assigned if loop finishes)
        subjectName = nextSubject;
        subjectQueue.splice(i, 1); // Remove from queue
        foundSlot = true;
        break;
      }
      
      if (!foundSlot) {
          subjectName = "Free";
      }

      // Update tracking state for the next hour
      if (subjectName === currentSubject) {
          consecutiveCount++;
      } else {
          currentSubject = subjectName;
          consecutiveCount = subjectName === "Free" ? 0 : 1; // Reset to 1 if new subject, or 0 if Free
      }

      dailyGrid.push({ 
          subject: subjectName, 
          isNamaz: false, 
          isCompleted: false, 
          hour: h 
      });
    });
    
    return dailyGrid;
  }, [subjects]); 

  // Function to generate the entire weekly timetable with checks
  const generateWeeklyTimetable = () => {
    
    // --- CHECK LOGIC ---
    if (totalRequestedHours === 0) {
        alert("Please define at least one subject with study hours before generating the timetable.");
        return;
    }

    if (totalRequestedHours > maxPossibleDailyHours) {
        const confirmExceed = confirm(
            `You have requested ${totalRequestedHours} hours of study, but there are only ${maxPossibleDailyHours} available slots per day (after Namaz). \n\nThis means some slots will be filled randomly or left as 'Free'. \n\nDo you want to proceed anyway?`
        );
        if (!confirmExceed) return;
    } else if (totalRequestedHours < maxPossibleDailyHours / 2) {
        const confirmLow = confirm(
            `You have requested only ${totalRequestedHours} hours of study for a day that has ${maxPossibleDailyHours} available slots. \n\nMost of your day will be marked as 'Free'. \n\nDo you want to proceed anyway?`
        );
        if (!confirmLow) return;
    }
    // --- END CHECK LOGIC ---

    const newWeeklyTimetable: WeeklyTimetable = {};
    WEEK_DAYS.forEach(day => {
        newWeeklyTimetable[day] = generateDailyTimetable();
    });
    setWeeklyTimetable(newWeeklyTimetable);
    
    setViewMode('daily');
    setSelectedDay(getTodayName());
    
    // Clear selected Timetable ID if generating a new one
    setSelectedTimetableId("");
  };

  // Firestore Logic (UPDATED: Firebase Nested Array Fix)
  const saveTimetable = async () => {
    if (!user) return alert("Please sign in first!");
    if (!timetableName.trim()) return alert("Enter timetable name!");
    if (Object.keys(weeklyTimetable).length === 0) return alert("Generate a weekly timetable first!");
    
    setLoadingSave(true);
    try {
      // 1. Prepare subjects by removing the client-side 'id'
      const subjectsToSave = subjects.map(({ id, ...rest }) => rest);

      // 2. Prepare the weeklyTimetable (CRITICAL: Deep copy and clean the slot data)
      // This mapping ensures only primitive types are saved, avoiding the nested array error.
      const weeklyTimetableToSave = Object.keys(weeklyTimetable).reduce((acc, day) => {
          acc[day] = weeklyTimetable[day].map(slot => ({
              subject: slot.subject,
              isNamaz: slot.isNamaz,
              isCompleted: slot.isCompleted,
              hour: slot.hour,
          }));
          return acc;
      }, {} as WeeklyTimetable);

      const dataToSave = {
        uid: user.uid,
        name: timetableName.trim(),
        subjects: subjectsToSave,
        weeklyTimetable: weeklyTimetableToSave, // Use the cleaned object
        notes, 
      };
      
      let newId = selectedTimetableId;
      if (selectedTimetableId) {
        const ref = doc(db, "timetables", selectedTimetableId);
        await updateDoc(ref, { ...dataToSave, updatedAt: new Date() });
        alert("Timetable updated!");
      } else {
        const docRef = await addDoc(collection(db, "timetables"), {
          ...dataToSave,
          createdAt: new Date()
        });
        newId = docRef.id;
        alert("Timetable saved!");
      }
      // Update state to reflect the saved item is now loaded/selected
      setSelectedTimetableId(newId); 
      setTimetableName(timetableName.trim());
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
        // Clear local storage if the currently loaded item is deleted
        localStorage.removeItem('lastTimetableId');
        localStorage.removeItem('lastTimetableName');
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
          setSelectedTimetableId(id); // Set the selected ID
          
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
      const pdfHeight = (imgProps.height * pdfWidth) / pdfWidth;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${timetableName || "weekly-timetable"}.pdf`);
    } catch (e) {
      console.error("Export error:", e);
      alert("Export failed. Check console.");
    }
  };


  // --- Reusable button classes for a unified neon style ---
  const neonButtonClass = (color: string) =>
    `px-4 py-2 rounded-xl text-sm font-semibold transition btn-neon shadow-lg hover:shadow-2xl hover:scale-[.995] disabled:opacity-60 disabled:hover:scale-100 ${color}`;


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
        {/* LEFT: Controls (SubjectPlanner functionality inlined here) */}
        <section className="bg-black/40 border border-purple-900/40 rounded-2xl p-5 shadow-2xl space-y-5">
            <h3 className="text-2xl font-extrabold text-[#efe7ff] border-b border-purple-900/50 pb-3">
                📚 Study Plan & Goals
            </h3>
            
            {/* Subject Input Fields (Inlined from SubjectPlanner) */}
            <div className="space-y-3">
                <h4 className="text-lg font-semibold text-[#cfc0f8]">Subjects & Goals</h4>
                {subjects.map((sub, i) => (
                    <div key={sub.id} className="flex gap-2 items-center bg-black/20 p-2 rounded-lg border border-purple-900/40">
                        {/* Name */}
                        <select
                            value={sub.name}
                            onChange={(e) => handleChange(i, "name", e.target.value)}
                            className="flex-1 bg-transparent border-b border-purple-700/50 focus:border-[#A855F7] text-sm p-1 outline-none"
                        >
                            <option value="">Select Subject</option>
                            {COMMON_SUBJECTS.map(s => <option key={s} value={s} className="bg-[#0f0420]">{s}</option>)}
                            <option value={sub.name} disabled className="bg-[#0f0420] text-gray-500">--- Custom ---</option>
                        </select>
                        
                        {/* Hours */}
                        <input
                            type="number"
                            placeholder="Hrs/Day"
                            value={sub.hours}
                            onChange={(e) => handleChange(i, "hours", e.target.value)}
                            className="w-16 bg-transparent text-center border-b border-purple-700/50 focus:border-[#A855F7] text-sm p-1 outline-none"
                            min="0"
                        />
                        
                        {/* Priority */}
                        <select
                            value={sub.priority}
                            onChange={(e) => handleChange(i, "priority", e.target.value)}
                            className="w-20 bg-transparent border-b border-purple-700/50 focus:border-[#A855F7] text-sm p-1 outline-none"
                        >
                            <option value="3" className="bg-[#0f0420]">High</option>
                            <option value="2" className="bg-[#0f0420]">Medium</option>
                            <option value="1" className="bg-[#0f0420]">Low</option>
                        </select>
                        
                        {/* Remove Button */}
                        <button onClick={() => removeSubject(sub.id)} className="text-red-400 hover:text-red-300 p-1">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.5H4.25a.75.75 0 0 0 0 1.5h.581l1.194 7.32a3 3 0 0 0 2.966 2.68h3.338a3 3 0 0 0 2.965-2.68l1.194-7.32h.581a.75.75 0 0 0 0-1.5H14v-.5A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4.25a1.25 1.25 0 1 1 2.5 0 1.25 1.25 0 0 1-2.5 0ZM6.75 6.25l-.426 6.81a1.5 1.5 0 0 0 1.48 1.34h3.338a1.5 1.5 0 0 0 1.48-1.34l-.426-6.81H6.75Z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                ))}
            </div>

            <div className="flex gap-2">
                <button 
                    onClick={addSubject} 
                    className={neonButtonClass("flex-1 bg-gray-600 hover:bg-gray-700 text-white")}
                >
                    + Add Subject
                </button>
                <button 
                    onClick={generateWeeklyTimetable} 
                    className={neonButtonClass("flex-1 bg-[#A855F7] hover:bg-[#9333ea] text-white")}
                >
                    Generate Weekly Timetable
                </button>
            </div>

            <div className="text-xs text-[#cfc0f8] border-t border-purple-900/50 pt-3">
                <p>Requested Hours: <strong className="text-[#A855F7]">{totalRequestedHours}</strong> / day</p>
                <p>Available Slots: <strong className="text-[#A855F7]">{maxPossibleDailyHours}</strong> / day (After Namaz)</p>
            </div>
            
            {/* Timetable Management Section (Save/Load) */}
            <div className="border-t border-purple-900/50 pt-4 space-y-3">
                <h4 className="text-lg font-semibold text-[#cfc0f8]">Save & Load</h4>
                
                <input
                    type="text"
                    placeholder="Timetable Name"
                    value={timetableName}
                    onChange={(e) => setTimetableName(e.target.value)}
                    className="w-full bg-black/50 border border-purple-900/50 p-2 rounded-lg text-sm text-white placeholder-gray-400 focus:ring-[#A855F7] focus:border-[#A855F7] outline-none"
                />
                
                <textarea
                    placeholder="Notes (optional)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full bg-black/50 border border-purple-900/50 p-2 rounded-lg text-sm text-white placeholder-gray-400 focus:ring-[#A855F7] focus:border-[#A855F7] outline-none"
                />

                <div className="flex gap-2">
                    <button 
                        onClick={saveTimetable} 
                        disabled={loadingSave || !user}
                        className={neonButtonClass("flex-1 bg-green-600 hover:bg-green-700 text-white")}
                    >
                        {loadingSave ? 'Saving...' : selectedTimetableId ? 'Update Timetable' : 'Save Timetable'}
                    </button>
                    <button 
                        onClick={exportToPDF} 
                        disabled={Object.keys(weeklyTimetable).length === 0}
                        className={neonButtonClass("w-fit bg-blue-600 hover:bg-blue-700 text-white")}
                    >
                        Export PDF
                    </button>
                </div>

                {savedTimetables.length > 0 && (
                    <div className="space-y-2 mt-4">
                        <h5 className="text-sm font-medium text-[#cfc0f8]">Saved Timetables:</h5>
                        {savedTimetables.map(tt => (
                            <div key={tt.id} className={`flex justify-between items-center p-2 rounded-lg text-sm transition ${tt.id === selectedTimetableId ? 'bg-purple-800/40 border border-purple-500' : 'bg-black/20 hover:bg-black/30'}`}>
                                <span className="text-white">{tt.name}</span>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => loadTimetable(tt.id)}
                                        className="text-yellow-400 hover:text-yellow-300 transition"
                                    >
                                        Load
                                    </button>
                                    <button 
                                        onClick={() => deleteTimetable(tt.id)}
                                        className="text-red-400 hover:text-red-300 transition"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>


        {/* RIGHT: Pomodoro, Analytics (Placeholder), and Timetable */}
        <section className="lg:col-span-2 space-y-6">
            
          <PomodoroTimer neonButtonClass={neonButtonClass} />
          
          {/* Analytics Panel (Placeholder only) */}
          <div className="bg-black/40 border border-purple-900/40 rounded-2xl p-5 shadow-2xl space-y-4">
            <h3 className="text-2xl font-extrabold text-[#efe7ff] border-b border-purple-900/50 pb-3">
                📈 Study Analytics
            </h3>
            <p className="text-[#a886f7] font-semibold text-center p-4 bg-black/20 rounded-lg border border-purple-800/50">
                Data visualization for this panel is currently disabled.
            </p>
          </div>

          {/* Timetable Display Component (Refactored) */}
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