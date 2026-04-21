"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleModeSwitch = (newMode) => {
    if (newMode === mode) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setMode(newMode);
      setIsTransitioning(false);
    }, 280);
  };

  const loginAndRedirect = (name, providerEmail) => {
    const user = {
      name: name || fullName || "Voyager",
      email: providerEmail || email || "voyager@example.com",
      loggedInAt: new Date().toISOString(),
    };
    localStorage.setItem("voyage-user", JSON.stringify(user));
    router.push("/?authenticated=1");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    loginAndRedirect();
  };

  return (
    <main className="system-shell">
      <div className="system-grain" aria-hidden="true" />

      <div className={`auth-page ${mounted ? "auth-page-visible" : ""}`}>
        {/* ─── LEFT: Brand showcase panel ─── */}
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
                Every great trip starts with a single step
              </h1>
              <p className="auth-brand-subtitle">
                Plan smarter itineraries with AI-powered route logic, real-time
                collaboration, and map-aware scheduling — all in one workspace.
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

        {/* ─── RIGHT: Auth form ─── */}
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

            <div className={`auth-form-body ${isTransitioning ? "auth-form-exit" : "auth-form-enter"}`}>
              <div className="auth-form-heading">
                <h2>{mode === "login" ? "Welcome back" : "Create your account"}</h2>
                <p className="lede">
                  {mode === "login"
                    ? "Sign in to pick up where you left off."
                    : "Start planning unforgettable trips today."}
                </p>
              </div>

              {/* Social auth */}
              <div className="auth-social-group">
                {socialProviders.map((provider) => (
                  <button
                    key={provider.id}
                    className="auth-social-btn"
                    type="button"
                    id={`auth-social-${provider.id}`}
                    onClick={() => loginAndRedirect("Voyager", `voyager+${provider.id}@example.com`)}
                  >
                    {provider.icon}
                    <span>{provider.label}</span>
                  </button>
                ))}
              </div>

              {/* Divider */}
              <div className="auth-divider">
                <span>or continue with email</span>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="auth-fields">
                {mode === "register" && (
                  <div className="auth-field" style={{ animationDelay: "0.06s" }}>
                    <label htmlFor="auth-fullname">Full name</label>
                    <div className="auth-input-wrap">
                      <svg className="auth-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      <input
                        id="auth-fullname"
                        type="text"
                        placeholder="Your full name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        autoComplete="name"
                      />
                    </div>
                  </div>
                )}

                <div className="auth-field">
                  <label htmlFor="auth-email">Email address</label>
                  <div className="auth-input-wrap">
                    <svg className="auth-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                    <input
                      id="auth-email"
                      type="email"
                      placeholder="voyager@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="auth-field">
                  <div className="auth-field-header">
                    <label htmlFor="auth-password">Password</label>
                    {mode === "login" && (
                      <button type="button" className="auth-forgot-link">
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="auth-input-wrap">
                    <svg className="auth-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <input
                      id="auth-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete={mode === "login" ? "current-password" : "new-password"}
                    />
                    <button
                      type="button"
                      className="auth-toggle-vis"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {mode === "register" && (
                  <div className="auth-field" style={{ animationDelay: "0.12s" }}>
                    <label htmlFor="auth-confirm-password">Confirm password</label>
                    <div className="auth-input-wrap">
                      <svg className="auth-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                      <input
                        id="auth-confirm-password"
                        type="password"
                        placeholder="Repeat your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        autoComplete="new-password"
                      />
                    </div>
                  </div>
                )}

                {mode === "register" && (
                  <label className="auth-checkbox-row" htmlFor="auth-terms">
                    <input type="checkbox" id="auth-terms" />
                    <span>
                      I agree to the{" "}
                      <a href="#" className="auth-inline-link">Terms of Service</a> and{" "}
                      <a href="#" className="auth-inline-link">Privacy Policy</a>
                    </span>
                  </label>
                )}

                <button type="submit" className="button button-primary auth-submit" id="auth-submit-btn">
                  {mode === "login" ? "Sign in to Voyage" : "Create my account"}
                </button>
              </form>
            </div>

            {/* Bottom switch prompt */}
            <p className="auth-switch-prompt">
              {mode === "login" ? "Don't have an account? " : "Already have an account? "}
              <button
                type="button"
                className="auth-switch-btn"
                onClick={() => handleModeSwitch(mode === "login" ? "register" : "login")}
              >
                {mode === "login" ? "Create one" : "Sign in"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
