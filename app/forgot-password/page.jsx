"use client";

import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen px-5 py-7 flex items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(216,180,160,0.16),_transparent_35%),linear-gradient(180deg,_rgba(248,247,245,0.98),_rgba(239,241,243,0.94))]">
      <div className="w-full max-w-[520px] rounded-3xl border border-border bg-white/92 dark:bg-surface-elevated/90 shadow-strong overflow-hidden">
        <div className="p-8 sm:p-10 border-b border-border/70">
          <Link href="/login" className="inline-flex items-center gap-2 text-text-muted text-xs font-bold no-underline hover:text-secondary transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to sign in
          </Link>

          <div className="mt-6">
            <p className="text-secondary font-bold uppercase tracking-[0.18em] text-[0.72rem] mb-3">Account recovery</p>
            <h1 className="text-[clamp(1.8rem,3vw,2.4rem)] leading-tight mb-3">Forgot your password?</h1>
            <p className="text-text-muted text-[1rem] leading-[1.7] max-w-[36ch]">
              This deployment does not support self-serve password reset by email.
            </p>
          </div>
        </div>

        <div className="p-8 sm:p-10">
          <div className="rounded-2xl border border-[rgba(32,178,170,0.22)] bg-[rgba(32,178,170,0.08)] p-5 text-text-primary">
            <p className="font-bold mb-2">How to recover access</p>
            <div className="text-sm leading-7 text-text-muted space-y-3">
              <p>
                If you are the only user on the account, ask the person who deployed Voyage to reset the password from the server side or update the account directly in the database.
              </p>
              <p>
                If this is an agency account, ask your agency admin or app owner to set a new password for you and share it through a secure channel.
              </p>
              <p>
                If you want self-serve password recovery later, you will need a verified sending domain for email delivery.
              </p>
            </div>
            <Link href="/login" className="inline-flex mt-5 text-secondary font-bold text-sm no-underline hover:underline">
              Return to sign in
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
