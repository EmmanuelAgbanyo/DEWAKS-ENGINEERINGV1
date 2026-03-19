import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users as UsersIcon, Shield, UserCheck, Loader2, MoreHorizontal, AtSign, Briefcase, Calendar } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/components/AuthProvider";
import {
  subscribeToAllUsers,
  updateUser,
  recordToArray,
} from "@/lib/firebase-db";
import { User, UserRole } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function UsersPage() {
  const [users, setUsers] = useState<(User & { image?: string })[]>([]);
  const { uid, userProfile } = useAuth();
  const currentUserId = uid;
  const currentUserRole = userProfile?.role || null;
  const [isLoading, setIsLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const unsub = subscribeToAllUsers((data) => {
      const arr = recordToArray(data).map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        active: u.active,
        department: u.department,
        createdAt: u.createdAt,
      }));
      setUsers(arr);
      setIsLoading(false);
    });
    return () => unsub();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingUserId(userId);
    try {
      await updateUser(userId, { role: newRole });
      toast({ title: "Success", description: `Role updated to ${newRole}` });
    } catch (error) {
      console.error("Failed to update user role:", error);
      toast({ title: "Error", description: "Failed to update role", variant: "destructive" });
    } finally {
      setUpdatingUserId(null);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case UserRole.MANAGER:
        return "from-purple-500 to-indigo-500";
      case UserRole.ADMIN:
        return "from-blue-500 to-cyan-500";
      default:
        return "from-slate-500 to-slate-600";
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 shimmer rounded-3xl" />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">User Management</h1>
            <p className="text-muted-foreground mt-1">
              {currentUserRole === UserRole.MANAGER
                ? "Manage team roles and system access."
                : "Directory of all team members."}
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
            <div className="px-3 py-1.5 rounded-lg bg-primary/20 text-primary text-xs font-bold border border-primary/20">
              {users.length} Users
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 text-xs font-bold border border-emerald-500/20">
              {users.filter(u => u.active).length} Active
            </div>
          </div>
        </div>

        {/* Users Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {users.map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -5 }}
              className="group relative glass-card p-6 flex flex-col items-center text-center transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/30"
            >
              {/* Role Badge */}
              <div className={cn(
                "absolute top-4 right-4 text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-sm",
                user.active ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
              )}>
                {user.active ? "ACTIVE" : "PENDING"}
              </div>

              {/* Avatar */}
              <div className={cn(
                "w-20 h-20 rounded-2xl mb-4 flex items-center justify-center text-2xl font-bold text-white shadow-xl bg-gradient-to-br",
                getRoleColor(user.role)
              )}>
                {user.image ? <img src={user.image} className="w-full h-full object-cover rounded-2xl" /> : (user.name?.[0] || "U").toUpperCase()}
              </div>

              {/* Info */}
              <h3 className="text-lg font-bold text-foreground mb-1">{user.name}</h3>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
                <AtSign className="w-3 h-3" />
                {user.email}
              </div>

              <div className="w-full border-t border-white/5 my-4" />

              {/* Actions/Controls */}
              <div className="w-full mt-auto space-y-3">
                {!user.active &&
                  user.id !== currentUserId &&
                  (currentUserRole === UserRole.ADMIN || currentUserRole === UserRole.MANAGER) ? (
                  <Button
                    onClick={async () => {
                      setUpdatingUserId(user.id);
                      try {
                        await updateUser(user.id, { active: true });
                        toast({ title: "User Approved", description: `${user.name} can now log in.` });
                      } catch (e) {
                        toast({ title: "Error", description: "Failed to approve user", variant: "destructive" });
                      } finally {
                        setUpdatingUserId(null);
                      }
                    }}
                    disabled={updatingUserId === user.id}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                  >
                    {updatingUserId === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Approve Access"}
                  </Button>
                ) : (
                  <div className="relative">
                    {user.id === currentUserId || currentUserRole !== UserRole.MANAGER ? (
                      <div className="w-full py-2 bg-secondary/10 rounded-xl border border-secondary/20 text-xs font-bold text-secondary-foreground/80 uppercase tracking-wider">
                        {user.role}
                      </div>
                    ) : (
                      <Select
                        value={user.role}
                        onValueChange={(value) => handleRoleChange(user.id, value)}
                        disabled={updatingUserId === user.id}
                      >
                        <SelectTrigger className="w-full bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={UserRole.STAFF}>Staff</SelectItem>
                          <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                          <SelectItem value={UserRole.MANAGER}>Manager</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )
                }
              </div>
            </motion.div>
          ))}
        </div>

        {users.length === 0 && (
          <div className="glass-card p-12 text-center">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <UsersIcon className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">No users found.</p>
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  );
}
