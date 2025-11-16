"use client";
import { useState, useEffect, useRef } from "react";
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

// Type for subject
type Subject = { name: string; hours: string };

// --- Utility function for shuffling (added for better generation balance) ---
const shuffleArray = (array: any[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

// --- NEW: Helper function to darken a hex color for gradients ---
const darkenColor = (color: string, percent: number) => {
  if (!color.startsWith("#")) return color; // Safety check
  let [r, g, b] = (color.match(/\w\w/g) || []).map(h => parseInt(h, 16));
  const p = 1 - percent / 100;
  r = Math.floor(r * p);
  g = Math.floor(g * p);
  b = Math.floor(b * p);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).padStart(6, '0')}`;
};


export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([{ name: "", hours: "" }]);
  const [timetable, setTimetable] = useState<string[]>([]);
  const [timetableName, setTimetableName] = useState("");
  const [savedTimetables, setSavedTimetables] = useState<{id:string,name:string}[]>([]);
  const [selectedTimetableId, setSelectedTimetableId] = useState<string>("");
  const timetableRef = useRef<HTMLDivElement | null>(null);
  const [loadingSave, setLoadingSave] = useState(false);
  
  // --- NEW: State for load-in animation ---
  const [mounted, setMounted] = useState(false);

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
    setSubjects([{ name: "", hours: "" }]);
    setTimetable([]);
    setSavedTimetables([]);
    setSelectedTimetableId("");
    setTimetableName("");
  };

  const addSubject = () => setSubjects(prev => [...prev, { name: "", hours: "" }]);

  // Type-safe handler
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

  const generateTimetable = () => {
    const grid: string[] = [];
    let subjectQueue: string[] = []; // Changed to 'let' for shuffling
    
    subjects.forEach(s => {
      if (s.name && s.hours) {
        const hrs = parseInt(s.hours || "0");
        for (let i = 0; i < hrs; i++) subjectQueue.push(s.name);
      }
    });

    // Randomize the queue for a more balanced schedule
    subjectQueue = shuffleArray(subjectQueue);

    DAY_HOURS.forEach(h => {
      const namaz = NAMAZ_SLOTS.find(n => n.time === h);
      if (namaz) grid.push(`🔔 ${namaz.name} (${formatHour(h)})`);
      else grid.push(subjectQueue.shift() || "Free");
    });

    setTimetable(grid);
  };

  const saveTimetable = async () => {
    if (!user) return alert("Please sign in first!");
    if (!timetableName.trim()) return alert("Enter timetable name!");
    setLoadingSave(true);
    try {
      if (selectedTimetableId) {
        const ref = doc(db, "timetables", selectedTimetableId);
        await updateDoc(ref, { subjects, timetable, name: timetableName.trim() });
        alert("Timetable updated!");
      } else {
        await addDoc(collection(db, "timetables"), {
          uid: user.uid,
          name: timetableName.trim(),
          subjects,
          timetable,
          createdAt: new Date()
        });
        alert("Timetable saved!");
      }
      setTimetableName("");
      setSelectedTimetableId("");
      await loadAllTimetables(user.uid);
    } catch (e) {
      console.error("Save error:", e);
      alert("Failed to save. Check console.");
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
        setSubjects([{ name: "", hours: "" }]);
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

  const loadTimetable = async (id: string) => {
    try {
      const snap = await getDocs(collection(db, "timetables"));
      snap.forEach(docSnap => {
        if (docSnap.id === id) {
          const data = docSnap.data();
          setSubjects(data.subjects || [{ name: "", hours: "" }]);
          setTimetable(data.timetable || []);
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
      const canvas = await html2canvas(timetableRef.current);
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

  // --- NEW: Trigger mount animation ---
  useEffect(() => {
    setMounted(true);
  }, []);

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

      {/* MAIN - NEW: Added fade-in animation */}
      <main className={`max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {/* LEFT: Controls */}
        <section className="lg:col-span-1 bg-black/40 border border-purple-900/40 rounded-2xl p-5 space-y-5 shadow-2xl">
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
                  className="w-16 bg-transparent py-1 text-sm text-center text-[#efe7ff] focus:outline-none focus:ring-0"
                />
                {/* --- MODIFIED: Delete button style --- */}
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
              <li>Namaz slots are protected and cannot be edited.</li>
              <li>Use the dropdowns to manually fine-tune your schedule.</li>
            </ul>
          </div>
        </section>

        {/* RIGHT: Timetable & Controls */}
        <section className="lg:col-span-2 space-y-4">
          <div className="bg-black/40 border border-purple-900/40 rounded-2xl p-4 shadow-2xl">
            <h3 className="text-2xl font-extrabold mb-5 text-[#efe7ff]">🗓️ Your Daily Schedule</h3>

            <div ref={timetableRef} className="w-full">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {timetable.length === 0 ? (
                  // --- MODIFIED: Added animate-pulse to "Generate" ---
                  <div className="col-span-full text-center text-[#bfaaff] p-10 rounded-xl bg-[#0a0420]/40 border border-dashed border-[#2b173d]">
                    No timetable yet — add subjects and press <strong className="text-green-400 animate-pulse">Generate</strong>.
                  </div>
                ) : timetable.map((item, i) => {
                  const isNamaz = NAMAZ_SLOTS.some(n => item.includes(n.name));
                  const isFree = item === 'Free';
                  const bg = isNamaz ? "#06b6d4" : getColor(item);
                  
                  // --- MODIFIED: Use darkenColor helper for gradients ---
                  const darkBg = isNamaz ? "#0891b2" : isFree ? "#2b173d" : darkenColor(bg, 20);

                  // Set distinct styles for the timetable card/slot
                  const slotStyles = isNamaz 
                    ? { background: `linear-gradient(145deg, ${bg} 0%, ${darkBg} 100%)`, border: "1px solid #0891b2" } 
                    : isFree
                    ? { background: "rgba(14,6,32,0.45)", border: "1px solid #2b173d" } // Glassy for Free
                    : { background: `linear-gradient(145deg, ${bg} 0%, ${darkBg} 100%)`, border: `1px solid ${darkBg}` }; // Gradient for Subjects
                    
                  const slotClasses = "relative p-3 rounded-xl shadow-lg transition duration-200 hover:shadow-xl hover:scale-[1.01]";
                  
                  return (
                    <div
                      key={i}
                      className={slotClasses}
                      style={slotStyles}
                    >
                      {/* Time Label (moved to the top left) */}
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
                          // Invert colors for the dropdown to stand out on a colored slot
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

      {/* FOOTER */}
      <footer className="max-w-6xl mx-auto mt-8 text-center text-sm text-[#bfb0f7]">
        Made with ❤️ • StudyPlanner — Purple Galaxy
      </footer>
    </div>
  );
}