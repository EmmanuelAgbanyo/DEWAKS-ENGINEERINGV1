import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, ArrowRight, Loader2, User, Lock, Building2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
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
            const { error } = await authClient.signUp.email({
                email: formData.email,
                password: formData.password,
                name: formData.name,
            });

            if (error) {
                setError(error.message || "Failed to create account");
            } else {
                navigate("/dashboard");
            }
        } catch {
            setError("An unexpected error occurred. Please try again.");
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
                <div className="absolute inset-0 bg-gradient-to-l from-black/80 via-black/50 to-black/30" /> {/* Cinematic gradient overlay */}
            </div>

            {/* Left Panel - Branding (Hidden on Mobile) */}
            <div className="hidden lg:flex w-1/2 relative z-10 items-center justify-center p-12 order-2">
                <div className="max-w-lg">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >

                        <div className="relative p-10 backdrop-blur-md rounded-3xl border border-white/10 bg-black/60 shadow-2xl text-right">
                            <div className="w-16 h-16 ml-auto rounded-2xl bg-gradient-to-br from-secondary to-pink-600 flex items-center justify-center shadow-lg shadow-pink-500/20 mb-6">
                                <Building2 className="w-8 h-8 text-white opacity-90" />
                            </div>
                            <h1 className="text-5xl font-bold text-white mb-6 leading-tight tracking-tight">
                                Join <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-300">Dewaks</span>
                            </h1>
                            <p className="text-lg text-pink-100/80 leading-relaxed font-light mb-8">
                                Create an account to start submitting and tracking engineering requests with unprecedented operational speed.
                            </p>

                            <div className="space-y-4 flex flex-col items-end">
                                <div className="flex items-center gap-3 text-white/70">
                                    <span className="text-sm font-medium">Instant Approval Workflows</span>
                                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
                                        <div className="w-2 h-2 rounded-full bg-emerald-400" />
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-white/70">
                                    <span className="text-sm font-medium">Real-time Analytics</span>
                                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
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
                        <h2 className="text-3xl font-bold text-white tracking-tight">Create Account</h2>
                        <p className="text-blue-200/80 mt-2">Sign up to get started with Dewaks.</p>
                    </div>

                    <div className="glass-card p-8 border-white/10 bg-black/60 shadow-2xl shadow-black/50 backdrop-blur-xl">
                        <form onSubmit={handleSignup} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white ml-1">Full Name</label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-primary transition-colors" />
                                    <Input
                                        type="text"
                                        placeholder="John Doe"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="pl-12 h-12 bg-white/5 border-white/10 text-white placeholder:text-zinc-500 focus:border-primary/50 focus:ring-primary/20 rounded-xl transition-all"
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white ml-1">Email Address</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-primary transition-colors" />
                                    <Input
                                        type="email"
                                        placeholder="name@company.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="pl-12 h-12 bg-white/5 border-white/10 text-white placeholder:text-zinc-500 focus:border-primary/50 focus:ring-primary/20 rounded-xl transition-all"
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white ml-1">Password</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-primary transition-colors" />
                                    <Input
                                        type="password"
                                        placeholder="Min 8 characters"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="pl-12 h-12 bg-white/5 border-white/10 text-white placeholder:text-zinc-500 focus:border-primary/50 focus:ring-primary/20 rounded-xl transition-all"
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-200 text-sm text-center">
                                    {error}
                                </div>
                            )}

                            <Button type="submit" disabled={isLoading} className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity font-semibold text-white shadow-lg shadow-primary/20 mt-2">
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
                            </Button>
                        </form>
                    </div>

                    <p className="text-center text-sm text-blue-200/60">
                        Already have an account? <Link to="/login" className="text-primary hover:text-accent font-medium transition-colors">Sign in</Link>
                    </p>
                </motion.div>

                {/* Footer */}
                <div className="mt-8 text-center text-xs text-white/30">
                    &copy; {new Date().getFullYear()} Dewaks Engineering. Powered by <span className="text-white/50 font-medium">NexuByte Technologies</span>.
                </div>
            </div>
        </div>
    );
}
