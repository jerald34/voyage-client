"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "../hooks/useAuth";

const socialProviders = [
  {
    id: "google",
    label: "Continue with Google",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    ),
  },
  {
    id: "apple",
    label: "Continue with Apple",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--voyage-primary)">
        <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C4.24 16.7 4.89 10.64 8.8 10.4c1.17.06 1.99.68 2.69.72.97-.2 1.9-.77 2.93-.69 1.24.1 2.17.58 2.78 1.47-2.55 1.53-1.95 4.89.63 5.82-.5 1.3-.73 1.87-1.78 3.56zM12.03 10.34c-.12-2.35 1.84-4.39 4.04-4.59.29 2.65-2.38 4.72-4.04 4.59z"/>
      </svg>
    ),
  },
];

function FloatingOrb({ delay, size, left, top }) {
  return (
    <div
      className="absolute rounded-full bg-gradient-to-br from-[rgba(216,180,160,0.18)] via-[rgba(215,122,97,0.08)] to-transparent [animation:auth-orb-drift_14s_ease-in-out_infinite_alternate] blur-[2px]"
      style={{
        width: size,
        height: size,
        left,
        top,
        animationDelay: delay,
      }}
      aria-hidden="true"
    />
  );
}

function WizardProgress({ step }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-7">
      <div className={`flex items-center gap-2 transition-opacity duration-250 ${step >= 1 ? "opacity-100" : "opacity-40"}`}>
        <span className="w-7 h-7 rounded-full bg-border text-text-muted flex items-center justify-center text-xs font-semibold transition-colors duration-250" style={step >= 1 ? { backgroundColor: "var(--voyage-secondary)", color: "#fff" } : {}}>1</span>
        <span className={`text-xs font-medium transition-colors duration-250 ${step >= 1 ? "text-text-primary" : "text-text-muted"}`}>Account</span>
      </div>
      <div className="w-12 h-0.5 bg-border mx-3" />
      <div className={`flex items-center gap-2 transition-opacity duration-250 ${step >= 2 ? "opacity-100" : "opacity-40"}`}>
        <span className="w-7 h-7 rounded-full bg-border text-text-muted flex items-center justify-center text-xs font-semibold transition-colors duration-250" style={step >= 2 ? { backgroundColor: "var(--voyage-secondary)", color: "#fff" } : {}}>2</span>
        <span className={`text-xs font-medium transition-colors duration-250 ${step >= 2 ? "text-text-primary" : "text-text-muted"}`}>Agency</span>
      </div>
    </div>
  );
}

