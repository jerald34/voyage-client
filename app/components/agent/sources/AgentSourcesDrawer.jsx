"use client";

export default function AgentSourcesDrawer({ sources = [] }) {
  if (sources.length === 0) return null;

  return (
    <div className="px-4 py-4">
      <h3 className="text-[10px] uppercase tracking-[0.1em] text-text-soft font-extrabold mb-3">
        Knowledge Sources
      </h3>
      <div className="flex flex-col gap-3">
        {sources.map((source, index) => {
          const hasUrl = Boolean(source.url);
          const hostname = hasUrl
            ? (() => { try { return new URL(source.url).hostname; } catch { return source.url; } })()
            : null;
          const Tag = hasUrl ? 'a' : 'div';
          const linkProps = hasUrl ? { href: source.url, target: '_blank', rel: 'noopener noreferrer' } : {};
          return (
            <Tag
              key={index}
              {...linkProps}
              className="block p-3 bg-white border border-border rounded-[8px] no-underline text-inherit transition-all hover:border-secondary hover:-translate-y-px hover:shadow-soft"
            >
              <div className="flex justify-between items-start gap-2 mb-1">
                <span className="text-[13px] font-bold text-primary">{source.title}</span>
                {hasUrl && (
                  <svg
                    className="text-text-soft shrink-0 mt-0.5"
                    viewBox="0 0 24 24"
                    width="12"
                    height="12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                  </svg>
                )}
              </div>
              {source.snippet && (
                <p className="text-[11px] text-text-muted leading-snug mb-2 line-clamp-2">
                  {source.snippet}
                </p>
              )}
              {hostname && (
                <span className="text-[10px] font-semibold text-secondary">{hostname}</span>
              )}
              {source.sourceType && (
                <span className="ml-2 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-background text-text-soft">
                  {source.sourceType}
                </span>
              )}
            </Tag>
          );
        })}
      </div>
    </div>
  );
}
