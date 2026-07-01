import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Config from firebase-applet-config.json
const firebaseConfig = {
  apiKey: "AIzaSyBGCH8eKzyUFqj-SJ8QqOdrMVp0kB_4xb0",
  authDomain: "seventh-feather-6fj47.firebaseapp.com",
  projectId: "seventh-feather-6fj47",
  storageBucket: "seventh-feather-6fj47.firebasestorage.app",
  messagingSenderId: "1068228233550",
  appId: "1:1068228233550:web:78de10432dd340ac53f61f"
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore specifying the database ID from config
export const db = getFirestore(app, "ai-studio-incomeandexpense-8e71ae7a-d6ef-4aec-89cf-cd90062fbfe5");

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Google Auth provider helper functions
export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Google login failed:", error);
    throw error;
  }
}

export async function logout() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout failed:", error);
    throw error;
  }
}
