// hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { 
  User,
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, googleProvider, githubProvider, db } from '@/lib/firebase';

export type UserData = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt?: string;
  preferences?: {
    darkMode: boolean;
    prayerEnabled: boolean;
    weekStartsOn: number;
    defaultTaskDuration: number;
  };
};

export function useAuth() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Get user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        const userData = userDoc.data();

        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          ...userData,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await createUserDocument(result.user);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const signInWithGithub = async () => {
    try {
      const result = await signInWithPopup(auth, githubProvider);
      await createUserDocument(result.user);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName });
      await createUserDocument(result.user);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const updateUserProfile = async (data: { displayName?: string; photoURL?: string }) => {
    if (!auth.currentUser) return { success: false, error: 'No user logged in' };

    try {
      await updateProfile(auth.currentUser, data);
      await setDoc(doc(db, 'users', auth.currentUser.uid), data, { merge: true });
      
      setUser(prev => prev ? { ...prev, ...data } : null);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const updateUserPreferences = async (preferences: Partial<UserData['preferences']>) => {
    if (!user) return { success: false, error: 'No user logged in' };

    try {
      await setDoc(doc(db, 'users', user.uid), { preferences }, { merge: true });
      setUser(prev => prev ? { 
        ...prev, 
        preferences: { ...prev.preferences, ...preferences } as any 
      } : null);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const createUserDocument = async (firebaseUser: User) => {
    const userRef = doc(db, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      await setDoc(userRef, {
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        createdAt: new Date().toISOString(),
        preferences: {
          darkMode: true,
          prayerEnabled: true,
          weekStartsOn: 0,
          defaultTaskDuration: 1,
        },
      });
    }
  };

  return {
    user,
    loading,
    signInWithGoogle,
    signInWithGithub,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    updateUserProfile,
    updateUserPreferences,
  };
}