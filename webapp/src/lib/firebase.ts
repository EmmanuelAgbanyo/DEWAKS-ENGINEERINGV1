import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getDatabase, type Database } from "firebase/database";

// Firebase configuration — loaded from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Check if Firebase is configured
const isConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

if (!isConfigured) {
  console.warn(
    "⚠️ Firebase is not configured. Please add VITE_FIREBASE_* variables to your .env file.\n" +
    "The app will load but Firebase features will not work."
  );
}

// Initialize Firebase (only if configured)
let app: FirebaseApp | undefined;
let auth: Auth;
let db: Database;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getDatabase(app);
} catch (error) {
  console.error("Failed to initialize Firebase:", error);
  // Create stub instances that won't crash the app
  auth = {} as Auth;
  db = {} as Database;
}

export { auth, db };
export default app;
