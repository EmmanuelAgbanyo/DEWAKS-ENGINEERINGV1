import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  updatePassword,
  type User as FirebaseUser,
  type UserCredential,
} from "firebase/auth";
import { auth } from "./firebase";

// ─── Sign In ────────────────────────────────────────────────
export async function signIn(email: string, password: string): Promise<UserCredential> {
  return signInWithEmailAndPassword(auth, email, password);
}

// ─── Sign Up ────────────────────────────────────────────────
export async function signUp(
  email: string,
  password: string,
  displayName: string
): Promise<UserCredential> {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  // Set the display name on the Firebase Auth profile
  await updateProfile(credential.user, { displayName });
  return credential;
}

// ─── Sign Out ───────────────────────────────────────────────
export async function signOut(): Promise<void> {
  return firebaseSignOut(auth);
}

// ─── Auth State Observer ────────────────────────────────────
export function onAuthChange(callback: (user: FirebaseUser | null) => void) {
  try {
    return onAuthStateChanged(auth, callback);
  } catch (error) {
    console.warn("Firebase Auth not initialized, skipping auth state observer");
    // Immediately invoke with null to unblock the app
    callback(null);
    return () => {}; // no-op unsubscribe
  }
}

// ─── Get Current User (sync) ────────────────────────────────
export function getCurrentUser(): FirebaseUser | null {
  return auth.currentUser;
}

// ─── Update User Profile ────────────────────────────────────
export async function updateUserProfile(displayName: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  await updateProfile(user, { displayName });
}

// ─── Change Password ────────────────────────────────────────
export async function changePassword(newPassword: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  await updatePassword(user, newPassword);
}

// Re-export
export type { FirebaseUser };
