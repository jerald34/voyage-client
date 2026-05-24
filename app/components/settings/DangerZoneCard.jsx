"use client";
import { useState } from "react";
import TransferOwnershipModal from "./TransferOwnershipModal";
import DeleteAgencyModal from "./DeleteAgencyModal";

export default function DangerZoneCard({ agencyId, agencyName, members }) {
  const [transferOpen, setTransferOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <div className="mt-12 rounded-lg border border-rose-400/20 bg-rose-500/[0.03] p-6">
      <h2 className="mb-2 text-sm uppercase tracking-wider text-rose-200/70">Danger zone</h2>
      <p className="mb-4 text-sm text-white/55">
        These actions affect the entire agency and cannot be undone.
      </p>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => setTransferOpen(true)}
          className="self-start rounded border border-white/10 px-3 py-1.5 text-sm text-white/75 hover:bg-white/5"
        >
          Transfer ownership&hellip;
        </button>
        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          className="self-start rounded border border-rose-400/30 px-3 py-1.5 text-sm text-rose-200/90 hover:bg-rose-500/10"
        >
          Delete agency&hellip;
        </button>
      </div>

      {transferOpen && (
        <TransferOwnershipModal
          agencyId={agencyId}
          members={members}
          onClose={() => setTransferOpen(false)}
        />
      )}
      {deleteOpen && (
        <DeleteAgencyModal
          agencyId={agencyId}
          agencyName={agencyName}
          onClose={() => setDeleteOpen(false)}
        />
      )}
    </div>
  );
}
