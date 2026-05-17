"use client";

import { SortIcon } from "../icons/index.js";

const statusLabel = (s) => {
  if (s === "PENDING_REVIEW") return "Pending";
  if (s === "VERIFIED") return "Approved";
  if (s === "REJECTED") return "Rejected";
  if (s === "SUSPENDED") return "Suspended";
  return s;
};

const statusPillClasses = (s) => {
  if (s === "PENDING_REVIEW") return "bg-accent/10 text-accent";
  if (s === "VERIFIED") return "bg-status-success/10 text-status-success";
  if (s === "REJECTED") return "bg-status-danger/10 text-status-danger";
  if (s === "SUSPENDED") return "bg-status-warning/10 text-status-warning";
  return "bg-surface text-text-muted";
};

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function SortableHeader({ label, field, currentField, direction, onSort }) {
  const active = currentField === field;
  return (
    <th
      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-soft cursor-pointer select-none hover:text-text-primary transition-colors"
      onClick={() => onSort(field)}
    >
      {label}
      <SortIcon active={active} direction={active ? direction : "asc"} />
    </th>
  );
}

export default function AgencyTable({
  agencies,
  sorted,
  sortField,
  sortDir,
  onSort,
  selectedAgencyId,
  onRowClick,
}) {
  return (
    <div className="rounded-md overflow-hidden border border-border/12 shadow-soft">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface">
              <SortableHeader
                label="Agency Name"
                field="name"
                currentField={sortField}
                direction={sortDir}
                onSort={onSort}
              />
              <SortableHeader
                label="Contact"
                field="contact"
                currentField={sortField}
                direction={sortDir}
                onSort={onSort}
              />
              <SortableHeader
                label="Status"
                field="status"
                currentField={sortField}
                direction={sortDir}
                onSort={onSort}
              />
              <SortableHeader
                label="Submitted"
                field="submittedAt"
                currentField={sortField}
                direction={sortDir}
                onSort={onSort}
              />
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-soft">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/8">
            {sorted.map((a, index) => (
              <tr
                key={a.id}
                className={`cursor-pointer transition-colors hover:bg-primary/5 ${
                  index % 2 === 0 ? "" : "bg-surface/50"
                } ${selectedAgencyId === a.id ? "bg-primary/8" : ""}`}
                onClick={() => onRowClick(a.id)}
              >
                <td className="px-4 py-3.5 font-semibold text-text-primary whitespace-nowrap">
                  {a.name}
                </td>
                <td className="px-4 py-3.5 text-text-muted whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="text-text-primary text-sm">
                      {a.ownerUser?.displayName || "—"}
                    </span>
                    {a.ownerUser?.email && (
                      <span className="text-xs text-text-soft">
                        {a.ownerUser.email}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3.5 whitespace-nowrap">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-pill text-xs font-semibold tracking-wide ${statusPillClasses(
                      a.status
                    )}`}
                  >
                    {statusLabel(a.status)}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-text-muted whitespace-nowrap">
                  {formatDate(a.submittedAt)}
                </td>
                <td className="px-4 py-3.5 whitespace-nowrap">
                  <button
                    className="px-3 py-1.5 text-xs font-medium rounded-sm bg-surface border border-border/15 text-text-muted hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRowClick(a.id);
                    }}
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Table footer */}
      <div className="px-4 py-3 bg-surface border-t border-border/10 text-xs text-text-soft">
        Showing {sorted.length} of {agencies.length} agencies
      </div>
    </div>
  );
}
