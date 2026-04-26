import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD2HfYgPnLlOix2o_lU6Hk_GM2G4mUIgJ8",
  authDomain: "empowerperfect-baby-name.firebaseapp.com",
  projectId: "empowerperfect-baby-name",
  storageBucket: "empowerperfect-baby-name.firebasestorage.app",
  messagingSenderId: "109272963537",
  appId: "1:109272963537:web:f83fe63e016a33715868f0",
  measurementId: "G-FF5B2XK6K4",
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  console.warn("Firebase initialization failed:", error);
  // App can continue without Firebase — auth features will be unavailable
}

export { auth, db };
export default app;
