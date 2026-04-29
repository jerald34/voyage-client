"use client";

export default function SuggestedPrompts({ onSelect }) {
  const prompts = [
    "Build a food-focused Tokyo plan",
    "Find luxury hotels in Kyoto",
    "Plan a 3-day adventure in Hokkaido",
    "Show me kid-friendly spots in Osaka"
  ];

  return (
    <div className="suggested-prompts">
      <span className="prompts-label">Suggested:</span>
      <div className="prompts-list">
        {prompts.map((prompt, index) => (
          <button 
            key={index} 
            className="prompt-chip"
            onClick={() => onSelect(prompt)}
          >
            {prompt}
          </button>
        ))}
      </div>

      <style jsx>{`
        .suggested-prompts {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 16px 24px;
        }

        .prompts-label {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--voyage-text-soft);
        }

        .prompts-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .prompt-chip {
          padding: 8px 16px;
          background: white;
          border: 1px solid var(--voyage-border);
          border-radius: var(--voyage-radius-pill);
          font-size: 12px;
          font-weight: 600;
          color: var(--voyage-primary);
          cursor: pointer;
          transition: all 0.2s;
        }

        .prompt-chip:hover {
          border-color: var(--voyage-secondary);
          background: rgba(215, 122, 97, 0.05);
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
}
