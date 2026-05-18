/**
 * Form field wrapper with label, optional icon, input, and error message.
 *
 * @param {string} id - HTML id for the input element.
 * @param {string} label - Field label text.
 * @param {React.ReactNode} [icon] - Optional leading icon SVG.
 * @param {string} [error] - Error message to display below the field.
 * @param {boolean} [required] - Show required asterisk.
 * @param {string} [className] - Additional wrapper classes.
 * @param {React.ReactNode} children - The input/select element.
 * @param {React.ReactNode} [trailing] - Optional trailing element (e.g. show/hide button).
 * @param {string} [animationClass] - Animation class for the field.
 */

const fieldSurfaceClass =
  "border border-border rounded-md bg-[rgba(255,255,255,0.88)] dark:bg-[rgba(26,29,33,0.88)]";

const fieldBaseClass =
  "w-full text-[16px] leading-[1.25] font-medium text-text-primary shadow-inner " +
  "transition-all duration-160 focus:outline-none " +
  "focus:border-[rgba(32,178,170,0.6)] focus:shadow-[0_0_0_4px_rgba(32,178,170,0.12)] " +
  "placeholder:text-text-soft placeholder:font-normal";

export { fieldSurfaceClass, fieldBaseClass };

export default function FormField({
  id,
  label,
  icon,
  error,
  required = false,
  className = "",
  children,
  trailing,
  animationClass = "[animation:auth-field-in_0.35s_ease_both]",
}) {
  return (
    <div className={`flex flex-col gap-[7px] ${animationClass} ${className}`}>
      <label
        htmlFor={id}
        className="text-text-primary text-[0.86rem] font-bold"
      >
        {label}
        {required && <span className="text-status-danger"> *</span>}
      </label>
      <div className="relative flex items-center">
        {icon && (
          <span className="absolute left-4 text-text-soft pointer-events-none transition-colors duration-200">
            {icon}
          </span>
        )}
        {children}
        {trailing && trailing}
      </div>
      {error && (
        <span className="text-[0.8rem] text-status-danger mt-0.5">
          {error}
        </span>
      )}
    </div>
  );
}
