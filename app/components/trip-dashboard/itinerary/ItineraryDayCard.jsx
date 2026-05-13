import React from "react";

export default function ItineraryDayCard({ day }) {
  const items = Array.isArray(day?.items) ? day.items : [];

  return (
    <article className="border border-border/[0.12] rounded-[10px] p-3 bg-white grid gap-2.5">
      <header className="flex justify-between gap-2 items-center">
        <strong className="text-[13px] text-text-primary">Day {day?.dayNumber ?? "-"}</strong>
        <span className="text-[12px] font-semibold uppercase tracking-[0.05em] text-text-muted">{day?.title || "Untitled day"}</span>
      </header>

      {items.length === 0 ? (
        <p className="m-0 text-text-soft text-[13px]">No activities generated for this day yet.</p>
      ) : (
        <ul className="m-0 p-0 list-none grid gap-2">
          {items.slice(0, 5).map((item, index) => (
            <li key={`${day?.dayNumber ?? "day"}-${index}`} className="border border-border/[0.06] rounded-[8px] p-2 bg-background/50 grid gap-1.5">
              <div className="flex gap-2 items-center">
                <span className="text-[10px] font-bold py-[3px] px-1.5 rounded-pill border border-border/[0.12] text-text-muted bg-surface">{item.type || "ACTIVITY"}</span>
                <strong className="text-[13px] text-text-primary">{item.title || "Untitled activity"}</strong>
              </div>
              {item.description ? <p className="m-0 text-[12px] text-text-muted leading-[1.35]">{item.description}</p> : null}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
