"use client";

export default function AgentTaskList({ tasks = [] }) {
  if (tasks.length === 0) return null;

  const getStatusDot = (status) => {
    switch (status?.toLowerCase()) {
      case 'running':
        return 'w-1.5 h-1.5 rounded-full bg-secondary animate-pulse shadow-[0_0_8px_rgb(var(--color-secondary))]';
      case 'completed':
        return 'w-1.5 h-1.5 rounded-full bg-[#2c7a7b]';
      default:
        return 'w-1.5 h-1.5 rounded-full bg-border';
    }
  };

  return (
    <div className="px-4 py-4 border-b border-border">
      <h3 className="text-[10px] uppercase tracking-[0.1em] text-text-soft font-extrabold mb-3">
        Execution Steps
      </h3>
      <ul className="list-none p-0 m-0 flex flex-col gap-2">
        {tasks.map((task, index) => (
          <li key={index} className="flex items-center gap-2.5 text-xs text-text-muted">
            <span className={getStatusDot(task.status)}></span>
            <span className={`flex-grow ${task.status?.toLowerCase() === 'completed' ? 'line-through opacity-50' : ''}`}>
              {task.label}
            </span>
            <span className="text-[10px] font-bold uppercase opacity-60">{task.status}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
