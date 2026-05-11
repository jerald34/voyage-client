"use client";
import { useState } from 'react';

export default function AgentToolCallList({ toolCalls = [] }) {
  const [expandedId, setExpandedId] = useState(null);

  if (toolCalls.length === 0) return null;

  const getBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'running':
        return 'bg-[#fff4e5] text-[#b7791f]';
      case 'completed':
        return 'bg-[#e6fffa] text-[#2c7a7b]';
      default:
        return 'bg-background text-text-muted';
    }
  };

  return (
    <div className="px-4 py-4">
      <h3 className="text-[10px] uppercase tracking-[0.1em] text-text-soft font-extrabold mb-3">
        Tool Inspections
      </h3>
      <div className="flex flex-col gap-2.5">
        {toolCalls.map((tool, index) => (
          <div key={index} className="border border-border rounded-[6px] overflow-hidden bg-white">
            <div
              className="px-3 py-2.5 flex justify-between items-center cursor-pointer bg-black/[0.02] hover:bg-black/[0.04] transition-colors"
              onClick={() => setExpandedId(expandedId === index ? null : index)}
            >
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-xs text-primary font-semibold">{tool.name}</span>
                <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${getBadgeClass(tool.status)}`}>
                  {tool.status}
                </span>
              </div>
              <span className="font-mono text-base text-text-soft">
                {expandedId === index ? '−' : '+'}
              </span>
            </div>

            {expandedId === index && (
              <div className="px-3 py-3 border-t border-border bg-[#fdfdfd] flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] uppercase font-extrabold text-text-soft">Input</span>
                  <pre className="font-mono text-[11px] bg-[#1e293b] text-[#e2e8f0] px-2.5 py-2.5 rounded m-0 overflow-x-auto leading-snug">
                    {JSON.stringify(tool.input, null, 2)}
                  </pre>
                </div>
                {tool.output && (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[9px] uppercase font-extrabold text-text-soft">Output</span>
                    <pre className="font-mono text-[11px] bg-[#1e293b] text-[#e2e8f0] px-2.5 py-2.5 rounded m-0 overflow-x-auto leading-snug">
                      {JSON.stringify(tool.output, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
