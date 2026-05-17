/**
 * Status badge/chip used across dashboard pages.
 *
 * @param {"approved"|"pending"|"saved"|"draft"|"default"} [variant="default"]
 * @param {"sm"|"md"} [size="sm"]
 * @param {React.ReactNode} children
 * @param {string} [className]
 */
export default function StatusBadge({
  variant = "default",
  size = "sm",
  children,
  className = "",
}) {
  const sizeClasses =
    size === "md"
      ? "text-[0.72rem] px-2.5 py-1"
      : "text-[0.65rem] px-2 py-1";

  const variantClasses = {
    approved:
      "bg-[#f0fdf4] text-[#166534] border border-[#dcfce7]",
    pending:
      "bg-[#fef9c3] text-[#854d0e] border border-[#fef08a]",
    saved:
      "bg-secondary/10 text-secondary border border-secondary/20",
    draft:
      "bg-border/[0.06] text-text-primary border border-border/[0.08]",
    default:
      "bg-border/[0.06] text-text-primary border border-border/[0.08]",
  };

  const cls = variantClasses[variant] ?? variantClasses.default;

  return (
    <span
      className={`inline-flex items-center gap-1 w-fit rounded-[6px] font-extrabold tracking-[0.05em] uppercase ${sizeClasses} ${cls} ${className}`}
    >
      {children}
    </span>
  );
}
