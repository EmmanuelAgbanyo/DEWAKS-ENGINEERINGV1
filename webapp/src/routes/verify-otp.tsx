import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { KeyRound, ArrowLeft, Building2, Loader2, RefreshCw, Shield } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!email) {
      navigate("/login", { replace: true });
    }
  }, [email, navigate]);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newOtp.every((digit) => digit) && index === 5) {
      handleVerify(newOtp.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    pastedData.split("").forEach((digit, index) => {
      if (index < 6) newOtp[index] = digit;
    });
    setOtp(newOtp);

    const lastIndex = Math.min(pastedData.length - 1, 5);
    inputRefs.current[lastIndex]?.focus();

    if (newOtp.every((digit) => digit)) {
      handleVerify(newOtp.join(""));
    }
  };

  const handleVerify = async (otpCode: string) => {
    setIsLoading(true);
    setError("");

    try {
      const result = await authClient.signIn.emailOtp({
        email: email,
        otp: otpCode,
      });

      if (result.error) {
        setError(result.error.message || "Invalid verification code");
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setError("");

    try {
      const result = await authClient.emailOtp.sendVerificationOtp({
        email: email,
        type: "sign-in",
      });

      if (result.error) {
        setError(result.error.message || "Failed to resend code");
      } else {
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch {
      setError("Failed to resend code. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  if (!email) return null;

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Premium background */}
      <div className="absolute inset-0 bg-background" />

      {/* Gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -right-1/4 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-primary/8 via-primary/4 to-transparent blur-3xl" />
        <div className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-accent/6 via-accent/3 to-transparent blur-3xl" />
      </div>

      {/* Grid pattern */}
      <div className="absolute inset-0 grid-pattern opacity-40" />

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <div className="text-center mb-10">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="relative inline-block mb-6"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-2xl blur-2xl opacity-40 scale-150" />
              <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-primary via-primary to-accent flex items-center justify-center shadow-2xl shadow-primary/25">
                <Building2 className="w-10 h-10 text-primary-foreground" />
              </div>
            </motion.div>
            <h1 className="text-3xl font-bold text-foreground mb-2 tracking-tight">
              Dewaks Engineering
            </h1>
          </div>

          {/* Verification card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="glass-card p-8"
          >
            <Button
              variant="ghost"
              onClick={() => navigate("/login")}
              className="mb-6 -ml-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/15 to-accent/15 border border-primary/20 mb-5">
                <KeyRound className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                Verify Your Email
              </h2>
              <p className="text-sm text-muted-foreground mb-1">
                We sent a 6-digit code to
              </p>
              <p className="text-sm text-foreground font-medium">{email}</p>
            </div>

            <div className="space-y-6">
              {/* OTP Input */}
              <div className="flex justify-center gap-3">
                {otp.map((digit, index) => (
                  <Input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    disabled={isLoading}
                    className="w-12 h-14 text-center text-xl font-semibold bg-white/[0.03] border-white/[0.08] hover:border-white/[0.12] focus:border-primary/50 focus:bg-white/[0.05] rounded-xl transition-all"
                  />
                ))}
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20"
                >
                  <p className="text-sm text-destructive text-center">{error}</p>
                </motion.div>
              )}

              <Button
                onClick={() => handleVerify(otp.join(""))}
                disabled={isLoading || otp.some((d) => !d)}
                className="w-full h-13 bg-gradient-to-r from-primary via-primary to-accent hover:opacity-90 text-primary-foreground font-semibold text-base btn-glow rounded-xl"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Verify & Sign In"
                )}
              </Button>

              <div className="text-center pt-2">
                <p className="text-sm text-muted-foreground mb-3">
                  Didn&apos;t receive the code?
                </p>
                <Button
                  variant="ghost"
                  onClick={handleResend}
                  disabled={isResending}
                  className="text-primary hover:text-primary/90 hover:bg-primary/10"
                >
                  {isResending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Resend Code
                </Button>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-8 text-center"
          >
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Shield className="w-4 h-4" />
              <p className="text-sm">
                Your code expires in 10 minutes
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
