// firebaseConfig.ts
import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCltoMxKACnSksAI3Pk_Dl87sK_s6Vs3GM",
  authDomain: "studyplanner-f5de6.firebaseapp.com",
  projectId: "studyplanner-f5de6",
  storageBucket: "studyplanner-f5de6.appspot.com", // fixed typo here
  messagingSenderId: "283699367756",
  appId: "1:283699367756:web:8f1e0869274cbd5f47c9e9",
  measurementId: "G-CGB4GHB5MM"
};

// Initialize Firebase only once
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// Export Firestore and Auth for use in your pages
export const db = getFirestore(app);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
