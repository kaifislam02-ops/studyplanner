// types/parental.ts

export type UserRole = 'student' | 'parent' | 'guardian';

export type ParentalAccount = {
  id: string;
  parentEmail: string;
  parentName: string;
  studentId: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verificationToken?: string;
  verifiedAt?: string;
  createdAt: string;
};

export type ParentalControls = {
  id: string;
  studentId: string;
  parentId: string;
  
  // Time controls
  maxDailyHours: number; // Max study hours per day
  mandatoryBreakMinutes: number; // Break after X minutes
  blockedHours: { start: number; end: number }[]; // Block app during these hours
  enforcePomodoroTimer: boolean;
  
  // Content controls
  requireApprovalForDelete: boolean;
  lockSettings: boolean;
  weeklyReportEnabled: boolean;
  
  // Notifications
  notifyOnLogin: boolean;
  notifyOnMilestone: boolean;
  notifyOnLongSession: boolean; // Alert if studying too long
  
  // Goals
  weeklyGoalHours: number;
  monthlyGoalHours: number;
  
  updatedAt: string;
};

export type StudySession = {
  id: string;
  studentId: string;
  startTime: string;
  endTime?: string;
  duration?: number; // minutes
  tasksCompleted: number;
  subjects: string[];
  breaksTaken: number;
};

export type ParentalReport = {
  id: string;
  studentId: string;
  parentId: string;
  weekStartDate: string;
  weekEndDate: string;
  
  // Metrics
  totalStudyHours: number;
  tasksCompleted: number;
  averageDailyHours: number;
  longestSession: number;
  mostStudiedSubject: string;
  completionRate: number; // percentage
  
  // Concerns
  missedDays: number;
  longSessionsCount: number; // Sessions over 3 hours without break
  lateNightStudy: number; // Study sessions after 10 PM
  
  generatedAt: string;
};

export type AgeVerification = {
  birthDate: string;
  age: number;
  isMinor: boolean;
  requiresParentalConsent: boolean;
  consentGiven: boolean;
  consentDate?: string;
};