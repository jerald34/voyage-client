/**
 * Empty state placeholder with icon and message.
 *
 * @param {React.ReactNode} [icon] - Optional icon element.
 * @param {string} title - Primary message.
 * @param {string} [description] - Optional secondary text.
 * @param {React.ReactNode} [action] - Optional CTA button.
 * @param {string} [className]
 */
export default function EmptyState({
  icon,
  title,
  description,
  action,
  className = "",
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 py-8 px-5 text-text-soft text-center ${className}`}
    >
      {icon && <div className="text-text-soft">{icon}</div>}
      <p className="text-[0.9rem] m-0 leading-relaxed font-semibold">
        {title}
      </p>
      {description && (
        <p className="text-[0.82rem] m-0 leading-relaxed opacity-70">
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
