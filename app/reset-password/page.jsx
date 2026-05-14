"use client";

import Link from "next/link";

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen px-5 py-7 flex items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(34,56,67,0.16),_transparent_32%),linear-gradient(180deg,_rgba(248,247,245,0.98),_rgba(239,241,243,0.94))]">
      <div className="w-full max-w-[560px] rounded-3xl border border-border bg-white/92 dark:bg-surface-elevated/90 shadow-strong overflow-hidden">
        <div className="p-8 sm:p-10 border-b border-border/70">
          <p className="text-secondary font-bold uppercase tracking-[0.18em] text-[0.72rem] mb-3">Account recovery</p>
          <h1 className="text-[clamp(1.8rem,3vw,2.4rem)] leading-tight mb-3">Password reset is not available here</h1>
          <p className="text-text-muted text-[1rem] leading-[1.7] max-w-[40ch]">
            This deployment uses a non-email fallback. Password changes must be handled by the app owner or an admin.
          </p>
        </div>

        <div className="p-8 sm:p-10">
          <div className="rounded-2xl border border-[rgba(32,178,170,0.22)] bg-[rgba(32,178,170,0.08)] p-5 text-text-primary">
            <p className="font-bold mb-2">Next step</p>
            <p className="text-sm leading-7 text-text-muted">
              Contact the person who manages the Voyage deployment and ask them to reset your password manually.
            </p>
            <Link href="/forgot-password" className="inline-flex mt-5 text-secondary font-bold text-sm no-underline hover:underline">
              See recovery instructions
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
