import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, ArrowRight, Loader2, User, Lock, Building2 } from "lucide-react";
import { signUp } from "@/lib/firebase-auth";
import { createUserProfile } from "@/lib/firebase-db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Signup() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
    });
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.email || !formData.password) {
            setError("Please fill in all fields");
            return;
        }

        if (formData.password.length < 8) {
            setError("Password must be at least 8 characters long");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            // 1. Create Firebase Auth user
            const credential = await signUp(formData.email, formData.password, formData.name);

            // 2. Create user profile in RTDB
            await createUserProfile(credential.user.uid, {
                name: formData.name,
                email: formData.email,
                role: "STAFF", // Default role
                department: null,
                active: false, // Needs admin approval
                createdAt: new Date().toISOString(),
            });

            navigate("/dashboard");
        } catch (err: any) {
            console.error("Signup failed:", err);
            const code = err?.code || "";
            if (code === "auth/email-already-in-use") {
                setError("An account with this email already exists");
            } else if (code === "auth/weak-password") {
                setError("Password is too weak. Please use a stronger password.");
            } else if (code === "auth/invalid-email") {
                setError("Please enter a valid email address.");
            } else {
                setError(err?.message || "An unexpected error occurred. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex overflow-hidden bg-background relative selection:bg-primary/30">
            {/* Full Screen Cinematic Background */}
            <div className="absolute inset-0 z-0">
                <img
                    src="/bg-premium.png"
                    alt="Cinematic Background"
                    className="w-full h-full object-cover animate-ken-burns opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-l from-background via-background/80 to-background/40" />
            </div>

            {/* Ambient glow effects */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-primary/20 rounded-full blur-[120px] mix-blend-screen animate-pulse-soft" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-accent/20 rounded-full blur-[120px] mix-blend-screen animate-pulse-soft delay-1000" />
            </div>

            {/* Left Panel - Branding (Hidden on Mobile) */}
            <div className="hidden lg:flex w-1/2 relative z-10 items-center justify-center p-12 order-2">
                <div className="max-w-lg">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >

                        <div className="relative p-10 backdrop-blur-3xl rounded-3xl glass-card shadow-2xl text-right">
                            <div className="relative w-20 h-20 ml-auto rounded-2xl bg-white dark:bg-slate-950 p-1 flex items-center justify-center shadow-lg shadow-primary/20 mb-8 transform hover:-rotate-6 transition-transform duration-500">
                                <Building2 className="w-10 h-10 text-primary" />
                                <div className="absolute inset-0 bg-primary/20 blur-xl opacity-0 hover:opacity-100 transition-opacity" />
                            </div>
                            <h1 className="text-6xl font-black text-foreground mb-8 leading-tight tracking-tighter">
                                Join <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Dewaks</span>
                            </h1>
                            <p className="text-xl text-muted-foreground leading-relaxed font-medium mb-8">
                                Deploy your potential with the world's most advanced engineering request infrastructure.
                            </p>

                            <div className="space-y-4 flex flex-col items-end">
                                <div className="flex items-center gap-3 text-muted-foreground">
                                    <span className="text-sm font-medium">Instant Approval Workflows</span>
                                    <div className="w-8 h-8 rounded-full bg-muted/30 flex items-center justify-center border border-border/50">
                                        <div className="w-2 h-2 rounded-full bg-emerald-400" />
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-muted-foreground">
                                    <span className="text-sm font-medium">Real-time Analytics</span>
                                    <div className="w-8 h-8 rounded-full bg-muted/30 flex items-center justify-center border border-border/50">
                                        <div className="w-2 h-2 rounded-full bg-blue-400" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Right Panel - Signup Form */}
            <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 relative z-10 order-1">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="w-full max-w-md space-y-8 my-auto"
                >
                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-bold text-foreground tracking-tight">Create Account</h2>
                        <p className="text-muted-foreground mt-2">Sign up to get started with Dewaks.</p>
                    </div>

                    <div className="glass-card p-10 shadow-elevation-3 animate-scale-in">
                        <form onSubmit={handleSignup} className="space-y-5">
                            <div className="space-y-2.5">
                                <label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Identity</label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-all duration-500" />
                                    <Input
                                        type="text"
                                        placeholder="Full Name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="pl-12 h-14 bg-background/50 border-input text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-primary/20 rounded-2xl transition-all duration-500"
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2.5">
                                <label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Terminal ID</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-all duration-500" />
                                    <Input
                                        type="email"
                                        placeholder="access@dewaks.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="pl-12 h-14 bg-background/50 border-input text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-primary/20 rounded-2xl transition-all duration-500"
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2.5">
                                <label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Secure Key</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-all duration-500" />
                                    <Input
                                        type="password"
                                        placeholder="Min 8 characters"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="pl-12 h-14 bg-background/50 border-input text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-primary/20 rounded-2xl transition-all duration-500"
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-bold text-center"
                                >
                                    {error}
                                </motion.div>
                            )}

                            <Button type="submit" disabled={isLoading} className="btn-glow w-full h-14 bg-gradient-to-r from-primary to-accent text-white shadow-glow-md rounded-2xl mt-4">
                                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                                    <span className="flex items-center gap-2 font-black uppercase tracking-widest">
                                        Establish Access <ArrowRight className="w-5 h-5" />
                                    </span>
                                )}
                            </Button>
                        </form>
                    </div>

                    <p className="text-center text-sm font-medium text-muted-foreground">
                        Authorized? <Link to="/login" className="text-primary hover:text-accent font-black transition-colors">SignIn</Link>
                    </p>
                </motion.div>

                {/* Footer */}
                <div className="mt-12 flex flex-col items-center justify-center gap-6">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground text-center">
                        &copy; {new Date().getFullYear()} Dewaks Engineering &bull; Global Operations
                    </span>
                    
                    <div className="flex flex-col items-center justify-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
                            Powered by
                        </p>
                        <div className="flex items-center gap-1.5">
                            <div className="h-5 w-5 rounded md:rounded-md bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-[0_0_12px_rgba(var(--primary),0.4)]">
                                <span className="text-[10px] font-black text-white">N</span>
                            </div>
                            <span className="text-sm font-bold text-foreground bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                                NexusByte Technologies
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
