// lib/firebase.ts
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.AIzaSyCltoMxKACnSksAI3Pk_Dl87sK_s6Vs3GM,
  authDomain: process.env.studyplanner-f5de6.firebaseapp.com,
  projectId: process.env.studyplanner-f5de6,
  storageBucket: process.env.studyplanner-f5de6.firebasestorage.app,
  messagingSenderId: process.env.283699367756,
  appId: process.env.1:283699367756:web:8f1e0869274cbd5f47c9e9,
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Auth providers
export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();

export default app;