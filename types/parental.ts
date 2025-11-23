// src/types/parental.ts

export type ParentalAccount = {
  id: string;
  parentEmail: string;
  parentName: string;
  studentId: string;
  studentName: string;
  verified: boolean;
  createdAt: string; // ISO string
  verificationToken?: string;
};

export type BlockedHour = {
  start: number; // Hour (0-23)
  end: number; // Hour (0-23)
};

export type ParentalControls = {
  id?: string;
  studentId: string;
  parentId: string;
  maxDailyHours: number;
  mandatoryBreakMinutes: number;
  blockedHours?: BlockedHour[]; // Array of blocked time ranges
  enforcePomodoroTimer: boolean;
  requireApprovalForDelete: boolean;
  lockSettings: boolean;
  notifyOnLogin: boolean;
  weeklyReportEnabled: boolean;
  notifyOnMilestone: boolean;
  notifyOnLongSession: boolean;
  weeklyGoalHours?: number;
  monthlyGoalHours?: number;
  bedtimeHour?: number; // Hour (0-23) when studying should stop
  allowLateNightStudy?: boolean;
  createdAt?: string; // ISO string
  updatedAt?: string; // ISO string
};

export type StudySession = {
  id: string;
  studentId?: string; // Optional user ID
  startTime: string; // ISO string
  duration: number; // in minutes
  tasksCompleted: number;
  subjects: string[];
  endTime?: string; // Optional ISO string
  notes?: string; // Optional session notes
  breaksTaken?: number; // Number of breaks taken during session
  pomodorosCompleted?: number; // Number of pomodoro cycles completed
};