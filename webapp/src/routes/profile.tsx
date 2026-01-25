import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { User, Mail, Lock, Save, Loader2, Shield, AlertCircle, Upload, Image as ImageIcon } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { authClient, useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

export default function ProfilePage() {
    const { data: session } = useSession();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [name, setName] = useState(session?.user?.name || "");
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

    const [email, setEmail] = useState(session?.user?.email || "");
    const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    const [isUploading, setIsUploading] = useState(false);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsUpdatingProfile(true);
        try {
            await authClient.updateUser({
                name: name.trim(),
            });
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

    const [emailPassword, setEmailPassword] = useState("");

    const handleUpdateEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim() || email === session?.user?.email) return;
        if (!emailPassword) {
            toast({
                title: "Error",
                description: "Password is required to change email",
                variant: "destructive",
            });
            return;
        }

        setIsUpdatingEmail(true);
        try {
            await api.post("/api/users/me/change-email", {
                newEmail: email.trim(),
                password: emailPassword,
            });

            toast({
                title: "Success",
                description: "Email updated successfully",
                className: "bg-emerald-500/10 border-emerald-500/20 text-emerald-500",
            });
            setEmailPassword("");
        } catch (error) {
            console.error("Failed to update email:", error);
            // @ts-ignore
            const msg = error.message || "Failed to update email";
            // @ts-ignore
            if (msg.includes("Incorrect password")) {
                toast({
                    title: "Authentication Failed",
                    description: "Incorrect password provided",
                    variant: "destructive",
                });
            } else {
                toast({
                    title: "Error",
                    description: msg,
                    variant: "destructive",
                });
            }

        } finally {
            setIsUpdatingEmail(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast({
                title: "Error",
                description: "Please upload an image file",
                variant: "destructive",
            });
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast({
                title: "Error",
                description: "File size must be less than 5MB",
                variant: "destructive",
            });
            return;
        }

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);

            // Use fetch directly for FormData to avoid Content-Type issues
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/upload`, {
                method: "POST",
                body: formData,
                headers: {
                    // Do not set Content-Type header, let browser set it with boundary
                },
                credentials: "include", // Send session cookie
            });

            if (!response.ok) {
                throw new Error("Upload failed");
            }

            const data = await response.json();
            const imageUrl = `${import.meta.env.VITE_BACKEND_URL}${data.data.url}`;

            // Update user profile with new image URL
            await authClient.updateUser({
                image: imageUrl,
            });

            toast({
                title: "Success",
                description: "Profile photo updated",
                className: "bg-emerald-500/10 border-emerald-500/20 text-emerald-500",
            });
        } catch (error) {
            console.error("Upload error:", error);
            toast({
                title: "Error",
                description: "Failed to upload photo",
                variant: "destructive",
            });
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
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

        setIsChangingPassword(true);
        try {
            await authClient.changePassword({
                currentPassword,
                newPassword,
                revokeOtherSessions: true,
            });
            toast({
                title: "Success",
                description: "Password changed successfully",
                className: "bg-emerald-500/10 border-emerald-500/20 text-emerald-500",
            });
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error) {
            console.error("Failed to change password:", error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to change password",
                variant: "destructive",
            });
        } finally {
            setIsChangingPassword(false);
        }
    };

    if (!session) {
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
                                    onClick={handleAvatarClick}
                                    className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 mx-auto flex items-center justify-center border-2 border-primary/10 cursor-pointer overflow-hidden transition-all group-hover:border-primary/50 relative"
                                >
                                    {session.user?.image ? (
                                        <img src={session.user.image} alt={session.user.name || "User"} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-3xl font-bold text-primary">
                                            {(session.user?.name || "U")[0].toUpperCase()}
                                        </span>
                                    )}

                                    {/* Hover overlay */}
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Upload className="w-6 h-6 text-white" />
                                    </div>

                                    {/* Loading overlay */}
                                    {isUploading && (
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                            <Loader2 className="w-6 h-6 text-white animate-spin" />
                                        </div>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                                <div className="mt-2 text-xs text-muted-foreground">Click to upload photo</div>
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-foreground">{session.user?.name}</h2>
                                <p className="text-sm text-muted-foreground">{session.user?.email}</p>
                            </div>
                            <div className="pt-4 border-t border-white/10">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                                    <Shield className="w-3 h-3" />
                                    {/* @ts-ignore - role exists in our custom session */}
                                    {session.user?.role || "USER"}
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
                                        disabled={isUpdatingProfile || name === session.user?.name}
                                        className="bg-primary hover:bg-primary/90"
                                    >
                                        {isUpdatingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                        Update Profile
                                    </Button>
                                </div>
                            </form>
                        </motion.div>

                        {/* Email Address */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="glass-card p-6"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 rounded-lg bg-accent/10">
                                    <Mail className="w-5 h-5 text-accent" />
                                </div>
                                <h2 className="text-lg font-semibold text-foreground">Email Address</h2>
                            </div>

                            <form onSubmit={handleUpdateEmail} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">New Email</label>
                                    <Input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="bg-secondary/30 border-white/10"
                                        placeholder="your@email.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">Current Password</label>
                                    <Input
                                        type="password"
                                        value={emailPassword}
                                        onChange={(e) => setEmailPassword(e.target.value)}
                                        className="bg-secondary/30 border-white/10"
                                        placeholder="Confirm with password"
                                        required
                                    />
                                </div>
                                <div className="flex justify-end">
                                    <Button
                                        type="submit"
                                        disabled={isUpdatingEmail || email === session.user?.email || !emailPassword}
                                        variant="outline"
                                        className="border-accent/50 text-accent hover:bg-accent/10 hover:text-accent"
                                    >
                                        {isUpdatingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                        Update Email
                                    </Button>
                                </div>
                            </form>
                        </motion.div>

                        {/* Security */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
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
                                        className="bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 shadow-red-500/20"
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
