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
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

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

// Colors for subjects
const COLORS = ["#F87171","#34D399","#60A5FA","#FBBF24","#A78BFA","#F472B6","#FCD34D"];

// Type for subject
type Subject = { name: string; hours: string };

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([{ name: "", hours: "" }]);
  const [timetable, setTimetable] = useState<string[]>([]);
  const [timetableName, setTimetableName] = useState("");
  const [savedTimetables, setSavedTimetables] = useState<{id:string,name:string}[]>([]);
  const [selectedTimetableId, setSelectedTimetableId] = useState<string>("");
  const timetableRef = useRef<HTMLDivElement>(null);

  // Google Sign-In
  const login = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
      loadAllTimetables(result.user.uid);
    } catch (e) { console.error(e); alert("Sign-In failed"); }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null); 
    setSubjects([{ name: "", hours: "" }]); 
    setTimetable([]);
    setSavedTimetables([]);
    setSelectedTimetableId(""); 
    setTimetableName("");
  };

  const addSubject = () => setSubjects([...subjects, { name: "", hours: "" }]);
  
  // FIXED handleChange: use keyof Subject for type safety
  const handleChange = (i: number, field: keyof Subject, value: string) => {
    const newSubjects = [...subjects];
    newSubjects[i][field] = value;
    setSubjects(newSubjects);
  };

  const formatHour = (h:number) => { const ampm=h>=12?"PM":"AM"; const hour=h%12===0?12:h%12; return `${hour} ${ampm}`; };
  const getColor = (subject:string) => { const index = subjects.findIndex(s=>s.name===subject); return COLORS[index%COLORS.length]||"#9CA3AF"; };

  const generateTimetable = () => {
    const grid: string[] = [];
    let subjectQueue: string[] = [];
    subjects.forEach(s=>{ if(s.name && s.hours){ for(let i=0;i<parseInt(s.hours);i++) subjectQueue.push(s.name); } });
    DAY_HOURS.forEach(h=>{
      const namaz = NAMAZ_SLOTS.find(n=>n.time===h);
      grid.push(namaz ? `🔔 ${namaz.name} (${formatHour(h)})` : (subjectQueue.shift() || "Free"));
    });
    setTimetable(grid);
  };

  const saveTimetable = async () => {
    if(!user) return alert("Sign in first!");
    if(!timetableName.trim()) return alert("Enter timetable name!");
    try {
      if(selectedTimetableId){
        const ref = doc(db,"timetables",selectedTimetableId);
        await updateDoc(ref,{subjects,timetable,name:timetableName.trim()});
        alert("Timetable updated!");
      } else {
        await addDoc(collection(db,"timetables"),{
          uid:user.uid, name:timetableName.trim(), subjects, timetable, createdAt:new Date()
        });
        alert("Timetable saved!");
      }
      setTimetableName(""); 
      setSelectedTimetableId("");
      loadAllTimetables(user.uid);
    } catch(e){ console.error(e); }
  };

  const deleteTimetable = async (id:string) => {
    if(!user) return;
    const confirmDelete = confirm("Are you sure you want to delete this timetable?");
    if(confirmDelete){
      await deleteDoc(doc(db,"timetables",id));
      if(selectedTimetableId===id){ 
        setSelectedTimetableId(""); 
        setTimetable([]); 
        setSubjects([{name:"",hours:""}]); 
        setTimetableName(""); 
      }
      loadAllTimetables(user.uid);
    }
  };

  const loadAllTimetables = async (uid:string) => {
    try{
      const q = query(collection(db,"timetables"), where("uid","==",uid));
      const snapshot = await getDocs(q);
      const list:{id:string,name:string}[] = [];
      snapshot.forEach(docSnap=>list.push({id:docSnap.id, name:docSnap.data().name||"Unnamed"}));
      setSavedTimetables(list);
    } catch(e){ console.error(e); }
  };

  const loadTimetable = async (id:string) => {
    try{
      const snapshot = await getDocs(collection(db,"timetables"));
      snapshot.forEach(docSnap=>{
        if(docSnap.id===id){
          const data = docSnap.data();
          setSubjects(data.subjects);
          setTimetable(data.timetable);
          setTimetableName(data.name || "");
          setSelectedTimetableId(id);
        }
      });
    } catch(e){ console.error(e); }
  };

  const exportToPDF = async () => {
    if(!timetableRef.current) return;
    const canvas = await html2canvas(timetableRef.current);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p","mm","a4");
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData,"PNG",0,0,pdfWidth,pdfHeight);
    pdf.save(`${timetableName || "timetable"}.pdf`);
  };

  useEffect(()=>{
    if(auth.currentUser){ 
      setUser(auth.currentUser); 
      loadAllTimetables(auth.currentUser.uid); 
    }
  },[]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center p-6">
      <h1 className="text-4xl font-bold text-blue-400 mb-6">StudyPlanner 🎉</h1>

      {user ? (
        <div className="mb-4 flex items-center gap-2">
          <span>Signed in as: {user.displayName}</span>
          <button onClick={logout} className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded">Sign Out</button>
        </div>
      ) : (
        <button onClick={login} className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded mb-4">Sign In with Google</button>
      )}

      {user && (
        <div className="flex flex-col gap-2 mb-4">
          <input 
            type="text" 
            placeholder="Timetable name" 
            value={timetableName} 
            onChange={e=>setTimetableName(e.target.value)} 
            className="p-2 rounded bg-gray-800 text-white w-64" 
          />

          <div className="flex gap-2">
            <select 
              value={selectedTimetableId} 
              onChange={e=>{ if(e.target.value) loadTimetable(e.target.value); }} 
              className="p-2 rounded bg-gray-800 text-white w-64"
            >
              <option value="">-- Load saved timetable --</option>
              {savedTimetables.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            {selectedTimetableId && <button onClick={()=>deleteTimetable(selectedTimetableId)} className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded">Delete</button>}
          </div>
        </div>
      )}

      {subjects.map((s,i)=>(
        <div key={i} className="flex gap-2 mb-2 items-center">
          <input type="text" placeholder="Subject" value={s.name} onChange={e=>handleChange(i,"name",e.target.value as string)} className="p-2 rounded text-white placeholder-gray-400 bg-gray-800" />
          <input type="number" placeholder="Hours" value={s.hours} onChange={e=>handleChange(i,"hours",e.target.value as string)} className="p-2 rounded text-white placeholder-gray-400 w-20 bg-gray-800" />
          <button onClick={()=>setSubjects(subjects.filter((_,idx)=>idx!==i))} className="bg-red-500 px-2 py-1 rounded">🗑</button>
        </div>
      ))}

      <div className="flex gap-2 mb-4">
        <button onClick={addSubject} className="bg-blue-500 px-4 py-2 rounded hover:bg-blue-600">+ Add Subject</button>
        <button onClick={generateTimetable} className="bg-green-500 px-4 py-2 rounded hover:bg-green-600">Generate Timetable</button>
        {user && <button onClick={saveTimetable} className="bg-purple-500 px-4 py-2 rounded hover:bg-purple-600">{selectedTimetableId?"Update Timetable":"Save Timetable"}</button>}
        {user && timetable.length>0 && <button onClick={exportToPDF} className="bg-yellow-500 px-4 py-2 rounded hover:bg-yellow-600">Export PDF</button>}
      </div>

      <div ref={timetableRef} className="mt-6 w-full max-w-3xl grid grid-cols-3 gap-2">
        {timetable.map((item,i)=>{
          const isNamaz = NAMAZ_SLOTS.some(n=>item.includes(n.name));
          const bgColor = isNamaz ? "#3B82F6" : getColor(item);
          return (
            <div key={i} className="relative">
              {isNamaz ? (
                <div className="p-2 rounded text-center cursor-not-allowed text-white" style={{backgroundColor:bgColor}}>{item}</div>
              ) : (
                <select value={item} onChange={e=>{ const newTT=[...timetable]; newTT[i]=e.target.value; setTimetable(newTT); }} className="p-2 rounded text-center w-full bg-gray-800 text-white hover:bg-gray-700 transition">
                  <option value="Free">Free</option>
                  {COMMON_SUBJECTS.map(s=><option key={s} value={s}>{s}</option>)}
                  {subjects.filter(s=>s.name.trim()!=="").map(s=><option key={s.name} value={s.name}>{s.name}</option>)}
                </select>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
