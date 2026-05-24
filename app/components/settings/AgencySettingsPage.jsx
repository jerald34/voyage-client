"use client";
import { useEffect, useMemo, useState } from "react";
import { updateAgencySettings } from "@/app/lib/api/index.js";
import { fetchTeam } from "@/app/lib/api/index.js";
import { useAgencyRole } from "@/app/hooks/useAgencyRole";
import DangerZoneCard from "./DangerZoneCard";

function sanitizePhone(value) {
  return String(value ?? "").replace(/\D/g, "");
}

function getFieldClass() {
  return [
    "mt-2 w-full rounded-2xl border px-4 py-3 text-sm outline-none transition",
    "bg-white/5 text-white placeholder:text-white/30",
    "border-white/10 focus:border-white/20 focus:ring-1 focus:ring-white/10 focus:outline-none",
  ].join(" ");
}

export default function AgencySettingsPage({ agencyId }) {
  const role = useAgencyRole(agencyId);

  // Read agency from localStorage so the form is pre-populated without a round-trip
  const initialAgency = useMemo(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem("voyage-user");
      const user = raw ? JSON.parse(raw) : null;
      if (!Array.isArray(user?.memberships)) return null;
      const m = user.memberships.find((m) => m.agencyId === agencyId);
      return m?.agency ?? null;
    } catch {
      return null;
    }
  }, [agencyId]);

  const [agencyName, setAgencyName] = useState(initialAgency?.name ?? "");
  const [businessPhone, setBusinessPhone] = useState(sanitizePhone(initialAgency?.businessPhone));
  const [businessEmail, setBusinessEmail] = useState(initialAgency?.businessEmail ?? "");
  const [city, setCity] = useState(initialAgency?.city ?? "");
  const [country, setCountry] = useState(initialAgency?.country ?? "");

  const [savedValues, setSavedValues] = useState({
    agencyName: initialAgency?.name ?? "",
    businessPhone: sanitizePhone(initialAgency?.businessPhone),
    businessEmail: initialAgency?.businessEmail ?? "",
    city: initialAgency?.city ?? "",
    country: initialAgency?.country ?? "",
  });

  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Team data for Danger Zone
  const [teamData, setTeamData] = useState({ members: [], viewerRole: null });

  useEffect(() => {
    fetchTeam(agencyId)
      .then((data) => setTeamData(data))
      .catch(() => {});
  }, [agencyId]);

  const hasChanges =
    agencyName.trim() !== savedValues.agencyName ||
    businessPhone.trim() !== savedValues.businessPhone ||
    businessEmail.trim() !== savedValues.businessEmail ||
    city.trim() !== savedValues.city ||
    country.trim() !== savedValues.country;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const name = agencyName.trim();
    const phone = sanitizePhone(businessPhone);
    const email = businessEmail.trim();
    const cityVal = city.trim();
    const countryVal = country.trim();

    if (!name) { setFormError("Agency name is required."); return; }
    if (!phone) { setFormError("Business phone is required."); return; }
    if (!cityVal) { setFormError("City is required."); return; }
    if (!countryVal) { setFormError("Country is required."); return; }

    setFormError(null);
    setSaving(true);
    setSaveSuccess(false);
    try {
      await updateAgencySettings(agencyId, {
        name,
        businessPhone: phone,
        businessEmail: email,
        city: cityVal,
        country: countryVal,
      });
      setSavedValues({ agencyName: name, businessPhone: phone, businessEmail: email, city: cityVal, country: countryVal });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setFormError(err?.message || "Unable to save settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <header className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">Workspace</p>
        <h1 className="mt-1 text-2xl font-semibold text-white tracking-tight">Agency settings</h1>
      </header>

      <section className="rounded-[24px] border border-white/8 bg-white/[0.02] p-5">
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-white/50">Agency name</span>
              <input
                className={getFieldClass()}
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                placeholder="Your agency name"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-white/50">Business phone</span>
              <input
                className={getFieldClass()}
                value={businessPhone}
                onChange={(e) => setBusinessPhone(sanitizePhone(e.target.value))}
                placeholder="Digits only"
                inputMode="numeric"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-white/50">Business email</span>
              <input
                className={getFieldClass()}
                type="email"
                value={businessEmail}
                onChange={(e) => setBusinessEmail(e.target.value)}
                placeholder="contact@agency.com"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-white/50">City</span>
              <input
                className={getFieldClass()}
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Enter city"
              />
            </label>

            <label className="block md:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-white/50">Country</span>
              <input
                className={getFieldClass()}
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Enter country"
              />
            </label>
          </div>

          {formError && (
            <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-300" role="alert">
              {formError}
            </p>
          )}
          {saveSuccess && (
            <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
              Settings saved.
            </p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving || !hasChanges}
              className="rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </section>

      {role === "OWNER" && (
        <DangerZoneCard
          agencyId={agencyId}
          agencyName={savedValues.agencyName || agencyName}
          members={teamData.members}
        />
      )}
    </div>
  );
}
