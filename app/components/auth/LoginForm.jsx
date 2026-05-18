// Email + OAuth login form.
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "../../hooks/useAuth";
import { sanitizeEmailInput } from "./authValidation.js";
import OAuthButtons from "./OAuthButtons.jsx";
import FormField, { fieldSurfaceClass as authFieldSurfaceClass, fieldBaseClass as authFieldBaseClass } from "../ui/FormField.jsx";
import {
  EyeIcon,
  EyeOffIcon,
  MailIcon,
  LockIcon,
} from "../icons/index.js";

export default function LoginForm() {
  const auth = useAuth();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resetNotice, setResetNotice] = useState("");

  useEffect(() => {
    if (searchParams.get("reset") === "success") {
      setResetNotice("Your password has been updated. Sign in with your new password.");
    } else {
      setResetNotice("");
    }
  }, [searchParams]);

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    auth.login({ email, password });
  };

  return (
    <>
      <div className="mb-7">
        <h2 className="text-[clamp(1.6rem,2.4vw,2.2rem)] mb-2">Welcome back</h2>
        <p className="text-[1.08rem] text-text-muted mb-0">Sign in to pick up where you left off.</p>
      </div>

      <OAuthButtons onSelect={(id) => auth.startOAuth(id)} />

      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 h-px bg-border/[0.12]" />
        <span className="text-text-soft text-[0.78rem] font-bold uppercase tracking-[0.1em] whitespace-nowrap">or continue with email</span>
        <div className="flex-1 h-px bg-border/[0.12]" />
      </div>

      <form onSubmit={handleLoginSubmit} className="flex flex-col gap-5">
        <FormField
          id="auth-email"
          label="Email address"
          icon={<MailIcon width={18} height={18} />}
        >
          <input id="auth-email" type="email" placeholder="voyager@example.com" value={email} onChange={(e) => setEmail(sanitizeEmailInput(e.target.value))} autoComplete="email" className={`!pl-[46px] pr-[18px] py-[15px] ${authFieldSurfaceClass} ${authFieldBaseClass}`} />
        </FormField>

        <FormField
          id="auth-password"
          label={
            <div className="flex justify-between items-center w-full">
              <span>Password</span>
              <Link href="/forgot-password" className="bg-none border-none text-secondary font-bold text-xs cursor-pointer transition-colors duration-160 hover:text-text-primary no-underline">
                Forgot password?
              </Link>
            </div>
          }
          icon={<LockIcon width={18} height={18} />}
          trailing={
            <button type="button" className="absolute right-3.5 flex items-center justify-center w-8.5 h-8.5 bg-none border-none text-text-soft cursor-pointer rounded-sm transition-all duration-160 hover:text-secondary hover:bg-[rgba(215,122,97,0.06)]" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>
              {showPassword ? <EyeOffIcon width={18} height={18} /> : <EyeIcon width={18} height={18} />}
            </button>
          }
        >
          <input id="auth-password" type={showPassword ? "text" : "password"} placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" className={`!pl-[46px] !pr-14 py-[15px] ${authFieldSurfaceClass} ${authFieldBaseClass}`} />
        </FormField>

        {resetNotice && <div className="p-3 rounded-sm bg-[rgba(32,178,170,0.08)] border border-[rgba(32,178,170,0.22)] text-text-primary text-[0.86rem] font-semibold leading-relaxed text-center [animation:auth-field-in_0.25s_ease_both]" role="status">{resetNotice}</div>}
        {auth.error && <div className="p-3 rounded-sm bg-status-danger/[0.06] border border-status-danger/[0.18] text-status-danger text-[0.86rem] font-semibold leading-relaxed text-center [animation:auth-field-in_0.25s_ease_both]" role="alert">{auth.error.message}</div>}

        <button type="submit" className="w-full mt-2 inline-flex items-center justify-center gap-2 min-h-[54px] px-7 py-4 rounded-pill font-extrabold bg-accent text-white hover:-translate-y-0.5 transition cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed disabled:transform-none" disabled={auth.loading}>
          {auth.loading ? "Signing in…" : "Sign in to Voyage"}
        </button>
      </form>
    </>
  );
}
