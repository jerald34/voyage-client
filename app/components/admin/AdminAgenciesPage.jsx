"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchAllAgencies } from "../../lib/api/index.js";
import { Spinner } from "../ui/index.js";
import { SearchIcon } from "../icons/index.js";
import AgencyDetailModal from "./AgencyDetailModal.jsx";
import AgencyTable from "./AgencyTable.jsx";

export default function AdminAgenciesPage({ onPendingCountChange }) {
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState("submittedAt");
  const [sortDir, setSortDir] = useState("desc");
  const [selectedAgencyId, setSelectedAgencyId] = useState(null);

  // Fetch agencies
  const loadAgencies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filter = statusFilter === "ALL" ? undefined : statusFilter;
      const data = await fetchAllAgencies(filter);
      setAgencies(data.agencies || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadAgencies();
  }, [loadAgencies]);

  // Filter by search
  const filtered = agencies.filter((a) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (a.name && a.name.toLowerCase().includes(q)) ||
      (a.ownerUser?.email && a.ownerUser.email.toLowerCase().includes(q)) ||
      (a.ownerUser?.displayName &&
        a.ownerUser.displayName.toLowerCase().includes(q)) ||
      (a.businessEmail && a.businessEmail.toLowerCase().includes(q))
    );
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    let aVal, bVal;
    if (sortField === "name") {
      aVal = (a.name || "").toLowerCase();
      bVal = (b.name || "").toLowerCase();
    } else if (sortField === "contact") {
      aVal = (a.ownerUser?.displayName || a.ownerUser?.email || "").toLowerCase();
      bVal = (b.ownerUser?.displayName || b.ownerUser?.email || "").toLowerCase();
    } else if (sortField === "status") {
      aVal = (a.status || "").toLowerCase();
      bVal = (b.status || "").toLowerCase();
    } else if (sortField === "submittedAt") {
      aVal = a.submittedAt || "";
      bVal = b.submittedAt || "";
    } else {
      return 0;
    }
    if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const handleAction = () => {
    loadAgencies();
    onPendingCountChange?.();
  };

  return (
    <div className="px-4 py-6 sm:px-8 sm:py-8 max-w-[1100px] mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h1 className="font-serif text-3xl text-text-primary">
          Agency Management
        </h1>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
              <SearchIcon width={18} height={18} className="text-text-muted" />
            </div>
            <input
              type="text"
              placeholder="Search agencies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 pl-10 pr-4 py-2.5 rounded-pill bg-surface border border-border/12 text-sm text-text-primary placeholder:text-text-soft focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-colors"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 rounded-pill bg-surface border border-border/12 text-sm text-text-primary focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-colors appearance-none cursor-pointer bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239ca3af%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-10"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING_REVIEW">Pending</option>
            <option value="VERIFIED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-16 text-text-muted text-sm">
          <Spinner size="md" className="mr-3 text-primary" />
          Loading agencies...
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-sm bg-status-danger/8 text-status-danger text-sm p-4 text-center">
          {error}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && sorted.length === 0 && (
        <div className="text-center py-16 text-text-muted text-sm">
          {searchQuery.trim()
            ? "No agencies match your search."
            : "No agencies found."}
        </div>
      )}

      {/* Data Table */}
      {!loading && !error && sorted.length > 0 && (
        <AgencyTable
          agencies={agencies}
          sorted={sorted}
          sortField={sortField}
          sortDir={sortDir}
          onSort={handleSort}
          selectedAgencyId={selectedAgencyId}
          onRowClick={setSelectedAgencyId}
        />
      )}

      {/* Detail Modal */}
      {selectedAgencyId && (
        <AgencyDetailModal
          agencyId={selectedAgencyId}
          onClose={() => setSelectedAgencyId(null)}
          onAction={handleAction}
        />
      )}
    </div>
  );
}
