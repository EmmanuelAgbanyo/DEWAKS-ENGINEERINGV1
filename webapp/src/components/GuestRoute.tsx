import { Navigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { Loader2 } from "lucide-react";

export function GuestRoute({ children }: { children: React.ReactNode }) {
  const { firebaseUser, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen animated-gradient">
        <div className="glass-card p-8 flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (firebaseUser) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
