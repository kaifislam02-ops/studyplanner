"use client";

import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import Timeline from "@/components/Timeline";
import WeekView from "@/components/WeekView";
import Analytics from "@/components/Analytics";
import TaskModal from "@/components/TaskModal";
import PomodoroTimer from "@/components/PomodoroTimer";
import TemplateModal from "@/components/TemplateModal";
import SignInModal from "@/components/SignInModal";
import ProfilePage from "@/components/ProfilePage";
import SettingsPage from "@/components/SettingsPage";
import SoundSettings from "@/components/SoundSettings";
import AlarmSettings from "@/components/AlarmSettings";
import AgeVerificationModal from "@/components/AgeVerificationModal";
import ParentalDashboard from "@/components/ParentalDashboard";

export type Subject = {
  id: string;
  name: string;
  color: string;
  weeklyHours: number;
  priority: number; // 1-3
};

export type Task = {
  id: string;
  title: string;
  subjectId: string;
  date: string;
  startTime: number;
  endTime: number;
  completed: boolean;
  notes?: string;
  isRecurring?: boolean;
  recurringDays?: number[]; // 0-6 (Sun-Sat)
};

export type Template = {
  id: string;
  name: string;
  tasks: Omit<Task, "id" | "date">[];
};

const PRAYER_TIMES = [
  { name: "Fajr", time: 5 },
  { name: "Dhuhr", time: 13 },
  { name: "Asr", time: 16 },
  { name: "Maghrib", time: 18 },
  { name: "Isha", time: 20 },
];

