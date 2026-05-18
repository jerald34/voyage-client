/**
 * Reusable loading spinner component.
 *
 * @param {"sm"|"md"|"lg"} [size="md"] - Spinner diameter.
 * @param {string} [className] - Additional CSS classes.
 */
export default function Spinner({ size = "md", className = "" }) {
  const sizeClass =
    size === "sm"
      ? "w-4 h-4 border-[1.5px]"
      : size === "lg"
        ? "w-7 h-7 border-[3px]"
        : "w-5 h-5 border-2";

  return (
    <div
      className={`${sizeClass} border-border border-t-secondary rounded-full animate-spin flex-shrink-0 ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}
