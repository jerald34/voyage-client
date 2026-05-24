"use client";
import { useState } from "react";
import Modal from "@/app/components/ui/Modal";
import { inviteMember } from "@/app/lib/api/index.js";

export default function InviteMemberModal({ agencyId, onClose, onInvited }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("STAFF");
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Email is required.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await inviteMember(agencyId, { email: email.trim(), role });
      await onInvited?.();
    } catch (err) {
      setError(err?.message || "Failed to invite member.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Invite member" size="sm">
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <label className="grid gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-white/55">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="colleague@example.com"
            required
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none"
          />
        </label>

        <fieldset className="grid gap-2">
          <legend className="text-xs font-semibold uppercase tracking-wide text-white/55">Role</legend>
          {["ADMIN", "STAFF"].map((r) => (
            <label key={r} className="flex cursor-pointer items-center gap-2 text-sm text-white/80">
              <input
                type="radio"
                name="invite-role"
                value={r}
                checked={role === r}
                onChange={() => setRole(r)}
                className="accent-white/80"
              />
              {r}
            </label>
          ))}
        </fieldset>

        {error && (
          <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-300" role="alert">
            {error}
          </p>
        )}
      </form>

      <footer className="mt-4 flex justify-end gap-2.5">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/70 hover:bg-white/5"
          disabled={saving}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving || !email.trim()}
          className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Inviting…" : "Invite"}
        </button>
      </footer>
    </Modal>
  );
}
