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

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([{ name: "", hours: "" }]);
  const [timetable, setTimetable] = useState<string[]>([]);
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
    if (!subject) return "#2d2d2d";
    const idx = COMMON_SUBJECTS.indexOf(subject);
    if (idx >= 0) return COLORS[idx % COLORS.length];
    const customIdx = subjects.findIndex(s => s.name === subject);
    if (customIdx >= 0) return COLORS[customIdx % COLORS.length];
    return "#6B7280";
  };

  const generateTimetable = () => {
    const grid: string[] = [];
    const subjectQueue: string[] = [];
    subjects.forEach(s => {
      if (s.name && s.hours) {
        const hrs = parseInt(s.hours || "0");
        for (let i = 0; i < hrs; i++) subjectQueue.push(s.name);
      }
    });

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b0211] via-[#0f0420] to-[#140426] text-slate-100 p-6">
      {/* NAVBAR */}
      <header className="max-w-6xl mx-auto mb-6">
        <nav className="flex items-center justify-between bg-black/30 backdrop-blur rounded-2xl p-3 border border-black/40 shadow-lg">
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
              <button onClick={login} className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#8B5CF6] to-[#C084FC] hover:opacity-95 text-sm shadow">Sign in with Google</button>
            )}
          </div>
        </nav>
      </header>

      {/* MAIN */}
      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Controls */}
        <section className="lg:col-span-1 bg-black/40 border border-black/40 rounded-2xl p-5 space-y-4">
          <h2 className="text-xl font-semibold text-[#e9ddfa]">Create Subjects</h2>
          <p className="text-sm text-[#d3c6ef]">Add subjects and hours. These are used to auto-fill your timetable.</p>

          {/* Subjects list */}
          <div className="space-y-3">
            {subjects.map((s, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="Subject"
                  value={s.name}
                  onChange={(e) => handleChange(i, "name", e.target.value)}
                  className="flex-1 bg-[#0e0620] border border-[#2b173d] px-3 py-2 rounded-lg text-sm text-[#efe7ff] placeholder:text-[#b9a9d9] focus:outline-none focus:ring-2 focus:ring-[#9b6cf0]"
                />
                <input
                  type="number"
                  placeholder="hrs"
                  min={0}
                  value={s.hours}
                  onChange={(e) => handleChange(i, "hours", e.target.value)}
                  className="w-20 bg-[#0e0620] border border-[#2b173d] px-3 py-2 rounded-lg text-sm text-center text-[#efe7ff] focus:outline-none focus:ring-2 focus:ring-[#9b6cf0]"
                />
                <button
                  onClick={() => setSubjects(prev => prev.filter((_, idx) => idx !== i))}
                  className="p-2 rounded-lg bg-[#d946ef] hover:bg-[#c026d3] transition"
                  title="Remove subject"
                >
                  🗑
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button onClick={addSubject} className="flex-1 px-4 py-2 rounded-xl bg-gradient-to-r from-[#A855F7] to-[#EC4899] shadow hover:scale-[.995] transition">+ Add Subject</button>
            <button onClick={generateTimetable} className="px-4 py-2 rounded-xl bg-[#22c55e] hover:scale-[.995] transition">Generate</button>
          </div>

          {/* Save / load */}
          <div className="pt-3 border-t border-black/30 space-y-2">
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
                className="flex-1 px-4 py-2 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#a855f7] shadow disabled:opacity-60"
                disabled={loadingSave}
              >
                {selectedTimetableId ? "Update" : "Save"}
              </button>

              <button onClick={exportToPDF} className="px-4 py-2 rounded-xl bg-[#f59e0b]">Export PDF</button>
            </div>

            {user && (
              <div className="mt-2">
                <label className="text-sm text-[#d3c6ef]">Load saved</label>
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
                    <button onClick={() => deleteTimetable(selectedTimetableId)} className="px-3 py-2 rounded-lg bg-[#ef4444] hover:bg-[#dc2626]">Delete</button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-black/30 text-xs text-[#d3c6ef] space-y-1">
            <p>Tips:</p>
            <ul className="list-disc ml-4">
              <li>Give timetable a name before saving.</li>
              <li>Click generate to auto-fill free slots.</li>
              <li>Edit any slot directly in the timetable grid.</li>
            </ul>
          </div>
        </section>

        {/* RIGHT: Timetable & Controls */}
        <section className="lg:col-span-2 space-y-4">
          <div className="bg-black/40 border border-black/40 rounded-2xl p-4">
            <h3 className="text-lg font-semibold mb-3 text-[#efe7ff]">Your Timetable</h3>

            <div ref={timetableRef} className="w-full">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {timetable.length === 0 ? (
                  <div className="col-span-full text-center text-[#bfaaff] p-6 rounded-lg bg-[#0a0420]/40 border border-dashed border-[#2b173d]">
                    No timetable yet — add subjects and press <strong>Generate</strong>.
                  </div>
                ) : timetable.map((item, i) => {
                  const isNamaz = NAMAZ_SLOTS.some(n => item.includes(n.name));
                  const bg = isNamaz ? "#06b6d4" : getColor(item);
                  return (
                    <div
                      key={i}
                      className="relative p-3 rounded-xl border border-[#23102b] shadow-[0_4px_18px_rgba(168,85,247,0.08)]"
                      style={{ background: "linear-gradient(180deg, rgba(10,4,20,0.45), rgba(5,1,10,0.25))" }}
                    >
                      {isNamaz ? (
                        <div className="p-2 rounded-lg text-center text-white font-medium" style={{ backgroundColor: bg }}>
                          {item}
                        </div>
                      ) : (
                        <select
                          value={item}
                          onChange={(e) => {
                            const newTT = [...timetable];
                            newTT[i] = e.target.value;
                            setTimetable(newTT);
                          }}
                          className="w-full bg-[#080216] text-[#efe7ff] px-3 py-2 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-[#9b6cf0]"
                        >
                          <option value="Free">Free</option>
                          {COMMON_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                          {subjects.filter(s => s.name.trim() !== "").map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                        </select>
                      )}

                      <div className="mt-2 text-xs text-[#cfc0f8]">
                        <span>Slot {i + 1} • {DAY_HOURS[i] !== undefined ? formatHour(DAY_HOURS[i]) : ""}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick legend / colors */}
          <div className="bg-black/40 border border-black/40 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex gap-3 flex-wrap">
              {COMMON_SUBJECTS.slice(0,7).map((s,idx) => (
                <div key={s} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <div className="text-[#efe7ff]">{s}</div>
                </div>
              ))}
            </div>

            <div className="text-sm text-[#d3c6ef]">
              Namaz slots are protected and highlighted.
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
