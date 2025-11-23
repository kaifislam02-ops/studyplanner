// lib/parentalControls.ts
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  updateDoc,
  Timestamp,
  addDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import type { ParentalAccount, ParentalControls, StudySession } from '@/types/parental';

// ==================== AGE VERIFICATION ====================

export async function saveAgeVerification(
  userId: string, 
  birthDate: string, 
  age: number,
  isMinor: boolean
) {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    birthDate,
    age,
    isMinor,
    ageVerifiedAt: new Date().toISOString(),
  });
}

export async function getAgeVerification(userId: string) {
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) return null;
  
  const data = userDoc.data();
  return {
    birthDate: data.birthDate,
    age: data.age,
    isMinor: data.isMinor,
    ageVerifiedAt: data.ageVerifiedAt,
  };
}

// ==================== PARENTAL ACCOUNTS ====================

export async function createParentalAccount(
  studentId: string,
  parentEmail: string,
  parentName: string
): Promise<string> {
  const parentalAccountRef = await addDoc(collection(db, 'parentalAccounts'), {
    parentEmail,
    parentName,
    studentId,
    verificationStatus: 'pending',
    verificationToken: generateVerificationToken(),
    createdAt: new Date().toISOString(),
  });

  // Update student's user document
  await updateDoc(doc(db, 'users', studentId), {
    parentalAccountId: parentalAccountRef.id,
    parentEmail,
  });

  // Send verification email (implement this)
  await sendParentVerificationEmail(parentEmail, parentName, parentalAccountRef.id);

  return parentalAccountRef.id;
}

export async function getParentalAccount(studentId: string): Promise<ParentalAccount | null> {
  const q = query(
    collection(db, 'parentalAccounts'),
    where('studentId', '==', studentId)
  );
  
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) return null;
  
  const doc = querySnapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data(),
  } as ParentalAccount;
}

export async function verifyParentalAccount(accountId: string, token: string): Promise<boolean> {
  const accountRef = doc(db, 'parentalAccounts', accountId);
  const accountDoc = await getDoc(accountRef);
  
  if (!accountDoc.exists()) return false;
  
  const data = accountDoc.data();
  
  if (data.verificationToken !== token) return false;
  
  await updateDoc(accountRef, {
    verificationStatus: 'verified',
    verifiedAt: new Date().toISOString(),
  });
  
  return true;
}

// ==================== PARENTAL CONTROLS ====================

export async function createDefaultParentalControls(
  studentId: string,
  parentId: string
): Promise<void> {
  const controlsRef = doc(db, 'parentalControls', studentId);
  
  const defaultControls: Omit<ParentalControls, 'id'> = {
    studentId,
    parentId,
    maxDailyHours: 8,
    mandatoryBreakMinutes: 60,
    blockedHours: [],
    enforcePomodoroTimer: false,
    requireApprovalForDelete: true,
    lockSettings: false,
    weeklyReportEnabled: true,
    notifyOnLogin: true,
    notifyOnMilestone: true,
    notifyOnLongSession: true,
    weeklyGoalHours: 30,
    monthlyGoalHours: 120,
    updatedAt: new Date().toISOString(),
  };
  
  await setDoc(controlsRef, defaultControls);
}

export async function getParentalControls(studentId: string): Promise<ParentalControls | null> {
  const controlsRef = doc(db, 'parentalControls', studentId);
  const controlsDoc = await getDoc(controlsRef);
  
  if (!controlsDoc.exists()) return null;
  
  return {
    id: controlsDoc.id,
    ...controlsDoc.data(),
  } as ParentalControls;
}