function LoginForm() {
  const auth = useAuth();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState("login");
  const [wizardStep, setWizardStep] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Step 1 fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [step1Errors, setStep1Errors] = useState({});

  // Step 2 fields
  const [agencyName, setAgencyName] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");

  // Whether user is already authenticated (OAuth return)
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Handle OAuth return — user is already authenticated, go to step 2
    const stepParam = searchParams.get("step");
    if (stepParam === "agency") {
      const storedUser = localStorage.getItem("voyage-user");
      if (storedUser) {
        setIsAuthenticated(true);
        setMode("register");
        setWizardStep(2);
      }
    }
  }, [searchParams]);

  const handleModeSwitch = (newMode) => {
    if (newMode === mode) return;
    setIsTransitioning(true);
    setStep1Errors({});
    auth.setError(null);
    setTimeout(() => {
      setMode(newMode);
      setWizardStep(1);
      setIsTransitioning(false);
    }, 280);
  };

  const validateStep1 = () => {
    const errors = {};
    if (!fullName.trim()) errors.fullName = "Full name is required";
    if (!email.trim()) errors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) errors.email = "Enter a valid email";
    if (password.length < 8) errors.password = "Password must be at least 8 characters";
    if (password !== confirmPassword) errors.confirmPassword = "Passwords do not match";
    if (!agreedToTerms) errors.terms = "You must agree to the terms";
    setStep1Errors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleStep1Next = (e) => {
    e.preventDefault();
    if (validateStep1()) {
      setIsTransitioning(true);
      setTimeout(() => {
        setWizardStep(2);
        setIsTransitioning(false);
      }, 280);
    }
  };

  const handleStep2Submit = async (e) => {
    e.preventDefault();
    auth.setError(null);

    const agencyData = {
      name: agencyName,
      businessPhone,
      businessEmail: businessEmail || undefined,
      country,
      city,
    };

    if (isAuthenticated) {
      // OAuth user — already registered, just create agency
      await auth.createAgency(agencyData);
    } else {
      // Email user — register first, then create agency
      const user = await auth.register({ email, password, displayName: fullName });
      if (user) {
        await auth.createAgency(agencyData);
      }
    }
  };

  const handleStep2Back = () => {
    if (isAuthenticated) return; // Can't go back if OAuth
    setIsTransitioning(true);
    auth.setError(null);
    setTimeout(() => {
      setWizardStep(1);
      setIsTransitioning(false);
    }, 280);
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    auth.login({ email, password });
  };

  const isRegister = mode === "register";

  return (
    <div className={`grid grid-cols-2 min-h-[calc(100vh-100px)] gap-0 rounded-lg overflow-hidden border border-border shadow-strong transition-all duration-650 ${mounted ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-6 scale-[0.985]"}`}>
      {/* LEFT: Brand showcase panel */}
      <div className="relative flex flex-col justify-center p-[clamp(40px,5vw,72px)] bg-gradient-to-br from-primary via-[#1a2e38] to-[#2d3436] overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <FloatingOrb delay="0s" size="320px" left="-80px" top="-60px" />
          <FloatingOrb delay="2.4s" size="200px" left="60%" top="55%" />
          <FloatingOrb delay="4.8s" size="140px" left="30%" top="80%" />
        </div>

        <div className="relative z-[2] flex flex-col gap-12">
          <Link href="/" className="inline-block text-[rgba(255,255,255,0.92)] font-serif text-2xl font-normal tracking-[-0.03em] no-underline transition-colors duration-200 hover:text-accent" aria-label="Back to home">
            Voyage
          </Link>

          <div className="flex flex-col gap-0">
            <span className="inline-flex items-center gap-2.5 mb-5 text-accent font-extrabold text-[0.76rem] tracking-[0.18em] uppercase">
              <span className="w-11 h-px bg-current opacity-55" />
              Welcome aboard
            </span>
            <h1 className="text-white text-[clamp(2rem,3.2vw,3rem)] font-serif font-normal leading-tight max-w-56 mb-5">
              {isRegister && wizardStep === 2
                ? "Tell us about your agency"
                : "Every great trip starts with a single step"}
            </h1>
            <p className="text-[rgba(255,255,255,0.58)] text-[1.05rem] max-w-[42ch] leading-[1.7]">
              {isRegister && wizardStep === 2
                ? "We'll review your application and get you set up quickly."
                : "Plan smarter itineraries with AI-powered route logic, real-time collaboration, and map-aware scheduling — all in one workspace."}
            </p>
          </div>

        </div>
      </div>

      {/* RIGHT: Auth form */}
      <div className="flex flex-col p-[clamp(28px,4vw,56px)] bg-gradient-to-b from-[rgba(255,255,255,0.98)] to-[rgba(239,241,243,0.94)] overflow-y-auto">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-text-muted text-xs font-bold no-underline transition-colors duration-160 hover:text-secondary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Voyage
          </Link>
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-[440px] w-full mx-auto">
          {/* Mode toggle */}
          {!isAuthenticated && (
            <div className="relative grid grid-cols-2 p-1 mb-9 bg-[rgba(34,56,67,0.05)] border border-border rounded-pill">
              <button
                className={`relative z-[2] px-0 py-3 bg-none border-none font-extrabold text-xs cursor-pointer transition-colors duration-240 ${mode === "login" ? "text-text-primary" : "text-text-muted"}`}
                onClick={() => handleModeSwitch("login")}
                type="button"
              >
                Sign in
              </button>
              <button
                className={`relative z-[2] px-0 py-3 bg-none border-none font-extrabold text-xs cursor-pointer transition-colors duration-240 ${mode === "register" ? "text-text-primary" : "text-text-muted"}`}
                onClick={() => handleModeSwitch("register")}
                type="button"
              >
                Create account
              </button>
              <div
                className="absolute top-1 left-1 rounded-pill bg-white shadow-md transition-transform duration-320"
                style={{
                  width: "calc(50% - 5px)",
                  height: "calc(100% - 10px)",
                  transform: mode === "register" ? "translateX(100%)" : "translateX(0)",
                }}
              />
            </div>
          )}

          {/* Wizard progress for register mode */}
          {isRegister && <WizardProgress step={wizardStep} />}

          <div className={`flex flex-col gap-0 ${isTransitioning ? "[animation:auth-slide-out_0.22s_ease_forwards]" : "[animation:auth-slide-in_0.32s_ease_forwards]"}`}>

            {/* ─── LOGIN FORM ─── */}
            {mode === "login" && (
              <>
                <div className="mb-7">
                  <h2 className="text-[clamp(1.6rem,2.4vw,2.2rem)] mb-2">Welcome back</h2>
                  <p className="text-[1.08rem] text-text-muted mb-0">Sign in to pick up where you left off.</p>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  {socialProviders.map((provider) => (
                    <button
                      key={provider.id}
                      className="flex items-center justify-center gap-2.5 px-4 py-3.5 bg-white border border-border rounded-md text-text-primary text-xs font-bold cursor-pointer transition-all duration-160 hover:border-border-strong hover:shadow-[0_4px_16px_rgba(34,56,67,0.08)] hover:-translate-y-0.5"
                      type="button"
                      onClick={() => auth.startOAuth(provider.id)}
                    >
                      {provider.icon}
                      <span>{provider.label}</span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-4 mb-6">
                  <div className="flex-1 h-px bg-border/[0.12]" />
                  <span className="text-text-soft text-[0.78rem] font-bold uppercase tracking-[0.1em] whitespace-nowrap">or continue with email</span>
                  <div className="flex-1 h-px bg-border/[0.12]" />
                </div>

                <form onSubmit={handleLoginSubmit} className="flex flex-col gap-5">
                  <div className="flex flex-col gap-[7px] [animation:auth-field-in_0.35s_ease_both]">
                    <label htmlFor="auth-email" className="text-text-primary text-[0.86rem] font-bold">Email address</label>
                    <div className="relative flex items-center">
                      <svg className="absolute left-4 text-text-soft pointer-events-none transition-colors duration-200" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="4" width="20" height="16" rx="2" />
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                      </svg>
                      <input id="auth-email" type="email" placeholder="voyager@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className="w-full !pl-[46px] pr-[18px] py-[15px] border border-border rounded-md bg-[rgba(255,255,255,0.88)] text-text-primary shadow-inner transition-all duration-160 focus:outline-none focus:border-[rgba(32,178,170,0.6)] focus:shadow-[0_0_0_4px_rgba(32,178,170,0.12)] placeholder:text-text-soft" />
                    </div>
                  </div>

                  <div className="flex flex-col gap-[7px] [animation:auth-field-in_0.35s_ease_both]">
                    <div className="flex justify-between items-center">
                      <label htmlFor="auth-password" className="text-text-primary text-[0.86rem] font-bold">Password</label>
                      <button type="button" className="bg-none border-none text-secondary font-bold text-xs cursor-pointer transition-colors duration-160 hover:text-text-primary">Forgot password?</button>
                    </div>
                    <div className="relative flex items-center">
                      <svg className="absolute left-4 text-text-soft pointer-events-none transition-colors duration-200" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      <input id="auth-password" type={showPassword ? "text" : "password"} placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" className="w-full !pl-[46px] !pr-14 py-[15px] border border-border rounded-md bg-[rgba(255,255,255,0.88)] text-text-primary shadow-inner transition-all duration-160 focus:outline-none focus:border-[rgba(32,178,170,0.6)] focus:shadow-[0_0_0_4px_rgba(32,178,170,0.12)] placeholder:text-text-soft" />
                      <button type="button" className="absolute right-3.5 flex items-center justify-center w-8.5 h-8.5 bg-none border-none text-text-soft cursor-pointer rounded-sm transition-all duration-160 hover:text-secondary hover:bg-[rgba(215,122,97,0.06)]" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>
                        {showPassword ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {auth.error && <div className="p-3 rounded-sm bg-status-danger/[0.06] border border-status-danger/[0.18] text-status-danger text-[0.86rem] font-semibold leading-relaxed text-center [animation:auth-field-in_0.25s_ease_both]" role="alert">{auth.error.message}</div>}

                  <button type="submit" className="w-full mt-2 inline-flex items-center justify-center gap-2 min-h-[54px] px-7 py-4 rounded-pill font-extrabold bg-accent text-white hover:-translate-y-0.5 transition cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed disabled:transform-none" disabled={auth.loading}>
                    {auth.loading ? "Signing in…" : "Sign in to Voyage"}
                  </button>
                </form>
              </>
            )}

            {/* ─── REGISTER STEP 1: Personal Account ─── */}
            {isRegister && wizardStep === 1 && (
              <>
                <div className="mb-7">
                  <h2 className="text-[clamp(1.6rem,2.4vw,2.2rem)] mb-2">Create your account</h2>
                  <p className="text-[1.08rem] text-text-muted mb-0">Start planning unforgettable trips today.</p>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  {socialProviders.map((provider) => (
                    <button
                      key={provider.id}
                      className="flex items-center justify-center gap-2.5 px-4 py-3.5 bg-white border border-border rounded-md text-text-primary text-xs font-bold cursor-pointer transition-all duration-160 hover:border-border-strong hover:shadow-[0_4px_16px_rgba(34,56,67,0.08)] hover:-translate-y-0.5"
                      type="button"
                      onClick={() => auth.startOAuth(provider.id)}
                    >
                      {provider.icon}
                      <span>{provider.label}</span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-4 mb-6">
                  <div className="flex-1 h-px bg-border/[0.12]" />
                  <span className="text-text-soft text-[0.78rem] font-bold uppercase tracking-[0.1em] whitespace-nowrap">or continue with email</span>
                  <div className="flex-1 h-px bg-border/[0.12]" />
                </div>

                <form onSubmit={handleStep1Next} className="flex flex-col gap-5">
                  <div className="flex flex-col gap-[7px] [animation:auth-field-in_0.35s_ease_both]">
                    <label htmlFor="auth-fullname" className="text-text-primary text-[0.86rem] font-bold">Full name</label>
                    <div className="relative flex items-center">
                      <svg className="absolute left-4 text-text-soft pointer-events-none transition-colors duration-200" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                      </svg>
                      <input id="auth-fullname" type="text" placeholder="Your full name" value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" className="w-full !pl-[46px] pr-[18px] py-[15px] border border-border rounded-md bg-[rgba(255,255,255,0.88)] text-text-primary shadow-inner transition-all duration-160 focus:outline-none focus:border-[rgba(32,178,170,0.6)] focus:shadow-[0_0_0_4px_rgba(32,178,170,0.12)] placeholder:text-text-soft" />
                    </div>
                    {step1Errors.fullName && <span className="text-[0.8rem] text-status-danger mt-0.5">{step1Errors.fullName}</span>}
                  </div>

                  <div className="flex flex-col gap-[7px] [animation:auth-field-in_0.35s_ease_both]">
                    <label htmlFor="auth-email" className="text-text-primary text-[0.86rem] font-bold">Email address</label>
                    <div className="relative flex items-center">
                      <svg className="absolute left-4 text-text-soft pointer-events-none transition-colors duration-200" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                      </svg>
                      <input id="auth-email" type="email" placeholder="voyager@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className="w-full !pl-[46px] pr-[18px] py-[15px] border border-border rounded-md bg-[rgba(255,255,255,0.88)] text-text-primary shadow-inner transition-all duration-160 focus:outline-none focus:border-[rgba(32,178,170,0.6)] focus:shadow-[0_0_0_4px_rgba(32,178,170,0.12)] placeholder:text-text-soft" />
                    </div>
                    {step1Errors.email && <span className="text-[0.8rem] text-status-danger mt-0.5">{step1Errors.email}</span>}
                  </div>

                  <div className="flex flex-col gap-[7px] [animation:auth-field-in_0.35s_ease_both]">
                    <label htmlFor="auth-password" className="text-text-primary text-[0.86rem] font-bold">Password</label>
                    <div className="relative flex items-center">
                      <svg className="absolute left-4 text-text-soft pointer-events-none transition-colors duration-200" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      <input id="auth-password" type={showPassword ? "text" : "password"} placeholder="At least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" className="w-full !pl-[46px] !pr-14 py-[15px] border border-border rounded-md bg-[rgba(255,255,255,0.88)] text-text-primary shadow-inner transition-all duration-160 focus:outline-none focus:border-[rgba(32,178,170,0.6)] focus:shadow-[0_0_0_4px_rgba(32,178,170,0.12)] placeholder:text-text-soft" />
                      <button type="button" className="absolute right-3.5 flex items-center justify-center w-8.5 h-8.5 bg-none border-none text-text-soft cursor-pointer rounded-sm transition-all duration-160 hover:text-secondary hover:bg-[rgba(215,122,97,0.06)]" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>
                        {showPassword ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                        )}
                      </button>
                    </div>
                    {step1Errors.password && <span className="text-[0.8rem] text-status-danger mt-0.5">{step1Errors.password}</span>}
                  </div>

                  <div className="flex flex-col gap-[7px] [animation:auth-field-in_0.35s_ease_both]">
                    <label htmlFor="auth-confirm-password" className="text-text-primary text-[0.86rem] font-bold">Confirm password</label>
                    <div className="relative flex items-center">
                      <svg className="absolute left-4 text-text-soft pointer-events-none transition-colors duration-200" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                      <input id="auth-confirm-password" type="password" placeholder="Repeat your password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" className="w-full !pl-[46px] pr-[18px] py-[15px] border border-border rounded-md bg-[rgba(255,255,255,0.88)] text-text-primary shadow-inner transition-all duration-160 focus:outline-none focus:border-[rgba(32,178,170,0.6)] focus:shadow-[0_0_0_4px_rgba(32,178,170,0.12)] placeholder:text-text-soft" />
                    </div>
                    {step1Errors.confirmPassword && <span className="text-[0.8rem] text-status-danger mt-0.5">{step1Errors.confirmPassword}</span>}
                  </div>

                  <label className="flex items-center gap-3 cursor-pointer py-0.5" htmlFor="auth-terms">
                    <input
                      type="checkbox"
                      id="auth-terms"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="w-4.5 h-4.5 rounded border-border text-secondary focus:ring-secondary cursor-pointer"
                    />
                    <span className="text-[0.92rem] text-text-muted leading-tight">
                      I agree to the{" "}
                      <a href="#" className="text-secondary font-semibold hover:underline">Terms of Service</a> and{" "}
                      <a href="#" className="text-secondary font-semibold hover:underline">Privacy Policy</a>
                    </span>
                  </label>
                  {step1Errors.terms && <span className="text-[0.8rem] text-status-danger mt-0.5">{step1Errors.terms}</span>}

                  <button type="submit" className="w-full mt-2 inline-flex items-center justify-center gap-3 min-h-[54px] px-7 py-4 border border-transparent rounded-pill text-base font-extrabold cursor-pointer bg-accent text-white shadow-[0_16px_32px_rgba(216,180,160,0.26)] hover:-translate-y-px hover:bg-[#dbbfae] transition-all">
                    Next: Agency Details
                  </button>
                </form>
              </>
            )}

            {/* ─── REGISTER STEP 2: Agency Details ─── */}
            {isRegister && wizardStep === 2 && (
              <>
                <div className="mb-7">
                  <h2 className="text-[clamp(1.6rem,2.4vw,2.2rem)] mb-2">Your agency</h2>
                  <p className="text-[1.08rem] text-text-muted mb-0">Tell us about your travel agency so we can set up your workspace.</p>
                </div>

                <form onSubmit={handleStep2Submit} className="flex flex-col gap-5">
                  <div className="flex flex-col gap-[7px] [animation:auth-field-in_0.35s_ease_both]">
                    <label htmlFor="auth-agency-name" className="text-text-primary text-[0.86rem] font-bold">Agency name</label>
                    <div className="relative flex items-center">
                      <svg className="absolute left-4 text-text-soft pointer-events-none transition-colors duration-200" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
                      </svg>
                      <input id="auth-agency-name" type="text" placeholder="e.g. Wanderlust Travel Co." value={agencyName} onChange={(e) => setAgencyName(e.target.value)} required className="w-full !pl-[46px] pr-[18px] py-[15px] border border-border rounded-md bg-[rgba(255,255,255,0.88)] text-text-primary shadow-inner transition-all duration-160 focus:outline-none focus:border-[rgba(32,178,170,0.6)] focus:shadow-[0_0_0_4px_rgba(32,178,170,0.12)] placeholder:text-text-soft" />
                    </div>
                  </div>

                  <div className="flex flex-col gap-[7px] [animation:auth-field-in_0.35s_ease_both]">
                    <label htmlFor="auth-business-phone" className="text-text-primary text-[0.86rem] font-bold">Business phone</label>
                    <div className="relative flex items-center">
                      <svg className="absolute left-4 text-text-soft pointer-events-none transition-colors duration-200" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                      <input id="auth-business-phone" type="tel" placeholder="+1 (555) 123-4567" value={businessPhone} onChange={(e) => setBusinessPhone(e.target.value)} required className="w-full !pl-[46px] pr-[18px] py-[15px] border border-border rounded-md bg-[rgba(255,255,255,0.88)] text-text-primary shadow-inner transition-all duration-160 focus:outline-none focus:border-[rgba(32,178,170,0.6)] focus:shadow-[0_0_0_4px_rgba(32,178,170,0.12)] placeholder:text-text-soft" />
                    </div>
                  </div>

                  <div className="flex flex-col gap-[7px] [animation:auth-field-in_0.35s_ease_both]">
                    <label htmlFor="auth-business-email" className="text-text-primary text-[0.86rem] font-bold">
                      Business email <span className="text-text-soft font-normal text-[0.78rem]">(optional)</span>
                    </label>
                    <div className="relative flex items-center">
                      <svg className="absolute left-4 text-text-soft pointer-events-none transition-colors duration-200" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                      </svg>
                      <input id="auth-business-email" type="email" placeholder="info@youragency.com" value={businessEmail} onChange={(e) => setBusinessEmail(e.target.value)} className="w-full !pl-[46px] pr-[18px] py-[15px] border border-border rounded-md bg-[rgba(255,255,255,0.88)] text-text-primary shadow-inner transition-all duration-160 focus:outline-none focus:border-[rgba(32,178,170,0.6)] focus:shadow-[0_0_0_4px_rgba(32,178,170,0.12)] placeholder:text-text-soft" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="flex flex-col gap-[7px] [animation:auth-field-in_0.35s_ease_both]">
                      <label htmlFor="auth-country" className="text-text-primary text-[0.86rem] font-bold">Country</label>
                      <div className="relative flex items-center">
                        <svg className="absolute left-4 text-text-soft pointer-events-none transition-colors duration-200" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                        </svg>
                        <input id="auth-country" type="text" placeholder="Philippines" value={country} onChange={(e) => setCountry(e.target.value)} required className="w-full !pl-[46px] pr-[18px] py-[15px] border border-border rounded-md bg-[rgba(255,255,255,0.88)] text-text-primary shadow-inner transition-all duration-160 focus:outline-none focus:border-[rgba(32,178,170,0.6)] focus:shadow-[0_0_0_4px_rgba(32,178,170,0.12)] placeholder:text-text-soft" />
                      </div>
                    </div>

                    <div className="flex flex-col gap-[7px] [animation:auth-field-in_0.35s_ease_both]">
                      <label htmlFor="auth-city" className="text-text-primary text-[0.86rem] font-bold">City</label>
                      <div className="relative flex items-center">
                        <svg className="absolute left-4 text-text-soft pointer-events-none transition-colors duration-200" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                        </svg>
                        <input id="auth-city" type="text" placeholder="Manila" value={city} onChange={(e) => setCity(e.target.value)} required className="w-full !pl-[46px] pr-[18px] py-[15px] border border-border rounded-md bg-[rgba(255,255,255,0.88)] text-text-primary shadow-inner transition-all duration-160 focus:outline-none focus:border-[rgba(32,178,170,0.6)] focus:shadow-[0_0_0_4px_rgba(32,178,170,0.12)] placeholder:text-text-soft" />
                      </div>
                    </div>
                  </div>

                  {auth.error && <div className="p-3 rounded-sm bg-status-danger/[0.06] border border-status-danger/[0.18] text-status-danger text-[0.86rem] font-semibold leading-relaxed text-center" role="alert">{auth.error.message}</div>}

                  <button type="submit" className="w-full mt-2 inline-flex items-center justify-center gap-3 min-h-[54px] px-7 py-4 border border-transparent rounded-pill text-base font-extrabold cursor-pointer bg-accent text-white shadow-[0_16px_32px_rgba(216,180,160,0.26)] hover:-translate-y-px hover:bg-[#dbbfae] transition-all disabled:opacity-55 disabled:cursor-not-allowed disabled:transform-none" disabled={auth.loading}>
                    {auth.loading ? "Setting up your agency…" : "Create my agency"}
                  </button>

                  {!isAuthenticated && (
                    <button type="button" className="inline-flex items-center justify-center gap-2 mt-1 bg-none border-none text-text-muted text-[0.88rem] font-bold cursor-pointer transition-colors hover:text-secondary" onClick={handleStep2Back}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                      </svg>
                      Back to account details
                    </button>
                  )}
                </form>
              </>
            )}
          </div>

          {/* Bottom switch prompt */}
          {!isAuthenticated && (
            <p className="text-center mt-8 text-text-muted text-[0.92rem]">
              {mode === "login" ? "Don't have an account? " : "Already have an account? "}
              <button
                type="button"
                className="bg-none border-none text-secondary font-extrabold text-[0.92rem] cursor-pointer no-underline hover:text-text-primary hover:underline transition-colors"
                onClick={() => handleModeSwitch(mode === "login" ? "register" : "login")}
              >
                {mode === "login" ? "Create one" : "Sign in"}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="w-full max-w-[1320px] mx-auto px-5 pt-7 pb-[72px] min-h-screen">
      <div className="system-grain" aria-hidden="true" />
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
