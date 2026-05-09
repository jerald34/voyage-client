"use client";

const statusConfig = {
  PENDING_REVIEW: {
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--voyage-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    title: "Your application is under review",
    description: "We're reviewing your agency registration. This usually takes 1-2 business days. You'll be able to access your workspace once approved.",
  },
  REJECTED: {
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d44" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
    title: "Application not approved",
    description: "Unfortunately, your agency registration was not approved.",
  },
  SUSPENDED: {
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#e67e22" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    title: "Agency suspended",
    description: "Your agency has been suspended by an administrator.",
  },
};

function DetailRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="agency-status-detail-row">
      <span className="agency-status-detail-label">{label}</span>
      <span className="agency-status-detail-value">{value}</span>
    </div>
  );
}

export default function AgencyStatusScreen({ agency, user, onLogout }) {
  const config = statusConfig[agency.status] || statusConfig.PENDING_REVIEW;

  return (
    <main className="system-shell">
      <div className="system-grain" aria-hidden="true" />
      <div className="agency-status-page">
        <div className="agency-status-card">
          <div className="agency-status-icon">{config.icon}</div>
          <h1 className="agency-status-title">{config.title}</h1>
          <p className="agency-status-description">{config.description}</p>

          {agency.status === "REJECTED" && agency.rejectionReason && (
            <div className="agency-status-reason">
              <strong>Reason:</strong> {agency.rejectionReason}
            </div>
          )}

          {agency.status === "SUSPENDED" && agency.suspensionReason && (
            <div className="agency-status-reason">
              <strong>Reason:</strong> {agency.suspensionReason}
            </div>
          )}

          <div className="agency-status-details">
            <h3 className="agency-status-details-heading">Submitted details</h3>
            <DetailRow label="Agency" value={agency.name} />
            {user && <DetailRow label="Account" value={user.email} />}
          </div>

          <button type="button" className="button button-secondary agency-status-logout" onClick={onLogout}>
            Sign out
          </button>
        </div>
      </div>
    </main>
  );
}
