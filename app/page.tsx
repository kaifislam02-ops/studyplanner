// app/page.tsx
"use client";
import React, { useState, useMemo, useRef } from "react";
import { DraggableSlot } from "@/components/DraggableSlot";
import SubjectPlanner from "@/components/SubjectPlanner";
import StudyAnalyticsPanel from "@/components/StudyAnalyticsPanel";

// constants unchanged
const COMMON_SUBJECTS = [
  "Mathematics","Physics","Chemistry","Biology","English","Computer Science",
  "History","Geography","Political Science","Economics","Psychology","Sociology",
  "Hindi","Urdu","Physical Education","Art","Music","Philosophy","Environmental Science",
];
const WEEK_DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const NAMAZ_SLOTS = [{name:"Fajr",time:4},{name:"Zuhr",time:12},{name:"Asr",time:17},{name:"Maghrib",time:19},{name:"Isha",time:20}];
const DAY_HOURS = Array.from({length:20},(_,i)=>i+4);
const TOTAL_DAILY_STUDY_SLOTS = DAY_HOURS.length - NAMAZ_SLOTS.length;
const MAX_CONSECUTIVE_SLOTS = 3;
const COLORS = ["#6366F1","#EC4899","#8B5CF6","#10B981","#F59E0B","#EF4444","#06B6D4"];

export type Subject = { id: string; name: string; hours: string; priority: string; };
export type TimetableSlot = { subject: string; isNamaz: boolean; isCompleted: boolean; hour: number; };
export type WeeklyTimetable = { [day: string]: TimetableSlot[] };

const createId = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

