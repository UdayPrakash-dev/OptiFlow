// WHY: Badge visually communicates status, priority, or severity levels.
// Simplified traditional flat design for better readability.

const THEMES = {
  // Status themes
  active: "bg-green-100 text-green-800",
  approved: "bg-green-100 text-green-800",
  operational: "bg-green-100 text-green-800",
  completed: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  review: "bg-yellow-100 text-yellow-800",
  failed: "bg-red-100 text-red-800",
  blocked: "bg-red-100 text-red-800",
  danger: "bg-red-100 text-red-800",
  info: "bg-blue-100 text-blue-800",
  draft: "bg-gray-100 text-gray-800",

  // Priority themes
  low: "bg-gray-100 text-gray-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",

  // Severity themes
  critical: "bg-red-100 text-red-800",

  // Default fallback
  default: "bg-gray-100 text-gray-800",
};

export const Badge = ({
  value,
  children,
  type = "status",
  status,
  variant,
  pulse = false,
  dot = false, // Ignored in simple design
  className = "",
  ...props
}) => {
  const content = value ?? children ?? "";
  
  const statusKey = String(status || variant || content).toLowerCase().trim().replace(/[\s-]/g, "_");
  
  const themeMap = {
    error: 'failed',
    success: 'active',
    neutral: 'default',
    warning: 'pending',
    danger: 'critical',
    info: 'info'
  };
  
  const mappedKey = themeMap[statusKey] || statusKey;
  const baseClasses = THEMES[mappedKey] || THEMES.default;
  
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${baseClasses} ${className}`}
      {...props}
    >
      {content}
    </span>
  );
};

export default Badge;