export default function HomePage() {
  // Auth hook
  const {
    user,
    loading: authLoading,
    signInWithGoogle,
    signInWithGithub,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    updateUserProfile,
    updateUserPreferences,
  } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [view, setView] = useState<"day" | "week" | "analytics">("day");
  const [prayerEnabled, setPrayerEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  
  // Modal states
  const [signInModalOpen, setSignInModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [soundSettingsOpen, setSoundSettingsOpen] = useState(false);
  const [alarmSettingsOpen, setAlarmSettingsOpen] = useState(false);
  const [ageVerificationOpen, setAgeVerificationOpen] = useState(false);
  const [parentalDashboardOpen, setParentalDashboardOpen] = useState(false);
  
  const [subjects, setSubjects] = useState<Subject[]>([
    { id: "1", name: "Mathematics", color: "#3B82F6", weeklyHours: 10, priority: 3 },
    { id: "2", name: "Physics", color: "#8B5CF6", weeklyHours: 8, priority: 3 },
    { id: "3", name: "Chemistry", color: "#EC4899", weeklyHours: 6, priority: 2 },
  ]);
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [modalOpen, setModalOpen] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [pomodoroOpen, setPomodoroOpen] = useState(false);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("studyflow-data");
    if (saved) {
      const data = JSON.parse(saved);
      if (data.subjects) setSubjects(data.subjects);
      if (data.tasks) setTasks(data.tasks);
      if (data.templates) setTemplates(data.templates);
      if (data.prayerEnabled !== undefined) setPrayerEnabled(data.prayerEnabled);
    }

    // Load user preferences
    if (user?.preferences) {
      setDarkMode(user.preferences.darkMode);
      setPrayerEnabled(user.preferences.prayerEnabled);
    }
  }, [user]);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("studyflow-data", JSON.stringify({
      subjects,
      tasks,
      templates,
      prayerEnabled,
    }));
  }, [subjects, tasks, templates, prayerEnabled]);

  // Get tasks for selected date (including recurring)
  const todaysTasks = useMemo(() => {
    const dayOfWeek = new Date(selectedDate + 'T00:00:00').getDay();
    return tasks.filter(task => {
      if (task.date === selectedDate) return true;
      if (task.isRecurring && task.recurringDays?.includes(dayOfWeek)) return true;
      return false;
    });
  }, [tasks, selectedDate]);

  // Calculate comprehensive stats
  const stats = useMemo(() => {
    const today = todaysTasks;
    const completed = today.filter(t => t.completed).length;
    const total = today.length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Weekly stats
    const startOfWeek = getStartOfWeek(new Date());
    const weekTasks = tasks.filter(task => {
      const taskDate = new Date(task.date + 'T00:00:00');
      return taskDate >= startOfWeek && taskDate < new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000);
    });
    
    const weeklyHours = weekTasks.reduce((sum, task) => {
      return sum + (task.completed ? task.endTime - task.startTime : 0);
    }, 0);

    // Streak calculation
    let streak = 0;
    let checkDate = new Date();
    checkDate.setDate(checkDate.getDate() - 1);
    
    while (streak < 30) {
      const dateStr = checkDate.toISOString().split('T')[0];
      const dayTasks = tasks.filter(t => t.date === dateStr);
      const dayCompleted = dayTasks.filter(t => t.completed).length;
      
      if (dayTasks.length === 0 || dayCompleted === 0) break;
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    // Subject breakdown
    const subjectHours: { [key: string]: number } = {};
    weekTasks.forEach(task => {
      if (task.completed) {
        const hours = task.endTime - task.startTime;
        subjectHours[task.subjectId] = (subjectHours[task.subjectId] || 0) + hours;
      }
    });

    return {
      completionRate,
      weeklyHours,
      streak,
      totalTasks: total,
      completedTasks: completed,
      subjectHours,
    };
  }, [todaysTasks, tasks]);

  // Auto-generate schedule
  const generateSchedule = () => {
    if (subjects.length === 0) {
      alert("Add subjects first!");
      return;
    }

    const newTasks: Task[] = [];
    const startDate = new Date(selectedDate + 'T00:00:00');
    
    // Generate for 7 days
    for (let day = 0; day < 7; day++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + day);
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayOfWeek = currentDate.getDay();

      // Available hours (excluding prayers)
      const availableSlots: number[] = [];
      for (let hour = 6; hour < 23; hour++) {
        const isPrayer = prayerEnabled && PRAYER_TIMES.some(p => p.time === hour);
        if (!isPrayer) availableSlots.push(hour);
      }

      // Distribute subjects by priority
      const sortedSubjects = [...subjects].sort((a, b) => b.priority - a.priority);
      let slotIndex = 0;

      sortedSubjects.forEach(subject => {
        const hoursPerDay = Math.ceil(subject.weeklyHours / 7);
        
        for (let h = 0; h < hoursPerDay && slotIndex < availableSlots.length; h++) {
          const startTime = availableSlots[slotIndex];
          const endTime = Math.min(startTime + 2, 23); // Max 2-hour blocks

          newTasks.push({
            id: `gen-${Date.now()}-${slotIndex}`,
            title: `${subject.name} Study`,
            subjectId: subject.id,
            date: dateStr,
            startTime,
            endTime,
            completed: false,
          });

          slotIndex++;
        }
      });
    }

    setTasks([...tasks, ...newTasks]);
    alert(`Generated ${newTasks.length} tasks for the week!`);
  };

  // Template handlers
  const saveAsTemplate = () => {
    const templateTasks = todaysTasks.map(({ id, date, ...rest }) => rest);
    const name = prompt("Template name:");
    if (name) {
      setTemplates([...templates, {
        id: Date.now().toString(),
        name,
        tasks: templateTasks,
      }]);
      alert("Template saved!");
    }
  };

  const applyTemplate = (template: Template) => {
    const newTasks = template.tasks.map(task => ({
      ...task,
      id: `tmpl-${Date.now()}-${Math.random()}`,
      date: selectedDate,
    }));
    setTasks([...tasks, ...newTasks]);
    setTemplateModalOpen(false);
    alert(`Applied template: ${template.name}`);
  };

  // Export schedule
  const exportSchedule = () => {
    const data = {
      subjects,
      tasks,
      exportDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `studyflow-schedule-${selectedDate}.json`;
    a.click();
  };

  // Task handlers
  const handleAddTask = () => {
    setEditingTask(null);
    setModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setModalOpen(true);
  };

  const handleSaveTask = (taskData: Omit<Task, "id">) => {
    if (editingTask) {
      setTasks(tasks.map(t => t.id === editingTask.id ? { ...taskData, id: t.id } : t));
    } else {
      setTasks([...tasks, { ...taskData, id: Date.now().toString() }]);
    }
    setModalOpen(false);
  };

  const handleDeleteTask = (taskId: string) => {
    if (confirm("Delete this task?")) {
      setTasks(tasks.filter(t => t.id !== taskId));
    }
  };

  const handleToggleComplete = (taskId: string) => {
    setTasks(tasks.map(t => 
      t.id === taskId ? { ...t, completed: !t.completed } : t
    ));
  };

  const handleAddSubject = (subject: Omit<Subject, "id">) => {
    setSubjects([...subjects, { ...subject, id: Date.now().toString() }]);
  };

  const handleDeleteSubject = (subjectId: string) => {
    if (confirm("Delete this subject and all its tasks?")) {
      setSubjects(subjects.filter(s => s.id !== subjectId));
      setTasks(tasks.filter(t => t.subjectId !== subjectId));
    }
  };

  // Handle opening alarm settings from sound settings
  const handleOpenAlarms = () => {
    setSoundSettingsOpen(false);
    setAlarmSettingsOpen(true);
  };

  return (
    <div className={`flex h-screen ${darkMode ? 'bg-[#0A0E1A]' : 'bg-gray-50'} ${darkMode ? 'text-white' : 'text-gray-900'} overflow-hidden`}>
      {/* Sidebar */}
      <Sidebar
        open={sidebarOpen}
        subjects={subjects}
        stats={stats}
        selectedDate={selectedDate}
        templates={templates}
        darkMode={darkMode}
        onDateChange={setSelectedDate}
        onAddSubject={handleAddSubject}
        onDeleteSubject={handleDeleteSubject}
        onOpenTemplates={() => setTemplateModalOpen(true)}
        onOpenPomodoro={() => setPomodoroOpen(true)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          selectedDate={selectedDate}
          tasksCount={todaysTasks.length}
          totalHours={todaysTasks.reduce((sum, t) => sum + (t.endTime - t.startTime), 0)}
          view={view}
          darkMode={darkMode}
          userName={user?.displayName || undefined}
          userEmail={user?.email || undefined}
          onAddTask={handleAddTask}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onViewChange={setView}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
          onGenerateSchedule={generateSchedule}
          onSaveTemplate={saveAsTemplate}
          onExport={exportSchedule}
          onTogglePrayer={() => setPrayerEnabled(!prayerEnabled)}
          prayerEnabled={prayerEnabled}
          onSignIn={() => setSignInModalOpen(true)}
          onSignOut={signOut}
          onOpenProfile={() => setProfileModalOpen(true)}
          onOpenSettings={() => setSettingsModalOpen(true)}
          onOpenSoundSettings={() => setSoundSettingsOpen(true)}
        />

        <main className={`flex-1 overflow-y-auto p-6 ${darkMode ? 'bg-[#0A0E1A]' : 'bg-gray-50'}`}>
          {view === "day" && (
            <Timeline
              tasks={todaysTasks}
              subjects={subjects}
              prayerTimes={prayerEnabled ? PRAYER_TIMES : []}
              darkMode={darkMode}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
              onToggleComplete={handleToggleComplete}
            />
          )}

          {view === "week" && (
            <WeekView
              tasks={tasks}
              subjects={subjects}
              selectedDate={selectedDate}
              prayerTimes={prayerEnabled ? PRAYER_TIMES : []}
              darkMode={darkMode}
              onDateChange={setSelectedDate}
              onEditTask={handleEditTask}
            />
          )}

          {view === "analytics" && (
            <Analytics
              tasks={tasks}
              subjects={subjects}
              stats={stats}
              darkMode={darkMode}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      {signInModalOpen && (
        <SignInModal
          darkMode={darkMode}
          onClose={() => setSignInModalOpen(false)}
          onGoogleSignIn={signInWithGoogle}
          onGithubSignIn={signInWithGithub}
          onEmailSignIn={signInWithEmail}
          onEmailSignUp={signUpWithEmail}
        />
      )}

      {profileModalOpen && user && (
        <ProfilePage
          user={user}
          darkMode={darkMode}
          onClose={() => setProfileModalOpen(false)}
          onUpdateProfile={updateUserProfile}
        />
      )}

      {settingsModalOpen && user && (
        <SettingsPage
          user={user}
          darkMode={darkMode}
          prayerEnabled={prayerEnabled}
          onClose={() => setSettingsModalOpen(false)}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
          onTogglePrayer={() => setPrayerEnabled(!prayerEnabled)}
          onUpdatePreferences={updateUserPreferences}
        />
      )}

      {soundSettingsOpen && (
        <SoundSettings
          darkMode={darkMode}
          onClose={() => setSoundSettingsOpen(false)}
          onOpenAlarms={handleOpenAlarms}
        />
      )}

      {alarmSettingsOpen && (
        <AlarmSettings
          darkMode={darkMode}
          onClose={() => setAlarmSettingsOpen(false)}
        />
      )}

      {modalOpen && (
        <TaskModal
          task={editingTask}
          subjects={subjects}
          selectedDate={selectedDate}
          darkMode={darkMode}
          onSave={handleSaveTask}
          onClose={() => setModalOpen(false)}
        />
      )}

      {templateModalOpen && (
        <TemplateModal
          templates={templates}
          darkMode={darkMode}
          onApply={applyTemplate}
          onDelete={(id) => setTemplates(templates.filter(t => t.id !== id))}
          onClose={() => setTemplateModalOpen(false)}
        />
      )}

      {pomodoroOpen && (
        <PomodoroTimer
          darkMode={darkMode}
          onClose={() => setPomodoroOpen(false)}
        />
      )}
    </div>
  );
}

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
}