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

// --- Component Imports ---
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

// Maximum consecutive slots for the same subject
const MAX_CONSECUTIVE_SLOTS = 3;

// Colors for subjects
const COLORS = ["#A855F7","#EC4899","#8B5CF6","#7C3AED","#E879F9","#C084FC","#D946EF"];

// --- TYPES ---
export type Subject = { id: string; name: string; hours: string; priority: string };
export type TimetableSlot = { 
    subject: string; 
    isNamaz: boolean; 
    isCompleted: boolean; 
    hour: number;
};
export type WeeklyTimetable = { [key: string]: TimetableSlot[] };

// --- UTILITIES ---
const shuffleArray = (array: any[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};
const createId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);
const getTodayName = () => new Date().toLocaleDateString('en-US', { weekday: 'long' });
const formatHour = (h:number) => `${h % 12 === 0 ? 12 : h % 12} ${h >= 12 ? 'PM' : 'AM'}`;
const darkenColor = (color: string, percent: number) => {
  if (!color || !color.startsWith("#")) return color;
  let [r, g, b] = (color.match(/\w\w/g) || []).map(h => parseInt(h, 16));
  const p = 1 - percent / 100;
  r = Math.floor(r * p);
  g = Math.floor(g * p);
  b = Math.floor(b * p);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).padStart(6, '0')}`;
};
const getColor = (subject: string, subjects: Subject[]) => {
    if (!subject || subject === "Free") return "#2d2d2d";
    if (subject.includes('🔔')) return "#06b6d4";
    const idx = COMMON_SUBJECTS.indexOf(subject);
    if (idx >= 0) return COLORS[idx % COLORS.length];
    const customIdx = subjects.findIndex(s => s.name === subject);
    if (customIdx >= 0) return COLORS[customIdx % COLORS.length];
    return "#6B7280";
};

// --- Pomodoro Timer ---
const PomodoroTimer = ({ neonButtonClass }: { neonButtonClass: (color: string) => string }) => {
    const WORK_TIME = 25 * 60;
    const BREAK_TIME = 5 * 60;
    const [time, setTime] = useState(WORK_TIME);
    const [isActive, setIsActive] = useState(false);
    const [isWork, setIsWork] = useState(true);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const toggle = () => setIsActive(!isActive);
    const reset = () => { setIsActive(false); setIsWork(true); setTime(WORK_TIME); };
    useEffect(() => {
        if (isActive && time > 0) {
            timerRef.current = setTimeout(() => setTime(t => t - 1), 1000);
        } else if (time === 0) {
            const audio = new Audio('https://cdn.jsdelivr.net/gh/tahnik/tunes@latest/bell.mp3');
            audio.play().catch(()=>{});
            setIsWork(!isWork);
            setTime(isWork ? BREAK_TIME : WORK_TIME);
        }
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [isActive, time, isWork]);
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return (
        <div className="bg-black/30 border border-purple-700 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-2xl font-bold text-[#e9ddfa] border-b border-purple-700/50 pb-2">🍅 Pomodoro Timer</h3>
            <div className="text-center">
                <p className={`text-sm font-semibold mb-2 ${isWork ? 'text-green-400' : 'text-pink-400'}`}>
                    {isWork ? "Focus Time" : "Break Time"}
                </p>
                <div className={`text-5xl sm:text-6xl font-mono font-bold tracking-wider ${isActive ? 'text-white' : 'text-gray-400'}`}>
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

// --- Timetable Display ---
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
    const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));

    const handleViewToggle = () => {
        const newMode = isWeekly ? 'daily' : 'weekly';
        setViewMode(newMode);
        if (newMode === 'daily') { setSelectedDay(getTodayName()); } 
        else { if (!WEEK_DAYS.includes(selectedDay)) setSelectedDay('Monday'); }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            setWeeklyTimetable((prev) => {
                const daySchedule = prev[selectedDay] || [];
                const oldIndex = daySchedule.findIndex(slot => slot.hour === active.id);
                const newIndex = daySchedule.findIndex(slot => slot.hour === over?.id);
                if (oldIndex === -1 || newIndex === -1) return prev;
                if (daySchedule[oldIndex].isNamaz || daySchedule[newIndex].isNamaz) return prev;
                const newSchedule = arrayMove(daySchedule, oldIndex, newIndex);
                return { ...prev, [selectedDay]: newSchedule };
            });
        }
    }

    return (
        <div className="bg-black/30 border border-purple-700 rounded-2xl p-4 shadow-xl max-h-[75vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-3 border-b border-purple-700/50 pb-2">
                <h3 className="text-2xl font-bold text-[#efe7ff]">{isWeekly ? "Weekly Schedule" : `Daily Focus`}</h3>
                <button
                    onClick={handleViewToggle}
                    className="px-3 py-1 text-xs rounded-full bg-purple-600 hover:bg-purple-700 text-white transition-colors"
                    title={isWeekly ? "Switch to current day view" : "Switch to full weekly planner"}
                >
                    {isWeekly ? "→ Daily" : "← Weekly"}
                </button>
            </div>

            {isWeekly && (
                <div className="flex flex-wrap gap-2 mb-4 day-selector">
                    {WEEK_DAYS.map(day => (
                        <button
                            key={day}
                            onClick={() => setSelectedDay(day)}
                            className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                                selectedDay === day
                                    ? 'bg-[#A855F7] text-white shadow-lg'
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
                  <div className="text-center text-[#bfaaff] p-6 rounded-xl bg-[#0a0420]/40 border border-dashed border-[#2b173d]">
                    {isWeekly 
                        ? `No timetable for ${selectedDay} yet.`
                        : `No schedule for today (${selectedDay}).`}
                  </div>
                ) : (
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={currentDaySchedule.map(slot => slot.hour)} strategy={verticalListSortingStrategy}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
        </div>
    );
};

// --- MAIN COMPONENT ---
export default function Home() {
  const [subjects, setSubjects] = useState<Subject[]>([{ id: createId(), name: "", hours: "", priority: "3" }]);
  const [weeklyTimetable, setWeeklyTimetable] = useState<WeeklyTimetable>({}); 
  const [selectedDay, setSelectedDay] = useState<string>("Monday"); 
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');
  const [user, setUser] = useState<User | null>(null);
  const [timetableName, setTimetableName] = useState("");
  const [savedTimetables, setSavedTimetables] = useState<{id:string,name:string}[]>([]);
  const [selectedTimetableId, setSelectedTimetableId] = useState<string>("");
  const [loadingSave, setLoadingSave] = useState(false);
  const [notes, setNotes] = useState<string>(""); 

  const { totalRequestedHours, maxPossibleDailyHours } = useMemo(() => {
    const hours = subjects.reduce((sum, s) => sum + parseInt(s.hours || "0"), 0);
    return { totalRequestedHours: hours, maxPossibleDailyHours: DAY_HOURS.length - NAMAZ_SLOTS.length };
  }, [subjects]);

  // --- LOGIN / LOGOUT ---
  const login = async () => { try { const res = await signInWithPopup(auth, provider); setUser(res.user); loadAllTimetables(res.user.uid); } catch(e){ console.error(e);} };
  const logout = async () => { await signOut(auth); setUser(null); setSubjects([{id:createId(),name:"",hours:"",priority:"3"}]); setWeeklyTimetable({}); setSelectedDay(getTodayName()); setViewMode('daily'); setSavedTimetables([]); setSelectedTimetableId(""); setTimetableName(""); setNotes(""); localStorage.removeItem('lastTimetableId'); localStorage.removeItem('lastTimetableName'); };

  // --- SUBJECT / TIMETABLE MANAGEMENT ---
  const addSubject = () => setSubjects(prev => [...prev, {id:createId(),name:"",hours:"",priority:"3"}]);
  const handleChange = (i:number, field:keyof Subject, value:string) => { const newSubjects = [...subjects]; (newSubjects[i] as any)[field]=value; setSubjects(newSubjects); };
  const removeSubject = (id:string) => setSubjects(prev => prev.filter(s=>s.id!==id));
  const toggleCompletion = (i:number) => { setWeeklyTimetable(prev => { const daily = prev[selectedDay]||[]; if(daily[i]&&!daily[i].isNamaz&&daily[i].subject!=='Free'){ const newDaily=[...daily]; newDaily[i]={...newDaily[i],isCompleted:!newDaily[i].isCompleted}; return {...prev,[selectedDay]:newDaily};} return prev; }); };
  const updateSlotSubject = (i:number, newSubject:string) => { setWeeklyTimetable(prev=>{ const daily=prev[selectedDay]||[]; if(daily[i]){ const newDaily=[...daily]; newDaily[i]={...newDaily[i],subject:newSubject,isCompleted:newSubject==='Free'||newDaily[i].isNamaz?false:newDaily[i].isCompleted}; return {...prev,[selectedDay]:newDaily}; } return prev; }); };

  // --- TIMETABLE GENERATION ---
  const generateDailyTimetable = useCallback(()=>{ 
    const dailyGrid: TimetableSlot[]=[]; 
    const validSubjects = subjects.filter(s=>s.name&&s.hours&&s.priority).sort((a,b)=>parseInt(b.priority)-parseInt(a.priority));
    let subjectQueue:string[]=[]; validSubjects.forEach(s=>{ for(let i=0;i<parseInt(s.hours);i++) subjectQueue.push(s.name); });
    subjectQueue=shuffleArray(subjectQueue); let consecutiveCount=0,currentSubject="";
    DAY_HOURS.forEach(h=>{ const namaz = NAMAZ_SLOTS.find(n=>n.time===h); if(namaz){dailyGrid.push({subject:`🔔 ${namaz.name}`,isNamaz:true,isCompleted:false,hour:h}); currentSubject=""; consecutiveCount=0; return;} 
    let found=false,subjectName=""; for(let i=0;i<subjectQueue.length;i++){const next=subjectQueue[i]; if(next===currentSubject&&consecutiveCount>=MAX_CONSECUTIVE_SLOTS) continue; subjectName=next; subjectQueue.splice(i,1); found=true; break;} 
    if(!found) subjectName="Free"; if(subjectName===currentSubject) consecutiveCount++; else{currentSubject=subjectName; consecutiveCount=subjectName==="Free"?0:1;} dailyGrid.push({subject:subjectName,isNamaz:false,isCompleted:false,hour:h});});
    return dailyGrid;
  },[subjects]);

  const generateWeeklyTimetable=()=>{ if(totalRequestedHours===0){ alert("Define at least one subject"); return;} 
    if(totalRequestedHours>maxPossibleDailyHours){ if(!confirm(`Requested ${totalRequestedHours} slots but only ${maxPossibleDailyHours} available.`)) return;} 
    else if(totalRequestedHours<maxPossibleDailyHours/2){ if(!confirm(`Only ${totalRequestedHours} slots defined for ${maxPossibleDailyHours} available.`)) return;} 
    const weekly:WeeklyTimetable={}; WEEK_DAYS.forEach(d=>weekly[d]=generateDailyTimetable()); setWeeklyTimetable(weekly); setViewMode('daily'); setSelectedDay(getTodayName()); setSelectedTimetableId(""); 
  };

  const neonButtonClass=(color:string)=>`px-4 py-2 rounded-xl text-sm font-semibold transition btn-neon shadow-lg hover:shadow-2xl hover:scale-[.995] disabled:opacity-60 disabled:hover:scale-100 ${color}`;

  return (
    <div className="min-h-screen p-5 bg-gradient-to-b from-black via-purple-900 to-black text-[#efe7ff] space-y-6">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-wider text-purple-300">Study Planner</h1>
        {user ? <button onClick={logout} className={neonButtonClass("bg-red-600 hover:bg-red-700")}>Logout</button> :
          <button onClick={login} className={neonButtonClass("bg-green-600 hover:bg-green-700")}>Login</button>}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SubjectPlanner subjects={subjects} addSubject={addSubject} handleChange={handleChange} removeSubject={removeSubject} neonButtonClass={neonButtonClass} />
        <PomodoroTimer neonButtonClass={neonButtonClass} />
        <StudyAnalyticsPanel weeklyTimetable={weeklyTimetable} subjects={subjects} />
      </div>

      <div className="mt-6">
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
    </div>
  );
}
