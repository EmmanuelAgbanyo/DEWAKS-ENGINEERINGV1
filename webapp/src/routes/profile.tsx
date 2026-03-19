import { useState } from "react";
import { motion } from "framer-motion";
import { User, Mail, Lock, Save, Loader2, Shield, Upload } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/AuthProvider";
import { cn } from "@/lib/utils";
import { updateUser } from "@/lib/firebase-db";
import {
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function ProfilePage() {
    const { firebaseUser, userProfile, uid } = useAuth();
    const { toast } = useToast();

    const [name, setName] = useState(userProfile?.name || firebaseUser?.displayName || "");
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !firebaseUser || !uid) return;

        setIsUpdatingProfile(true);
        try {
            // Update Firebase Auth display name
            await updateProfile(firebaseUser, { displayName: name.trim() });
            // Update RTDB user profile
            await updateUser(uid, { name: name.trim() });
            toast({
                title: "Success",
                description: "Profile updated successfully",
                className: "bg-emerald-500/10 border-emerald-500/20 text-emerald-500",
            });
        } catch (error) {
            console.error("Failed to update profile:", error);
            toast({
                title: "Error",
                description: "Failed to update profile",
                variant: "destructive",
            });
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast({
                title: "Error",
                description: "New passwords do not match",
                variant: "destructive",
            });
            return;
        }

        if (!firebaseUser || !firebaseUser.email) return;

        setIsChangingPassword(true);
        try {
            // Re-authenticate first
            const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
            await reauthenticateWithCredential(firebaseUser, credential);
            // Then update password
            await updatePassword(firebaseUser, newPassword);
            toast({
                title: "Success",
                description: "Password changed successfully",
                className: "bg-emerald-500/10 border-emerald-500/20 text-emerald-500",
            });
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error: any) {
            console.error("Failed to change password:", error);
            let msg = "Failed to change password";
            if (error.code === "auth/wrong-password") {
                msg = "Current password is incorrect";
            } else if (error.code === "auth/weak-password") {
                msg = "New password is too weak (minimum 6 characters)";
            }
            toast({
                title: "Error",
                description: msg,
                variant: "destructive",
            });
        } finally {
            setIsChangingPassword(false);
        }
    };

    if (!firebaseUser) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-96">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto space-y-8"
            >
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">
                        My Profile
                    </h1>
                    <p className="text-muted-foreground">
                        Manage your account settings and preferences
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Sidebar / Info Card */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="lg:col-span-1"
                    >
                        <div className="glass-card p-6 text-center space-y-4">
                            <div className="relative group">
                                <div
                                    className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 mx-auto flex items-center justify-center border-2 border-primary/10 cursor-pointer overflow-hidden transition-all group-hover:border-primary/50 relative"
                                >
                                    <span className="text-3xl font-bold text-primary">
                                        {(userProfile?.name || firebaseUser?.displayName || "U")[0].toUpperCase()}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-foreground">{userProfile?.name || firebaseUser?.displayName}</h2>
                                <p className="text-sm text-muted-foreground">{userProfile?.email || firebaseUser?.email}</p>
                            </div>
                            <div className="pt-4 border-t border-white/10">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                                    <Shield className="w-3 h-3" />
                                    {userProfile?.role || "USER"}
                                </span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Forms */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Personal Information */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="glass-card p-6"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <User className="w-5 h-5 text-primary" />
                                </div>
                                <h2 className="text-lg font-semibold text-foreground">Personal Information</h2>
                            </div>

                            <form onSubmit={handleUpdateProfile} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">Display Name</label>
                                    <Input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="bg-secondary/30 border-white/10"
                                        placeholder="Your full name"
                                    />
                                </div>
                                <div className="flex justify-end">
                                    <Button
                                        type="submit"
                                        disabled={isUpdatingProfile || name === (userProfile?.name || firebaseUser?.displayName)}
                                        className="bg-primary hover:bg-primary/90"
                                    >
                                        {isUpdatingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                        Update Profile
                                    </Button>
                                </div>
                            </form>
                        </motion.div>

                        {/* Security */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="glass-card p-6"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 rounded-lg bg-red-500/10">
                                    <Lock className="w-5 h-5 text-red-500" />
                                </div>
                                <h2 className="text-lg font-semibold text-foreground">Security</h2>
                            </div>

                            <form onSubmit={handleChangePassword} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">Current Password</label>
                                    <Input
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="bg-secondary/30 border-white/10"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">New Password</label>
                                        <Input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="bg-secondary/30 border-white/10"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">Confirm New Password</label>
                                        <Input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="bg-secondary/30 border-white/10"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end pt-2">
                                    <Button
                                        type="submit"
                                        disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                                        className="bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20"
                                    >
                                        {isChangingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4 mr-2" />}
                                        Change Password
                                    </Button>
                                </div>
                            </form>
                        </motion.div>

                    </div>
                </div>
            </motion.div>
        </DashboardLayout>
    );
}
