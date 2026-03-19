import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, ArrowRight, Loader2, Shield, Sparkles, Lock, Sun, Moon } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/components/ThemeProvider";


function LoginThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-all duration-300"
      title={theme === "dark" ? "Switch to Light Mode" : "Switch to Cyber Mode"}
    >
      {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}

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
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/40" />
      </div>

      {/* Ambient glow effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-primary/20 rounded-full blur-[120px] mix-blend-screen animate-pulse-soft" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-accent/20 rounded-full blur-[120px] mix-blend-screen animate-pulse-soft delay-1000" />
      </div>

      {/* Left Panel - Branding & Visuals (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 relative z-10 items-center justify-center p-12">
        <div className="max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="relative p-10 backdrop-blur-3xl rounded-3xl glass-card shadow-2xl">
              <div className="relative w-20 h-20 rounded-2xl bg-white dark:bg-slate-950 p-1 flex items-center justify-center shadow-lg shadow-primary/20 mb-8 transform hover:rotate-6 transition-transform duration-500">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                <div className="absolute inset-0 bg-primary/20 blur-xl opacity-0 hover:opacity-100 transition-opacity" />
              </div>
              <h1 className="text-6xl font-black text-foreground mb-8 leading-tight tracking-tighter">
                Dewaks <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Engineering</span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed font-medium">
                Next-generation liquidity management for enterprise excellence.
              </p>

              <div className="mt-8 flex items-center gap-4">
                <div className="flex -space-x-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                      U{i}
                    </div>
                  ))}
                </div>
                <div className="text-sm text-muted-foreground">
                  <span className="text-foreground font-semibold">1,000+</span> requests processed
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
            <h2 className="text-3xl font-bold text-foreground tracking-tight">Welcome Back</h2>
            <p className="text-muted-foreground mt-2">Enter your credentials to access the portal.</p>
          </div>

          <div className="glass-card p-10 shadow-elevation-3 animate-scale-in">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Terminal ID</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-all duration-500" />
                  <Input
                    type="email"
                    placeholder="access@dewaks.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 h-14 bg-background/50 border-input text-foreground placeholder-muted-foreground focus:border-primary/50 focus:ring-primary/20 rounded-2xl transition-all duration-500"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Secure Key</label>
                  <Link to="/forgot-password" size="sm" className="text-xs font-black text-primary hover:text-accent transition-colors uppercase tracking-widest">Forgot?</Link>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-all duration-500" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 h-14 bg-background/50 border-input text-foreground placeholder-muted-foreground focus:border-primary/50 focus:ring-primary/20 rounded-2xl transition-all duration-500"
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

              <Button type="submit" disabled={isLoading} className="btn-glow w-full h-14 bg-gradient-to-r from-primary to-accent text-white shadow-glow-md rounded-2xl">
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                  <span className="flex items-center gap-2 font-black uppercase tracking-widest">
                    Initialize Session <ArrowRight className="w-5 h-5" />
                  </span>
                )}
              </Button>
            </form>
          </div>

          <p className="text-center text-sm font-medium text-muted-foreground">
            Unauthorized? <Link to="/signup" className="text-primary hover:text-accent font-black transition-colors">Request Access</Link>
          </p>

        </motion.div>

        {/* Footer */}
        <div className="mt-12 text-center flex items-center justify-center gap-4">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
            &copy; {new Date().getFullYear()} Dewaks Engineering &bull; Pure Performance
          </span>
          <LoginThemeToggle />
        </div>
      </div>
    </div>
  );
}

