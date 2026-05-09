"use client";

import { useState, useEffect } from "react";
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
      className="auth-floating-orb"
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
    <div className="auth-wizard-progress">
      <div className={`auth-wizard-step ${step >= 1 ? "active" : ""}`}>
        <span className="auth-wizard-step-number">1</span>
        <span className="auth-wizard-step-label">Account</span>
      </div>
      <div className="auth-wizard-step-divider" />
      <div className={`auth-wizard-step ${step >= 2 ? "active" : ""}`}>
        <span className="auth-wizard-step-number">2</span>
        <span className="auth-wizard-step-label">Agency</span>
      </div>
    </div>
  );
}

export default function LoginPage() {
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
    <main className="system-shell">
      <div className="system-grain" aria-hidden="true" />

      <div className={`auth-page ${mounted ? "auth-page-visible" : ""}`}>
        {/* LEFT: Brand showcase panel */}
        <div className="auth-brand-panel">
          <div className="auth-brand-orbs" aria-hidden="true">
            <FloatingOrb delay="0s" size="320px" left="-80px" top="-60px" />
            <FloatingOrb delay="2.4s" size="200px" left="60%" top="55%" />
            <FloatingOrb delay="4.8s" size="140px" left="30%" top="80%" />
          </div>

          <div className="auth-brand-content">
            <Link href="/" className="auth-brand-logo" aria-label="Back to home">
              Voyage
            </Link>

            <div className="auth-brand-copy">
              <span className="frame-label">Welcome aboard</span>
              <h1 className="auth-brand-title">
                {isRegister && wizardStep === 2
                  ? "Tell us about your agency"
                  : "Every great trip starts with a single step"}
              </h1>
              <p className="auth-brand-subtitle">
                {isRegister && wizardStep === 2
                  ? "We'll review your application and get you set up quickly."
                  : "Plan smarter itineraries with AI-powered route logic, real-time collaboration, and map-aware scheduling — all in one workspace."}
              </p>
            </div>

            <div className="auth-brand-stats">
              <div className="auth-stat">
                <strong>2.4k+</strong>
                <span>Trips planned</span>
              </div>
              <div className="auth-stat-divider" />
              <div className="auth-stat">
                <strong>98%</strong>
                <span>Satisfaction</span>
              </div>
              <div className="auth-stat-divider" />
              <div className="auth-stat">
                <strong>40+</strong>
                <span>Destinations</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Auth form */}
        <div className="auth-form-panel">
          <div className="auth-form-top-nav">
            <Link href="/" className="auth-back-link">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back to Voyage
            </Link>
          </div>

          <div className="auth-form-container">
            {/* Mode toggle */}
            {!isAuthenticated && (
              <div className="auth-mode-toggle">
                <button
                  className={`auth-mode-btn ${mode === "login" ? "active" : ""}`}
                  onClick={() => handleModeSwitch("login")}
                  type="button"
                >
                  Sign in
                </button>
                <button
                  className={`auth-mode-btn ${mode === "register" ? "active" : ""}`}
                  onClick={() => handleModeSwitch("register")}
                  type="button"
                >
                  Create account
                </button>
                <div
                  className="auth-mode-indicator"
                  style={{
                    transform: mode === "register" ? "translateX(100%)" : "translateX(0)",
                  }}
                />
              </div>
            )}

            {/* Wizard progress for register mode */}
            {isRegister && <WizardProgress step={wizardStep} />}

            <div className={`auth-form-body ${isTransitioning ? "auth-form-exit" : "auth-form-enter"}`}>

              {/* ─── LOGIN FORM ─── */}
              {mode === "login" && (
                <>
                  <div className="auth-form-heading">
                    <h2>Welcome back</h2>
                    <p className="lede">Sign in to pick up where you left off.</p>
                  </div>

                  <div className="auth-social-group">
                    {socialProviders.map((provider) => (
                      <button
                        key={provider.id}
                        className="auth-social-btn"
                        type="button"
                        onClick={() => auth.startOAuth(provider.id)}
                      >
                        {provider.icon}
                        <span>{provider.label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="auth-divider"><span>or continue with email</span></div>

                  <form onSubmit={handleLoginSubmit} className="auth-fields">
                    <div className="auth-field">
                      <label htmlFor="auth-email">Email address</label>
                      <div className="auth-input-wrap">
                        <svg className="auth-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="4" width="20" height="16" rx="2" />
                          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                        </svg>
                        <input id="auth-email" type="email" placeholder="voyager@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
                      </div>
                    </div>

                    <div className="auth-field">
                      <div className="auth-field-header">
                        <label htmlFor="auth-password">Password</label>
                        <button type="button" className="auth-forgot-link">Forgot password?</button>
                      </div>
                      <div className="auth-input-wrap">
                        <svg className="auth-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        <input id="auth-password" type={showPassword ? "text" : "password"} placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
                        <button type="button" className="auth-toggle-vis" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>
                          {showPassword ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                          ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                          )}
                        </button>
                      </div>
                    </div>

                    {auth.error && <div className="auth-error" role="alert">{auth.error.message}</div>}

                    <button type="submit" className="button button-primary auth-submit" disabled={auth.loading}>
                      {auth.loading ? "Signing in…" : "Sign in to Voyage"}
                    </button>
                  </form>
                </>
              )}

              {/* ─── REGISTER STEP 1: Personal Account ─── */}
              {isRegister && wizardStep === 1 && (
                <>
                  <div className="auth-form-heading">
                    <h2>Create your account</h2>
                    <p className="lede">Start planning unforgettable trips today.</p>
                  </div>

                  <div className="auth-social-group">
                    {socialProviders.map((provider) => (
                      <button
                        key={provider.id}
                        className="auth-social-btn"
                        type="button"
                        onClick={() => auth.startOAuth(provider.id)}
                      >
                        {provider.icon}
                        <span>{provider.label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="auth-divider"><span>or continue with email</span></div>

                  <form onSubmit={handleStep1Next} className="auth-fields">
                    <div className="auth-field">
                      <label htmlFor="auth-fullname">Full name</label>
                      <div className="auth-input-wrap">
                        <svg className="auth-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                        </svg>
                        <input id="auth-fullname" type="text" placeholder="Your full name" value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" />
                      </div>
                      {step1Errors.fullName && <span className="auth-field-error">{step1Errors.fullName}</span>}
                    </div>

                    <div className="auth-field">
                      <label htmlFor="auth-email">Email address</label>
                      <div className="auth-input-wrap">
                        <svg className="auth-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                        </svg>
                        <input id="auth-email" type="email" placeholder="voyager@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
                      </div>
                      {step1Errors.email && <span className="auth-field-error">{step1Errors.email}</span>}
                    </div>

                    <div className="auth-field">
                      <label htmlFor="auth-password">Password</label>
                      <div className="auth-input-wrap">
                        <svg className="auth-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        <input id="auth-password" type={showPassword ? "text" : "password"} placeholder="At least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
                        <button type="button" className="auth-toggle-vis" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>
                          {showPassword ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                          ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                          )}
                        </button>
                      </div>
                      {step1Errors.password && <span className="auth-field-error">{step1Errors.password}</span>}
                    </div>

                    <div className="auth-field">
                      <label htmlFor="auth-confirm-password">Confirm password</label>
                      <div className="auth-input-wrap">
                        <svg className="auth-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                        <input id="auth-confirm-password" type="password" placeholder="Repeat your password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" />
                      </div>
                      {step1Errors.confirmPassword && <span className="auth-field-error">{step1Errors.confirmPassword}</span>}
                    </div>

                    <label className="auth-checkbox-row" htmlFor="auth-terms">
                      <input type="checkbox" id="auth-terms" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} />
                      <span>
                        I agree to the{" "}
                        <a href="#" className="auth-inline-link">Terms of Service</a> and{" "}
                        <a href="#" className="auth-inline-link">Privacy Policy</a>
                      </span>
                    </label>
                    {step1Errors.terms && <span className="auth-field-error">{step1Errors.terms}</span>}

                    <button type="submit" className="button button-primary auth-submit">
                      Next: Agency Details
                    </button>
                  </form>
                </>
              )}

              {/* ─── REGISTER STEP 2: Agency Details ─── */}
              {isRegister && wizardStep === 2 && (
                <>
                  <div className="auth-form-heading">
                    <h2>Your agency</h2>
                    <p className="lede">Tell us about your travel agency so we can set up your workspace.</p>
                  </div>

                  <form onSubmit={handleStep2Submit} className="auth-fields">
                    <div className="auth-field">
                      <label htmlFor="auth-agency-name">Agency name</label>
                      <div className="auth-input-wrap">
                        <svg className="auth-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                        <input id="auth-agency-name" type="text" placeholder="e.g. Wanderlust Travel Co." value={agencyName} onChange={(e) => setAgencyName(e.target.value)} required />
                      </div>
                    </div>

                    <div className="auth-field">
                      <label htmlFor="auth-business-phone">Business phone</label>
                      <div className="auth-input-wrap">
                        <svg className="auth-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                        <input id="auth-business-phone" type="tel" placeholder="+1 (555) 123-4567" value={businessPhone} onChange={(e) => setBusinessPhone(e.target.value)} required />
                      </div>
                    </div>

                    <div className="auth-field">
                      <label htmlFor="auth-business-email">Business email <span className="auth-optional-tag">(optional)</span></label>
                      <div className="auth-input-wrap">
                        <svg className="auth-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                        </svg>
                        <input id="auth-business-email" type="email" placeholder="info@youragency.com" value={businessEmail} onChange={(e) => setBusinessEmail(e.target.value)} />
                      </div>
                    </div>

                    <div className="auth-field-grid">
                      <div className="auth-field">
                        <label htmlFor="auth-country">Country</label>
                        <div className="auth-input-wrap">
                          <svg className="auth-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                          </svg>
                          <input id="auth-country" type="text" placeholder="Philippines" value={country} onChange={(e) => setCountry(e.target.value)} required />
                        </div>
                      </div>

                      <div className="auth-field">
                        <label htmlFor="auth-city">City</label>
                        <div className="auth-input-wrap">
                          <svg className="auth-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                          </svg>
                          <input id="auth-city" type="text" placeholder="Manila" value={city} onChange={(e) => setCity(e.target.value)} required />
                        </div>
                      </div>
                    </div>

                    {auth.error && <div className="auth-error" role="alert">{auth.error.message}</div>}

                    <button type="submit" className="button button-primary auth-submit" disabled={auth.loading}>
                      {auth.loading ? "Setting up your agency…" : "Create my agency"}
                    </button>

                    {!isAuthenticated && (
                      <button type="button" className="auth-back-step" onClick={handleStep2Back}>
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
              <p className="auth-switch-prompt">
                {mode === "login" ? "Don’t have an account? " : "Already have an account? "}
                <button
                  type="button"
                  className="auth-switch-btn"
                  onClick={() => handleModeSwitch(mode === "login" ? "register" : "login")}
                >
                  {mode === "login" ? "Create one" : "Sign in"}
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
