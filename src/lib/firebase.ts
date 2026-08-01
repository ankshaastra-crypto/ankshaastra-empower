import type { Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";

// Firebase is currently disabled. Export null typed placeholders so
// admin UI imports continue to compile; components already guard against null.
export const auth: Auth | null = null;
export const db: Firestore | null = null;
export default null;
