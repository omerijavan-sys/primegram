import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Phone, Eye, EyeOff, Shield, ChevronDown, Clock, CheckCircle2, XCircle } from "lucide-react";
import { logSecurityEvent } from "@/utils/audit";
import { validateEmail, validatePhone, validatePassword, sanitizeInput, sanitizeName, authRateLimiter, otpRateLimiter } from "@/utils/security";
import { countryCodes, getCountryByCode, type CountryCode } from "@/utils/countryCodes";
import AuthCinematic, { Figure } from "@/components/AuthCinematic";
import PrimeLogo from "@/components/PrimeLogo";

const AuthPage = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showIntro, setShowIntro] = useState(() => !sessionStorage.getItem("authIntroSeen"));
  const [authMethod, setAuthMethod] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(countryCodes[0]);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtp, setEmailOtp] = useState("");
  const navigate = useNavigate();

  const getNextPath = () => {
    const p = new URLSearchParams(window.location.search).get("next");
    return p && p.startsWith("/") && !p.startsWith("//") ? p : "/";
  };
  const postAuthRedirect = () => window.location.origin + getNextPath();

  const friendlyError = (msg: string) => {
    const m = (msg || "").toLowerCase();
    if (m.includes("invalid login credentials")) return "Wrong email or password. Try again or reset your password.";
    if (m.includes("email not confirmed")) return "Please confirm your email first — check your inbox.";
    if (m.includes("user already registered") || m.includes("already been registered"))
      return "This account already exists. Switching you to sign in.";
    if (m.includes("otp") && m.includes("expired")) return "That code expired. Tap Resend to get a new one.";
    if (m.includes("token") && m.includes("invalid")) return "That code is incorrect. Please re-enter it.";
    if (m.includes("sms") || m.includes("twilio") || m.includes("messagebird") || m.includes("phone provider") || m.includes("unsupported phone provider"))
      return "Phone sign-in isn't active yet — an SMS provider must be connected. Use email or Google for now.";
    if (m.includes("signups not allowed")) return "New sign-ups are currently disabled.";
    if (m.includes("rate limit") || m.includes("too many")) return "Too many attempts. Please wait a moment and retry.";
    return msg || "Something went wrong. Please try again.";
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    const typed = sanitizeInput(email.toLowerCase().trim());
    const isAdminLogin = !isSignUp && typed === "admin";
    const sanitizedEmail = isAdminLogin ? "admin@primegram.app" : typed;
    const sanitizedFullName = sanitizeName(fullName);
    
    if (!validateEmail(sanitizedEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    if (isSignUp) {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        setPasswordErrors(passwordValidation.errors);
        toast.error(passwordValidation.errors[0]);
        return;
      }
      setPasswordErrors([]);
      
      if (sanitizedFullName.length < 2) {
        toast.error("Please enter your full name");
        return;
      }
    }
    
    // Rate limiting
    try {
      authRateLimiter.canAttempt();
    } catch (err: any) {
      toast.error(err.message);
      return;
    }
    
    setLoading(true);
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: sanitizedEmail,
          password,
          options: { data: { full_name: sanitizedFullName }, emailRedirectTo: postAuthRedirect() },
        });
        if (error) {
          if ((error.message || "").toLowerCase().includes("already")) {
            setIsSignUp(false);
            toast.error(friendlyError(error.message));
            return;
          }
          throw error;
        }
        void logSecurityEvent("auth", "email_signup", sanitizedEmail, { otp_required: !data.session });
        if (data.session) {
          authRateLimiter.reset?.();
          navigate(getNextPath());
        } else {
          setEmailOtp("");
          setEmailOtpSent(true);
          void logSecurityEvent("otp", "email_otp_sent", sanitizedEmail, { reason: "signup" });
          setOtpCountdown(60);
          toast.success("We sent a 6-digit code to your email — enter it below.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: sanitizedEmail, password });
        if (error) {
          void logSecurityEvent("auth", "email_signin_failed", sanitizedEmail);
          throw error;
        }
        void logSecurityEvent("auth", "email_signin", sanitizedEmail);
        authRateLimiter.reset?.();
        navigate(isAdminLogin ? "/admin" : getNextPath());
      }
    } catch (err: any) {
      toast.error(friendlyError(err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailVerify = async () => {
    if (emailOtp.length !== 6) {
      toast.error("Please enter the 6-digit code sent to your email");
      return;
    }
    setVerifyingOtp(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: sanitizeInput(email.toLowerCase().trim()),
        token: emailOtp,
        type: "signup",
      });
      if (error) {
        void logSecurityEvent("otp", "email_otp_failed", sanitizeInput(email.toLowerCase().trim()));
        throw error;
      }
      void logSecurityEvent("otp", "email_otp_verified", sanitizeInput(email.toLowerCase().trim()));
      toast.success("Email verified!");
      navigate(getNextPath());
    } catch (err: any) {
      toast.error(friendlyError(err.message));
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleEmailResend = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: sanitizeInput(email.toLowerCase().trim()),
      });
      if (error) throw error;
      void logSecurityEvent("otp", "email_otp_resent", sanitizeInput(email.toLowerCase().trim()));
      setOtpCountdown(60);
      toast.success("New code sent to your email");
    } catch (err: any) {
      toast.error(friendlyError(err.message));
    } finally {
      setLoading(false);
    }
  };


  const handleForgotPassword = async () => {
    const sanitizedEmail = sanitizeInput(email.toLowerCase().trim());
    if (!validateEmail(sanitizedEmail)) {
      toast.error("Enter your email first, then tap reset");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(sanitizedEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Password reset link sent — check your email");
    } catch (err: any) {
      toast.error(friendlyError(err.message));
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSendOtp = async () => {
    if (!phoneNumber) { toast.error("Enter phone number"); return; }
    
    const fullPhone = selectedCountry.dial + phoneNumber.replace(/^0+/, "");
    const sanitizedPhone = sanitizeInput(fullPhone);
    if (!validatePhone(sanitizedPhone)) {
      toast.error("Please enter a valid phone number");
      return;
    }
    
    if (isSignUp) {
      const sanitizedFullName = sanitizeName(fullName);
      if (sanitizedFullName.length < 2) {
        toast.error("Please enter your full name");
        return;
      }
      if (!password) {
        toast.error("Create a password — you'll use it to sign in with your phone number");
        return;
      }
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        setPasswordErrors(passwordValidation.errors);
        toast.error(passwordValidation.errors[0]);
        return;
      }
      setPasswordErrors([]);
    }
    
    // Rate limiting for OTP
    try {
      otpRateLimiter.canAttempt();
    } catch (err: any) {
      toast.error(err.message);
      return;
    }
    
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          phone: sanitizedPhone,
          password,
          options: { data: { full_name: sanitizeName(fullName) } },
        } as any);
        void logSecurityEvent("auth", "phone_signup", sanitizedPhone, { failed: !!error });
        if (error) {
          // Number already exists → send a sign-in code instead
          if ((error.message || "").toLowerCase().includes("already")) {
            setIsSignUp(false);
            void logSecurityEvent("auth", "phone_signup_exists", sanitizedPhone);
            toast.error("That number already has an account — sign in with your password.");
            return;
          } else {
            throw error;
          }
        }
      } else {
        // Signing in never uses OTP — password only. OTP is signup-only.
        if (!password) {
          toast.error("Enter your password to sign in");
          return;
        }
        const { error } = await supabase.auth.signInWithPassword({ phone: sanitizedPhone, password });
        if (error) {
          void logSecurityEvent("auth", "phone_signin_failed", sanitizedPhone);
          throw error;
        }
        void logSecurityEvent("auth", "phone_signin", sanitizedPhone);
        authRateLimiter.reset?.();
        navigate(getNextPath());
        return;
      }
      setOtp("");
      setOtpSent(true);
      setOtpCountdown(60); // 60 second countdown
      void logSecurityEvent("otp", "sms_otp_sent", sanitizedPhone, { reason: "signup" });
      toast.success(`Code sent to ${sanitizedPhone}`);
    } catch (err: any) {
      toast.error(friendlyError(err.message));
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneVerify = async () => {
    if (!otp || otp.length !== 6) {
      toast.error("Please enter the 6-digit verification code");
      return;
    }
    
    const fullPhone = selectedCountry.dial + phoneNumber.replace(/^0+/, "");
    setVerifyingOtp(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: sanitizeInput(fullPhone),
        token: otp,
        type: "sms",
      });
      if (error) {
        void logSecurityEvent("otp", "sms_otp_failed", sanitizeInput(fullPhone));
        throw error;
      }
      void logSecurityEvent("otp", "sms_otp_verified", sanitizeInput(fullPhone));
      // Persist the name captured during phone sign-up
      const name = sanitizeName(fullName);
      if (name.length >= 2) {
        await supabase.auth.updateUser({ data: { full_name: name } });
      }
      toast.success("Verified!");
      otpRateLimiter.reset(); // Reset rate limiter on success
      navigate(getNextPath());
    } catch (err: any) {
      toast.error(friendlyError(err.message));
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: postAuthRedirect() });
      if (result.error) { toast.error("Google sign-in failed"); return; }
      if (result.redirected) return;
      navigate(getNextPath());
    } catch (err: any) {
      toast.error(err.message || "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };


  // Countdown timer for OTP resend
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (otpCountdown > 0) {
      interval = setInterval(() => {
        setOtpCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpCountdown]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      {showIntro && <AuthCinematic onDone={() => { sessionStorage.setItem("authIntroSeen", "1"); setShowIntro(false); }} />}

      <div className="absolute top-1/4 left-1/3 w-80 h-80 rounded-full opacity-[0.05]" style={{ background: "radial-gradient(circle, hsl(210,100%,60%), transparent)" }} />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full opacity-[0.04]" style={{ background: "radial-gradient(circle, hsl(280,70%,55%), transparent)" }} />

      {/* the character casually leans against the edge of the form */}
      {!showIntro && (
        <motion.div
          initial={{ opacity: 0, x: -40, rotate: 0 }}
          animate={{ opacity: 1, x: 0, rotate: 8 }}
          transition={{ delay: 0.55, duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-none absolute bottom-[8%] left-[calc(50%-21rem)] hidden h-[46vh] max-h-[380px] origin-bottom-right lg:block"
          style={{ filter: "drop-shadow(0 24px 40px hsla(0,0%,0%,0.6))" }}
        >
          <Figure variant="stand" />
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm relative z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <PrimeLogo size={44} />
            <h1 className="text-2xl text-display text-foreground">Primegram</h1>
          </div>

          <p className="text-sm text-muted-foreground">{isSignUp ? "Create your account" : "Welcome back"}</p>
        </div>

        <div className="liquid-glass rounded-3xl p-6 space-y-4">
          {/* Security Notice */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20">
            <Shield className="w-4 h-4 text-primary" />
            <p className="text-xs text-primary">Secure authentication with OTP verification</p>
          </div>

          {/* Google */}
          <button type="button" onClick={handleGoogleSignIn} disabled={loading} className="depth-press w-full py-3 rounded-2xl liquid-glass-subtle text-foreground text-sm font-semibold flex items-center justify-center gap-2 relative z-10">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 relative z-10">
            <div className="flex-1 h-px bg-border" />
            <span className="text-caption text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Auth method toggle */}
          <div className="flex gap-2 relative z-10">
            <button type="button" onClick={() => { setAuthMethod("email"); setOtpSent(false); }} className={`depth-press flex-1 py-2 rounded-xl text-sm font-medium ${authMethod === "email" ? "bg-primary text-primary-foreground" : "liquid-glass-subtle text-foreground"}`}>
              Email
            </button>
            <button type="button" onClick={() => { setAuthMethod("phone"); setOtpSent(false); }} className={`depth-press flex-1 py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-1 ${authMethod === "phone" ? "bg-primary text-primary-foreground" : "liquid-glass-subtle text-foreground"}`}>
              <Phone className="w-3 h-3" /> Phone
            </button>
          </div>

          {authMethod === "email" && emailOtpSent ? (
            <div className="space-y-4">
              <div>
                <label className="text-caption text-muted-foreground block mb-1.5">Email verification code</label>
                <input
                  value={emailOtp}
                  onChange={e => setEmailOtp(e.target.value.replace(/[^0-9]/g, ""))}
                  maxLength={6}
                  inputMode="numeric"
                  placeholder="000000"
                  className="w-full px-4 py-3 rounded-2xl bg-secondary/50 text-foreground text-center text-2xl tracking-[0.5em] font-mono outline-none focus:ring-2 focus:ring-primary/30"
                />
                <p className="text-caption text-muted-foreground mt-2">
                  Enter the 6-digit code sent to {email}
                </p>
                {otpCountdown > 0 ? (
                  <p className="text-[11px] text-muted-foreground mt-1">Resend available in {otpCountdown}s</p>
                ) : (
                  <button type="button" onClick={handleEmailResend} className="text-[11px] text-primary hover:underline mt-1">
                    Resend code
                  </button>
                )}
              </div>
              <button
                onClick={handleEmailVerify}
                disabled={verifyingOtp}
                className="depth-press w-full py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
              >
                {verifyingOtp ? "Verifying…" : "Verify & continue"}
              </button>
              <button
                type="button"
                onClick={() => { setEmailOtpSent(false); setEmailOtp(""); }}
                className="text-[11px] text-muted-foreground hover:text-foreground w-full"
              >
                Use a different email
              </button>
            </div>
          ) : authMethod === "email" ? (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <AnimatePresence mode="wait">
                {isSignUp && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                    <label className="text-caption text-muted-foreground block mb-1.5">Full Name</label>
                    <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-secondary/50 text-foreground text-sm placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30" placeholder="Your name" required={isSignUp} />
                  </motion.div>
                )}
              </AnimatePresence>
              <div>
                <label className="text-caption text-muted-foreground block mb-1.5">Email</label>
                <input type={isSignUp ? "email" : "text"} autoCapitalize="none" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-secondary/50 text-foreground text-sm placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30" placeholder={isSignUp ? "you@example.com" : "Email or admin"} required />
              </div>
              <div>
                <label className="text-caption text-muted-foreground block mb-1.5">Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    className="w-full px-4 py-3 rounded-2xl bg-secondary/50 text-foreground text-sm placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 pr-10" 
                    placeholder="••••••••" 
                    required 
                    minLength={isSignUp ? 8 : undefined} 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordErrors.length > 0 && (
                  <ul className="text-[10px] text-destructive mt-1 space-y-0.5">
                    {passwordErrors.map((error, i) => (
                      <li key={i}>• {error}</li>
                    ))}
                  </ul>
                )}
              </div>
              {!isSignUp && (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[11px] text-primary hover:underline"
                >
                  Forgot password?
                </button>
              )}
              <button type="submit" disabled={loading} className="depth-press w-full py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50">
                {loading ? "..." : isSignUp ? "Create Account" : "Sign In"}
              </button>

            </form>
          ) : (
            <div className="space-y-4">
              {isSignUp && !otpSent && (
                <div>
                  <label className="text-caption text-muted-foreground block mb-1.5">Full Name</label>
                  <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-secondary/50 text-foreground text-sm placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30" placeholder="Your name" />
                </div>
              )}
              <div>
                <label className="text-caption text-muted-foreground block mb-1.5">Phone Number</label>
                <div className="flex gap-2">
                  {/* Country Code Selector */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                      className="depth-press px-3 py-3 rounded-2xl bg-secondary/50 text-foreground text-sm flex items-center gap-2 min-w-[100px] justify-between"
                    >
                      <span>{selectedCountry.flag}</span>
                      <span className="text-xs">{selectedCountry.dial}</span>
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    
                    {showCountryDropdown && (
                      <div className="absolute top-full left-0 mt-2 w-64 max-h-60 overflow-y-auto liquid-glass rounded-2xl z-50">
                        {countryCodes.map((country) => (
                          <button
                            key={country.code}
                            type="button"
                            onClick={() => {
                              setSelectedCountry(country);
                              setShowCountryDropdown(false);
                            }}
                            className="w-full px-4 py-2 flex items-center gap-3 hover:bg-primary/10 text-left text-sm text-foreground"
                          >
                            <span>{country.flag}</span>
                            <span>{country.name}</span>
                            <span className="ml-auto text-muted-foreground">{country.dial}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Phone Number Input */}
                  <input 
                    type="tel" 
                    value={phoneNumber} 
                    onChange={e => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))} 
                    className="flex-1 px-4 py-3 rounded-2xl bg-secondary/50 text-foreground text-sm placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30" 
                    placeholder="1234567890" 
                    maxLength={15}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">Full number: {selectedCountry.dial}{phoneNumber}</p>
              </div>
              {!otpSent && (
                <div>
                  <label className="text-caption text-muted-foreground block mb-1.5">
                    {isSignUp ? "Create Password" : "Password"}
                  </label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={password} 
                      onChange={e => setPassword(e.target.value)} 
                      className="w-full px-4 py-3 rounded-2xl bg-secondary/50 text-foreground text-sm placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 pr-10" 
                      placeholder="••••••••" 
                      minLength={8} 
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordErrors.length > 0 && (
                    <ul className="text-[10px] text-destructive mt-1 space-y-0.5">
                      {passwordErrors.map((error, i) => (
                        <li key={i}>• {error}</li>
                      ))}
                    </ul>
                  )}
                  {!isSignUp && (
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Leave empty to sign in with an SMS code instead.
                    </p>
                  )}
                </div>
              )}
              {otpSent && (
                <div>
                  <label className="text-caption text-muted-foreground block mb-1.5">Verification Code</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={otp} 
                      onChange={e => setOtp(e.target.value.replace(/[^0-9]/g, ''))} 
                      className={`w-full px-4 py-3 rounded-2xl bg-secondary/50 text-foreground text-sm placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 text-center tracking-widest pr-10 ${
                        verifyingOtp ? 'animate-pulse' : ''
                      }`}
                      placeholder="123456" 
                      maxLength={6} 
                      disabled={verifyingOtp}
                    />
                    {verifyingOtp && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-[10px] text-muted-foreground">
                      Enter the 6-digit code sent to {selectedCountry.dial}{phoneNumber}
                    </p>
                    {otpCountdown > 0 ? (
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{otpCountdown}s</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handlePhoneSendOtp}
                        className="text-[10px] text-primary hover:underline"
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>
                </div>
              )}
              <button 
                type="button" 
                onClick={otpSent ? handlePhoneVerify : handlePhoneSendOtp} 
                disabled={loading || verifyingOtp} 
                className="depth-press w-full py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading || verifyingOtp ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    {verifyingOtp ? "Verifying..." : "Sending..."}
                  </>
                ) : otpSent ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Verify OTP
                  </>
                ) : (
                  "Send OTP"
                )}
              </button>
            </div>
          )}

          <div className="relative z-10 text-center">
            <button type="button" onClick={() => { setIsSignUp(!isSignUp); setOtpSent(false); }} className="text-sm text-primary hover:underline">
              {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;
