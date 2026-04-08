import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD2HfYgPnLlOix2o_lU6Hk_GM2G4mUIgJ8",
  authDomain: "empowerperfect-baby-name.firebaseapp.com",
  projectId: "empowerperfect-baby-name",
  storageBucket: "empowerperfect-baby-name.firebasestorage.app",
  messagingSenderId: "109272963537",
  appId: "1:109272963537:web:f83fe63e016a33715868f0",
  measurementId: "G-FF5B2XK6K4",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
