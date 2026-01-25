import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, ArrowRight, Loader2, Shield, Sparkles, Lock } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Please enter your email and password");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const { error } = await authClient.signIn.email({
        email: email.trim(),
        password,
      });

      if (error) {
        setError(error.message || "Invalid email or password");
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) {
      console.error("Login failed:", err);
      setError(err?.message || "An unexpected error occurred. Please try again.");
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
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/30" /> {/* Cinematic gradient overlay */}
      </div>

      {/* Left Panel - Branding & Visuals (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 relative z-10 items-center justify-center p-12">
        <div className="max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="relative p-10 backdrop-blur-md rounded-3xl border border-white/10 bg-black/60 shadow-2xl">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 mb-6">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-cover rounded-2xl opacity-90" />
              </div>
              <h1 className="text-5xl font-bold text-white mb-6 leading-tight tracking-tight">
                Dewaks <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Engineering</span>
              </h1>
              <p className="text-lg text-blue-100/80 leading-relaxed font-light">
                Advanced cashflow and operational request management for high-performance teams.
              </p>

              <div className="mt-8 flex items-center gap-4">
                <div className="flex -space-x-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-black/50 bg-zinc-800 flex items-center justify-center text-xs font-bold text-white/50">
                      U{i}
                    </div>
                  ))}
                </div>
                <div className="text-sm text-blue-200/60">
                  <span className="text-white font-semibold">1,000+</span> requests processed
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-md space-y-8 my-auto"
        >
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-white tracking-tight">Welcome Back</h2>
            <p className="text-blue-200/80 mt-2">Enter your credentials to access the portal.</p>
          </div>

          <div className="glass-card p-8 border-white/10 bg-black/60 shadow-2xl shadow-black/50 backdrop-blur-xl">
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-primary transition-colors" />
                  <Input
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 h-12 bg-white/5 border-white/10 text-white placeholder:text-zinc-500 focus:border-primary/50 focus:ring-primary/20 rounded-xl transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-white ml-1">Password</label>
                  <Link to="/forgot-password" className="text-xs text-primary hover:text-accent transition-colors">Forgot password?</Link>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-primary transition-colors" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 h-12 bg-white/5 border-white/10 text-white placeholder:text-zinc-500 focus:border-primary/50 focus:ring-primary/20 rounded-xl transition-all"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-200 text-sm text-center">
                  {error}
                </div>
              )}

              <Button type="submit" disabled={isLoading} className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity font-semibold text-white shadow-lg shadow-primary/20">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
              </Button>
            </form>
          </div>

          <p className="text-center text-sm text-blue-200/60">
            Don't have an account? <Link to="/signup" className="text-primary hover:text-accent font-medium transition-colors">Sign up</Link>
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

