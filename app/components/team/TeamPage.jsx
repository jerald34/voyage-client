"use client";
import { useEffect, useState } from "react";
import { fetchTeam } from "@/app/lib/api/index.js";
import MemberRow from "./MemberRow";
import InviteMemberModal from "./InviteMemberModal";
import ChangeRoleModal from "./ChangeRoleModal";
import RemoveMemberModal from "./RemoveMemberModal";

export default function TeamPage({ agencyId }) {
  const [data, setData] = useState({ members: [], viewerRole: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [removing, setRemoving] = useState(null);

  // One-time toast for STAFF redirected from Settings
  const [settingsDeniedNotice, setSettingsDeniedNotice] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const flag = sessionStorage.getItem("voyage:settingsDeniedToast");
      if (flag) {
        sessionStorage.removeItem("voyage:settingsDeniedToast");
        setSettingsDeniedNotice(true);
      }
    } catch {}
  }, []);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchTeam(agencyId);
      setData(result);
    } catch (err) {
      setError(err?.message || "Failed to load team.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agencyId]);

  const canInvite = data.viewerRole === "OWNER" || data.viewerRole === "ADMIN";

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      {settingsDeniedNotice && (
        <div className="mb-4 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
          Settings are managed by your owner and admins.
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl text-white">Team</h1>
        {canInvite && (
          <button
            type="button"
            className="rounded bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/15"
            onClick={() => setInviteOpen(true)}
          >
            Invite member
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border border-white/5 bg-white/[0.02]">
        {loading ? (
          <div className="px-4 py-8 text-center text-white/55">Loading&hellip;</div>
        ) : error ? (
          <div className="px-4 py-8 text-center text-rose-300/70 text-sm">{error}</div>
        ) : data.members.length === 0 ? (
          <div className="px-4 py-8 text-center text-white/40 text-sm">No members yet.</div>
        ) : (
          data.members.map((m) => (
            <MemberRow
              key={m.id}
              member={m}
              viewerRole={data.viewerRole}
              onChangeRole={(member) => setEditing(member)}
              onRemove={(member) => setRemoving(member)}
            />
          ))
        )}
      </div>

      {inviteOpen && (
        <InviteMemberModal
          agencyId={agencyId}
          onClose={() => setInviteOpen(false)}
          onInvited={async () => {
            setInviteOpen(false);
            await refresh();
          }}
        />
      )}
      {editing && (
        <ChangeRoleModal
          agencyId={agencyId}
          member={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await refresh();
          }}
        />
      )}
      {removing && (
        <RemoveMemberModal
          agencyId={agencyId}
          member={removing}
          onClose={() => setRemoving(null)}
          onRemoved={async () => {
            setRemoving(null);
            await refresh();
          }}
        />
      )}
    </div>
  );
}
