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

// Hours of the day (4 AM to 11 PM) - 20 slots
const DAY_HOURS = Array.from({ length: 20 }, (_, i) => i + 4);

// Colors for subjects (used for small legend chips)
const COLORS = ["#A855F7","#EC4899","#8B5CF6","#7C3AED","#E879F9","#C084FC","#D946EF"];

// Type for subject (ADDED PRIORITY)
type Subject = { name: string; hours: string; priority: string };

// NEW TYPE: Timetable Slot with Completion Status
// This structure is an ARRAY OF OBJECTS (Maps) - fully supported by Firestore.
type TimetableSlot = { 
    subject: string; 
    isNamaz: boolean; 
    isCompleted: boolean; 
    hour: number;
};


// --- Utility function for shuffling ---
const shuffleArray = (array: any[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

// --- Helper function to get color ---
const getColor = (subject: string, subjects: Subject[]) => {
    if (!subject || subject === "Free") return "#2d2d2d";
    if (subject.includes('🔔')) return "#06b6d4"; // Namaz color
    const idx = COMMON_SUBJECTS.indexOf(subject);
    if (idx >= 0) return COLORS[idx % COLORS.length];
    const customIdx = subjects.findIndex(s => s.name === subject);
    if (customIdx >= 0) return COLORS[customIdx % COLORS.length];
    return "#6B7280";
};

// --- Helper function to format hour ---
const formatHour = (h:number) => {
    const ampm = h >= 12 ? "PM" : "AM";
    const hour = h % 12 === 0 ? 12 : h % 12;
    return `${hour} ${ampm}`;
};

// --- Helper function to darken a hex color (for styling) ---
const darkenColor = (color: string, percent: number) => {
  if (!color || !color.startsWith("#")) return color;
  let [r, g, b] = (color.match(/\w\w/g) || []).map(h => parseInt(h, 16));
  const p = 1 - percent / 100;
  r = Math.floor(r * p);
  g = Math.floor(g * p);
  b = Math.floor(b * p);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).padStart(6, '0')}`;
};


export default function Home() {
  // Priority system added: "3" is default priority
  const [subjects, setSubjects] = useState<Subject[]>([{ name: "", hours: "", priority: "3" }]);
  
  // Timetable is now an ARRAY OF OBJECTS (TimetableSlot[])
  const [timetable, setTimetable] = useState<TimetableSlot[]>([]); 
  
  const [user, setUser] = useState<User | null>(null);
  const [timetableName, setTimetableName] = useState("");
  const [savedTimetables, setSavedTimetables] = useState<{id:string,name:string}[]>([]);
  const [selectedTimetableId, setSelectedTimetableId] = useState<string>("");
  const timetableRef = useRef<HTMLDivElement | null>(null);
  const [loadingSave, setLoadingSave] = useState(false);

  // Google Sign-In
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
    setSubjects([{ name: "", hours: "", priority: "3" }]);
    setTimetable([]);
    setSavedTimetables([]);
    setSelectedTimetableId("");
    setTimetableName("");
  };

  // ADDED default priority: "3"
  const addSubject = () => setSubjects(prev => [...prev, { name: "", hours: "", priority: "3" }]);

  // Type-safe handler
  const handleChange = (i: number, field: keyof Subject, value: string) => {
    const newSubjects = [...subjects];
    newSubjects[i][field] = value;
    setSubjects(newSubjects);
  };
  
  // NEW: Function to toggle the completion status of a timetable slot
  const toggleCompletion = (slotIndex: number) => {
      const newTT = [...timetable];
      // Check if the slot exists and is not Namaz or Free before toggling
      if (newTT[slotIndex] && !newTT[slotIndex].isNamaz && newTT[slotIndex].subject !== 'Free') {
          newTT[slotIndex].isCompleted = !newTT[slotIndex].isCompleted;
          setTimetable(newTT);
      }
  };


  // MODIFIED: Generation now creates TimetableSlot[]
  const generateTimetable = () => {
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
      const hrs = parseInt(s.hours || "0"); // Assuming daily hours here
      for (let i = 0; i < hrs; i++) subjectQueue.push(s.name); 
    });
    
    // 3. Shuffle the entire queue for randomness while maintaining priority bias
    subjectQueue = shuffleArray(subjectQueue);

    DAY_HOURS.forEach(h => {
      const namaz = NAMAZ_SLOTS.find(n => n.time === h);
      const subjectName = namaz ? `🔔 ${namaz.name}` : (subjectQueue.shift() || "Free");

      dailyGrid.push({ 
          subject: subjectName, 
          isNamaz: !!namaz, 
          isCompleted: false, // New schedules start uncompleted
          hour: h 
      });
    });

    setTimetable(dailyGrid);
  };


  // MODIFIED: saveTimetable now sends TimetableSlot[]
  const saveTimetable = async () => {
    if (!user) return alert("Please sign in first!");
    if (!timetableName.trim()) return alert("Enter timetable name!");
    setLoadingSave(true);
    try {
      if (selectedTimetableId) {
        const ref = doc(db, "timetables", selectedTimetableId);
        // subjects is Array<Object>, timetable is Array<Object>
        await updateDoc(ref, { subjects, timetable, name: timetableName.trim() }); 
        alert("Timetable updated!");
      } else {
        await addDoc(collection(db, "timetables"), {
          uid: user.uid,
          name: timetableName.trim(),
          subjects,
          timetable, // This is now TimetableSlot[] (Array of Maps)
          createdAt: new Date()
        });
        alert("Timetable saved!");
      }
      setTimetableName("");
      setSelectedTimetableId("");
      await loadAllTimetables(user.uid);
    } catch (e) {
      // Improved error logging
      console.error("Firebase Save Error (Check Firebase logs):", e); 
      alert("Failed to save. Check your browser's console (F12) for a detailed 'Firebase Save Error' entry.");
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
        setTimetable([]);
        setSubjects([{ name: "", hours: "", priority: "3" }]);
        setTimetableName("");
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

  // MODIFIED: loadTimetable now handles TimetableSlot[] (or converts old string[] for backward compatibility)
  const loadTimetable = async (id: string) => {
    try {
      const q = query(collection(db, "timetables"), where("__name__", "==", id));
      const snap = await getDocs(q);
      
      snap.forEach(docSnap => {
        if (docSnap.id === id) {
          const data = docSnap.data();
          
          // Load subjects, adding default priority if not present
          const loadedSubjects = (data.subjects || [{ name: "", hours: "", priority: "3" }]).map((s:any) => ({
              name: s.name || "",
              hours: s.hours || "",
              priority: s.priority || "3" 
          }));
          
          const loadedTimetable = data.timetable || [];

          // Backward Compatibility Check: If the loaded timetable is the OLD string[] (array of strings)
          if (loadedTimetable.length > 0 && typeof loadedTimetable[0] === 'string') {
             const convertedTT: TimetableSlot[] = loadedTimetable.map((subject: string, i: number) => {
                 const namaz = NAMAZ_SLOTS.find(n => subject.includes(n.name));
                 return {
                     subject: subject,
                     isNamaz: !!namaz,
                     isCompleted: false, // Default to false for old loads
                     hour: DAY_HOURS[i] || 0,
                 };
             });
             setTimetable(convertedTT);
          } else {
             // New TimetableSlot[] or empty array
             setTimetable(loadedTimetable);
          }

          setSubjects(loadedSubjects);
          setTimetableName(data.name || "");
          setSelectedTimetableId(id);
        }
      });
    } catch (e) {
      console.error("Load timetable error:", e);
    }
  };

  // Export PDF - dynamic import to avoid SSR/build issues
  const exportToPDF = async () => {
    if (!timetableRef.current) return alert("Nothing to export");
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");
      
      // Temporary hide completion/edit elements before export
      const editElements = document.querySelectorAll('.completion-toggle, .edit-select');
      editElements.forEach(el => (el as HTMLElement).style.display = 'none');
      
      const canvas = await html2canvas(timetableRef.current, { scale: 2 });
      
      // Restore hidden elements after canvas creation
      editElements.forEach(el => (el as HTMLElement).style.display = 'block');

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${timetableName || "timetable"}.pdf`);
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

  // --- Reusable button classes for a unified neon style ---
  const neonButtonClass = (color: string) =>
    `px-4 py-2 rounded-xl text-sm font-semibold transition btn-neon shadow-lg hover:shadow-2xl hover:scale-[.995] disabled:opacity-60 disabled:hover:scale-100 ${color}`;

  // Current day schedule (used for rendering, always the current timetable state in this single-day view)
  const currentDaySchedule = timetable;

  // --- Study Analytics Panel Component (Simple Daily Version) ---
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
              <h3 className="text-2xl font-extrabold text-[#e9ddfa] border-b border-purple-900/50 pb-3">📈 Daily Analytics</h3>
              
              <p className="text-sm text-[#d3c6ef]">
                  Total Study Slots Scheduled: <strong className="text-green-400">{analysis.totalScheduled}</strong>, 
                  Total Completed: <strong className="text-pink-400">{analysis.totalCompleted}</strong>
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
        <section className="lg:col-span-1 bg-black/40 border border-purple-900/40 rounded-2xl p-5 space-y-5 shadow-2xl h-fit sticky top-6">
          <h2 className="text-2xl font-extrabold text-[#e9ddfa] border-b border-purple-900/50 pb-3">📚 Plan Your Subjects</h2>
          <p className="text-sm text-[#d3c6ef]">Define your subjects and the total hours you want to study each for the day.</p>

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
                  title="Total hours required per day"
                />
                {/* Priority Input (1-5) - ADDED */}
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
            <button onClick={generateTimetable} className={neonButtonClass("bg-green-500 hover:bg-green-600 text-white")}>Generate</button>
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

          <div className="pt-3 border-t border-black/30 text-xs text-[#d3c6ef] space-y-1">
            <p className="font-bold">Tips:</p>
            <ul className="list-disc ml-4">
              <li>Timetables are randomly generated each time you click **Generate**.</li>
              <li>**Priority** (1-5) influences the scheduling order.</li>
              <li>Namaz slots are protected and cannot be edited.</li>
              <li>Use the dropdowns to manually fine-tune your schedule.</li>
            </ul>
          </div>
        </section>

        {/* RIGHT: Analytics and Timetable */}
        <section className="lg:col-span-2 space-y-6">
            
          <StudyAnalyticsPanel />

          <div className="bg-black/40 border border-purple-900/40 rounded-2xl p-4 shadow-2xl">
            <h3 className="text-2xl font-extrabold mb-5 text-[#efe7ff]">🗓️ Your Daily Schedule</h3>

            <div ref={timetableRef} className="w-full">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {currentDaySchedule.length === 0 ? (
                  <div className="col-span-full text-center text-[#bfaaff] p-10 rounded-xl bg-[#0a0420]/40 border border-dashed border-[#2b173d]">
                    No timetable yet — add subjects and press <strong className="text-green-400">Generate</strong>.
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
                      {/* Completion Toggle (NEW) */}
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


                      {/* Time Label (moved to the top left) */}
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
                          onChange={(e) => {
                            const newTT = [...timetable];
                            // Update the specific hour for the selected day
                            newTT[i] = { 
                                ...newTT[i], 
                                subject: e.target.value,
                                isCompleted: e.target.value === 'Free' ? false : newTT[i].isCompleted 
                            };
                            setTimetable(newTT);
                          }}
                          // Invert colors for the dropdown to stand out on a colored slot
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