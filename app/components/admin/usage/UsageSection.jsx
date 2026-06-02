"use client";
import { useEffect, useState, useCallback } from "react";
import { fetchUsage } from "../../../lib/api/admin.js";
import UsageStatCards from "./UsageStatCards.jsx";
import UsageBarChart from "./UsageBarChart.jsx";
import UsageTable from "./UsageTable.jsx";

const PERIODS = [["day", "Day"], ["week", "Week"], ["month", "Month"]];
const GROUPS = [["user", "By user"], ["agency", "By agency"]];

function Toggle({ options, value, onChange, ariaLabel }) {
  return (
    <div role="group" aria-label={ariaLabel} className="inline-flex gap-1 rounded-pill bg-surface p-1">
      {options.map(([val, label]) => (
        <button key={val} type="button" onClick={() => onChange(val)}
          className={`min-h-11 rounded-pill px-3 py-1.5 text-sm font-semibold transition active:scale-[0.97] motion-reduce:transition-none ${value === val ? "bg-primary text-white" : "text-text-muted hover:text-text-primary"}`}>
          {label}
        </button>
      ))}
    </div>
  );
}

export default function UsageSection() {
  const [period, setPeriod] = useState("day");
  const [groupBy, setGroupBy] = useState("user");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setData(await fetchUsage({ period, groupBy })); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [period, groupBy]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Toggle options={PERIODS} value={period} onChange={setPeriod} ariaLabel="Time period" />
        <Toggle options={GROUPS} value={groupBy} onChange={setGroupBy} ariaLabel="Group by" />
      </div>
      {loading && <div className="py-16 text-center text-sm text-text-muted">Loading usage…</div>}
      {error && <div className="rounded-sm bg-status-danger/8 text-status-danger text-sm p-4 text-center">{error}</div>}
      {!loading && !error && data && (
        <>
          <UsageStatCards totals={data.totals} />
          <UsageBarChart series={data.series} metric="totalTokens" />
          <UsageTable rows={data.rows} />
        </>
      )}
    </div>
  );
}