export async function updateParentalControls(
  studentId: string,
  updates: Partial<ParentalControls>
): Promise<void> {
  const controlsRef = doc(db, 'parentalControls', studentId);
  await updateDoc(controlsRef, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

// ==================== STUDY SESSIONS ====================

export async function startStudySession(studentId: string): Promise<string> {
  const sessionRef = await addDoc(collection(db, 'studySessions'), {
    studentId,
    startTime: new Date().toISOString(),
    tasksCompleted: 0,
    subjects: [],
    breaksTaken: 0,
  });
  
  return sessionRef.id;
}

export async function endStudySession(
  sessionId: string,
  tasksCompleted: number,
  subjects: string[]
): Promise<void> {
  const sessionRef = doc(db, 'studySessions', sessionId);
  const sessionDoc = await getDoc(sessionRef);
  
  if (!sessionDoc.exists()) return;
  
  const startTime = new Date(sessionDoc.data().startTime);
  const endTime = new Date();
  const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000 / 60); // minutes
  
  await updateDoc(sessionRef, {
    endTime: endTime.toISOString(),
    duration,
    tasksCompleted,
    subjects,
  });
  
  // Check if this was a long session and notify parent
  const controls = await getParentalControls(sessionDoc.data().studentId);
  if (controls?.notifyOnLongSession && duration > 120) {
    await notifyParentLongSession(sessionDoc.data().studentId, duration);
  }
}

export async function getRecentStudySessions(
  studentId: string,
  limit: number = 10
): Promise<StudySession[]> {
  const q = query(
    collection(db, 'studySessions'),
    where('studentId', '==', studentId),
    // orderBy('startTime', 'desc'), // Uncomment after creating index
    // limit(limit)
  );
  
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as StudySession[];
}

// ==================== WEEKLY REPORTS ====================

export async function generateWeeklyReport(studentId: string, parentId: string) {
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  
  const sessions = await getRecentStudySessions(studentId, 100);
  const weekSessions = sessions.filter(s => new Date(s.startTime) >= weekStart);
  
  const totalStudyHours = weekSessions.reduce((sum, s) => sum + (s.duration || 0), 0) / 60;
  const tasksCompleted = weekSessions.reduce((sum, s) => sum + s.tasksCompleted, 0);
  const averageDailyHours = totalStudyHours / 7;
  const longestSession = Math.max(...weekSessions.map(s => s.duration || 0)) / 60;
  
  // Count subjects
  const subjectCount: { [key: string]: number } = {};
  weekSessions.forEach(s => {
    s.subjects.forEach(subject => {
      subjectCount[subject] = (subjectCount[subject] || 0) + 1;
    });
  });
  const mostStudiedSubject = Object.keys(subjectCount).reduce((a, b) => 
    subjectCount[a] > subjectCount[b] ? a : b, ''
  );
  
  const report = {
    studentId,
    parentId,
    weekStartDate: weekStart.toISOString(),
    weekEndDate: new Date().toISOString(),
    totalStudyHours: Math.round(totalStudyHours * 10) / 10,
    tasksCompleted,
    averageDailyHours: Math.round(averageDailyHours * 10) / 10,
    longestSession: Math.round(longestSession * 10) / 10,
    mostStudiedSubject,
    completionRate: 85, // Calculate based on actual task data
    missedDays: 0,
    longSessionsCount: weekSessions.filter(s => (s.duration || 0) > 180).length,
    lateNightStudy: 0, // Calculate sessions after 10 PM
    generatedAt: new Date().toISOString(),
  };
  
  await addDoc(collection(db, 'weeklyReports'), report);
  
  // Send email to parent
  await sendWeeklyReportEmail(parentId, report);
  
  return report;
}

// ==================== HELPER FUNCTIONS ====================

function generateVerificationToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

async function sendParentVerificationEmail(
  email: string, 
  name: string, 
  accountId: string
): Promise<void> {
  // TODO: Implement email sending
  // Use SendGrid, AWS SES, or Firebase Functions
  console.log(`Verification email would be sent to ${email}`);
  console.log(`Verification link: ${process.env.NEXT_PUBLIC_APP_URL}/verify-parent/${accountId}`);
}

async function notifyParentLongSession(studentId: string, duration: number): Promise<void> {
  // TODO: Implement notification
  console.log(`Parent notified: Student studied for ${duration} minutes`);
}

async function sendWeeklyReportEmail(parentId: string, report: any): Promise<void> {
  // TODO: Implement email sending
  console.log(`Weekly report sent to parent ${parentId}`, report);
}

// ==================== VALIDATION FUNCTIONS ====================

export async function checkDailyStudyLimit(studentId: string): Promise<boolean> {
  const controls = await getParentalControls(studentId);
  if (!controls) return true; // No controls = no limits
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const sessions = await getRecentStudySessions(studentId, 50);
  const todaySessions = sessions.filter(s => {
    const sessionDate = new Date(s.startTime);
    sessionDate.setHours(0, 0, 0, 0);
    return sessionDate.getTime() === today.getTime();
  });
  
  const totalMinutesToday = todaySessions.reduce((sum, s) => sum + (s.duration || 0), 0);
  const totalHoursToday = totalMinutesToday / 60;
  
  return totalHoursToday < controls.maxDailyHours;
}

export async function isWithinAllowedHours(studentId: string): Promise<boolean> {
  const controls = await getParentalControls(studentId);
  if (!controls || !controls.blockedHours || controls.blockedHours.length === 0) return true;
  
  const currentHour = new Date().getHours();
  
  return !controls.blockedHours.some(
    block => currentHour >= block.start && currentHour < block.end
  );
}