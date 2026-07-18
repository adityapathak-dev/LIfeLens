import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD89D0w_8G6WUBGytH-szWD2cfpimTwLhU",
  authDomain: "lifelens-2f994.firebaseapp.com",
  projectId: "lifelens-2f994",
  storageBucket: "lifelens-2f994.firebasestorage.app",
  messagingSenderId: "1067312239518",
  appId: "1:1067312239518:web:e4771b2a9e871b3e2c3c8f"
};

const t0 = window.__lifelens_start || performance.now();
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
console.log(`[Startup] Firebase Initialized: ${(performance.now() - t0).toFixed(1)}ms`);
export default app;
