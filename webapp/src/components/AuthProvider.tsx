import { createContext, useContext, useEffect, useState } from "react";
import { onAuthChange, type FirebaseUser } from "@/lib/firebase-auth";
import { getUser, createUserProfile, type DBUser } from "@/lib/firebase-db";

// Initial admin email — set as MANAGER (highest role) on first login
const SEED_ADMIN_EMAIL = "admin@dewaks.com";

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  userProfile: DBUser | null;
  isLoading: boolean;
  uid: string | null;
}

const AuthContext = createContext<AuthContextType>({
  firebaseUser: null,
  userProfile: null,
  isLoading: true,
  uid: null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<DBUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let settled = false;
    const settle = () => { if (!settled) { settled = true; setIsLoading(false); } };

    // Safety timeout — never load forever
    const timeout = setTimeout(() => {
      console.warn("⏱️ Auth timeout — forcing load completion");
      settle();
    }, 5000);

    const unsubscribe = onAuthChange(async (user) => {
      setFirebaseUser(user);
      if (user) {
        try {
          // Fetch the user profile from RTDB
          let profile = await getUser(user.uid);

          // Auto-create profile if it doesn't exist
          if (!profile) {
            const isSeedAdmin = user.email?.toLowerCase() === SEED_ADMIN_EMAIL.toLowerCase();
            const newProfile: DBUser = {
              name: user.displayName || user.email?.split("@")[0] || "User",
              email: user.email || "",
              role: isSeedAdmin ? "MANAGER" : "STAFF",
              department: isSeedAdmin ? "Management" : null,
              active: true,
              createdAt: new Date().toISOString(),
            };
            try {
              await createUserProfile(user.uid, newProfile);
              profile = newProfile;
              console.log(`✅ Auto-created RTDB profile for ${user.email} (role: ${newProfile.role})`);
            } catch (err: any) {
              console.error("Failed to auto-create user profile:", err);
              // Fallback to local profile so UI doesn't break
              profile = newProfile;
              if (err.message?.includes("Permission denied")) {
                console.error("🚨 RTDB Permission Denied! Have you updated your Database Rules?");
              }
            }
          }

          setUserProfile(profile);
        } catch (err) {
          console.error("Failed to fetch user profile:", err);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
      clearTimeout(timeout);
      settle();
    });

    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        userProfile,
        isLoading,
        uid: firebaseUser?.uid ?? null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/** Hook to access Firebase auth state + RTDB user profile */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

