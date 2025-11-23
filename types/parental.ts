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

export type ParentalControls = {
  id?: string;
  studentId: string;
  parentId: string;
  maxDailyHours: number;
  mandatoryBreakMinutes: number;
  enforcePomodoroTimer: boolean;
  requireApprovalForDelete: boolean;
  lockSettings: boolean;
  notifyOnLogin: boolean;
  weeklyReportEnabled: boolean;
  notifyOnLongSession: boolean;
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