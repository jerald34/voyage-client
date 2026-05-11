"use client";
import ItineraryItemRow from './ItineraryItemRow';

export default function ItineraryDayPanel({ dayNumber, date, title, items = [] }) {
  return (
    <div className="mb-6 border border-border rounded-[8px] overflow-hidden bg-white shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
      <header className="px-4 py-3 bg-background border-b border-border flex justify-between items-center">
        <div className="font-serif text-lg text-primary">
          Day {dayNumber}{title ? ` — ${title}` : ''}
        </div>
        <div className="text-xs font-bold text-text-soft uppercase tracking-[0.05em]">{date}</div>
      </header>
      <div>
        {items.length > 0 ? (
          items.map((item, index) => (
            <ItineraryItemRow key={index} item={item} />
          ))
        ) : (
          <div className="px-6 py-6 text-center text-[13px] text-text-soft italic">
            No items scheduled for this day yet.
          </div>
        )}
      </div>
    </div>
  );
}