const formatHour = (h:number) => {
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour} ${ampm}`;
};

const getTodayName = () => {
  const d = new Date();
  return d.toLocaleDateString("en-US",{weekday:"long"});
};

export default function HomePage() {
  const [subjects, setSubjects] = useState<Subject[]>([{id:createId(), name:"", hours:"", priority:"3"}]);
  const [weeklyTimetable, setWeeklyTimetable] = useState<WeeklyTimetable>({});
  const [selectedDay, setSelectedDay] = useState<string>(getTodayName());
  const [viewMode, setViewMode] = useState<'daily'|'weekly'>('daily');
  const [timetableName, setTimetableName] = useState("");
  const timetableRef = useRef<HTMLDivElement|null>(null);

  // utils
  const getColor = (subject: string, subs: Subject[]) => {
    if (!subject || subject==="Free") return "#4b5563";
    if (subject.includes("🔔")) return "#06b6d4";
    const idx = COMMON_SUBJECTS.indexOf(subject);
    if (idx>=0) return COLORS[idx % COLORS.length];
    const customIdx = subs.findIndex(s=>s.name===subject);
    if (customIdx>=0) return COLORS[customIdx % COLORS.length];
    return "#6B7280";
  };

  const darkenColor = (color:string, percent:number) => {
    if (!color.startsWith("#")) return color;
    let [r,g,b] = (color.match(/\w\w/g) || []).map(h => parseInt(h,16));
    const p = 1 - percent/100;
    r = Math.floor(r*p); g = Math.floor(g*p); b = Math.floor(b*p);
    return `#${((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1)}`;
  };

  // subject management
  const addSubject = () => setSubjects(prev=>[...prev,{id:createId(),name:"",hours:"",priority:"3"}]);
  const handleChange = (i:number, field: keyof Subject, value:string) => {
    setSubjects(prev => { const cp = [...prev]; (cp[i] as any)[field]=value; return cp; });
  };
  const removeSubject = (id:string) => setSubjects(prev=>prev.filter(s=>s.id!==id));

  const totalRequestedHours = subjects.reduce((s,sub)=>s + (parseInt(sub.hours||"0")||0),0);
  const maxPossibleDailyHours = TOTAL_DAILY_STUDY_SLOTS;

  // generate single day schedule (randomized but respects namaz & max consecutive)
  const generateDaily = (): TimetableSlot[] => {
    const grid: TimetableSlot[] = [];
    const valid = subjects.filter(s=>s.name && s.hours).sort((a,b)=>parseInt(b.priority||"0") - parseInt(a.priority||"0"));
    let queue: string[] = [];
    valid.forEach(s=>{ const hrs = parseInt(s.hours||"0"); for(let i=0;i<hrs;i++) queue.push(s.name); });
    // shuffle
    for(let i=queue.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [queue[i],queue[j]]=[queue[j],queue[i]]; }

    let curr="", consec=0;
    DAY_HOURS.forEach(h=>{
      const namaz = NAMAZ_SLOTS.find(n=>n.time===h);
      if (namaz) { grid.push({subject:`🔔 ${namaz.name}`, isNamaz:true, isCompleted:false, hour:h}); curr=""; consec=0; return; }
      let chosen="Free"; let found=false;
      for(let i=0;i<queue.length;i++){
        if (queue[i]===curr && consec>=MAX_CONSECUTIVE_SLOTS) continue;
        chosen = queue.splice(i,1)[0];
        found=true; break;
      }
      if (!found) chosen="Free";
      if (chosen===curr) consec++; else { curr=chosen; consec = chosen==="Free"?0:1; }
      grid.push({subject:chosen, isNamaz:false, isCompleted:false, hour:h});
    });
    return grid;
  };

  const generateWeekly = () => {
    if (totalRequestedHours === 0) return alert("Add subjects and hours first.");
    const week: WeeklyTimetable = {};
    WEEK_DAYS.forEach(d => week[d] = generateDaily());
    setWeeklyTimetable(week);
    setViewMode('daily');
    setSelectedDay(getTodayName());
  };

  const toggleCompletion = (index:number) => {
    setWeeklyTimetable(prev => {
      const daily = prev[selectedDay] ? [...prev[selectedDay]] : [];
      if (!daily[index] || daily[index].isNamaz) return prev;
      daily[index] = { ...daily[index], isCompleted: !daily[index].isCompleted };
      return { ...prev, [selectedDay]: daily };
    });
  };

  const updateSlotSubject = (index:number, subject:string) => {
    setWeeklyTimetable(prev => {
      const daily = prev[selectedDay] ? [...prev[selectedDay]] : [];
      if (!daily[index]) return prev;
      daily[index] = { ...daily[index], subject, isCompleted: subject === "Free" ? false : daily[index].isCompleted };
      return { ...prev, [selectedDay]: daily };
    });
  };

  // analytics (basic)
  const { dailyCompletionRate, weeklyTotalStudyHours, weeklyTargetHours } = useMemo(() => {
    const today = weeklyTimetable[getTodayName()] || [];
    let totalToday = 0, doneToday = 0;
    today.forEach(s => { if (!s.isNamaz && s.subject !== "Free") { totalToday++; if (s.isCompleted) doneToday++; } });
    const rate = totalToday ? (doneToday/totalToday)*100 : 0;
    let completedWeek = 0;
    Object.values(weeklyTimetable).forEach(day => day.forEach(s => { if (!s.isNamaz && s.subject!=="Free" && s.isCompleted) completedWeek++; }));
    const weeklyTarget = (totalRequestedHours) * WEEK_DAYS.length;
    return { dailyCompletionRate: rate, weeklyTotalStudyHours: completedWeek, weeklyTargetHours: weeklyTarget };
  }, [weeklyTimetable, totalRequestedHours]);

  return (
    <div className="min-h-screen px-6 py-8 max-w-7xl mx-auto">
      <header className="mb-6">
        <div className="glass-card flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl">📚</div>
            <div>
              <h1 className="text-2xl font-bold">StudyFlow</h1>
              <div className="text-sm text-white/70">Smart scheduling for focused learning</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-white/6 rounded-lg">Sign in</button>
          </div>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-1 space-y-6">
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
            <div className="text-sm text-white/70 mb-3">Save & Export</div>
            <input placeholder="Timetable name" value={timetableName} onChange={(e)=>setTimetableName(e.target.value)} />
            <div className="mt-3 flex gap-2">
              <button className="flex-1 bg-gradient-to-r from-green-500 to-blue-600">Save</button>
              <button className="px-4 bg-white/6">Export</button>
            </div>
          </div>
        </section>

        <section className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="glass-card">
              <h3 className="text-lg font-semibold">Focus Timer</h3>
              <div className="mt-4 text-white/70">Pomodoro placeholder (keep existing Pomodoro component if you have one)</div>
            </div>

            <StudyAnalyticsPanel
              dailyCompletionRate={dailyCompletionRate}
              weeklyTotalStudyHours={weeklyTotalStudyHours}
              weeklyTargetHours={weeklyTargetHours}
            />
          </div>

          <div ref={timetableRef} className="glass-card">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xl font-semibold">{viewMode==='daily' ? "Daily Schedule" : "Weekly Schedule"}</h3>
                <div className="text-sm text-white/70">{selectedDay}</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={()=>setViewMode(vm=>vm==='daily'?'weekly':'daily')} className="px-4 py-2 bg-white/6 rounded-lg">
                  {viewMode==='daily' ? "Weekly view" : "Daily view"}
                </button>
              </div>
            </div>

            {(!weeklyTimetable[selectedDay] || weeklyTimetable[selectedDay].length===0) ? (
              <div className="text-center py-12 text-white/60">No timetable generated yet. Use 'Generate' in the left panel.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(weeklyTimetable[selectedDay] || []).map((slot, i)=>(
                  <DraggableSlot
                    key={slot.hour}
                    slot={slot}
                    index={i}
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

      <footer className="mt-8 text-center text-white/60">Made with ❤️ • StudyFlow</footer>
    </div>
  );
}
