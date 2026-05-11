"use client";

export default function SuggestedPrompts({ onSelect }) {
  const prompts = [
    "Build a food-focused Tokyo plan",
    "Find luxury hotels in Kyoto",
    "Plan a 3-day adventure in Hokkaido",
    "Show me kid-friendly spots in Osaka"
  ];

  return (
    <div className="flex flex-col gap-3 px-6 py-4">
      <span className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-text-soft">
        Suggested:
      </span>
      <div className="flex flex-wrap gap-2">
        {prompts.map((prompt, index) => (
          <button
            key={index}
            onClick={() => onSelect(prompt)}
            className="px-4 py-2 bg-surface border border-border/20 rounded-pill text-xs font-semibold text-primary cursor-pointer transition-all hover:border-secondary hover:bg-secondary/5 hover:-translate-y-px"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}
