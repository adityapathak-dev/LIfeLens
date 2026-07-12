import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD89D0w_8G6WUBGytH-szWD2cfpimTwLhU",
  authDomain: "lifelens-2f994.firebaseapp.com",
  projectId: "lifelens-2f994",
  storageBucket: "lifelens-2f994.firebasestorage.app",
  messagingSenderId: "1067312239518",
  appId: "1:1067312239518:web:e4771b2a9e871b3e2c3c8f"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export default app;
