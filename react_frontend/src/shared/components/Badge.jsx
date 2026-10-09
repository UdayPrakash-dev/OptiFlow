// WHY: Badge visually communicates status, priority, or severity levels across all 9 roles.
// Inset micro-rings and subtle indicator dots provide high-contrast visual depth without clutter.

const THEMES = {
  // Status themes
  active: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dot-emerald-500',
  approved: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dot-emerald-500',
  operational: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dot-emerald-500',
  completed: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dot-emerald-500',
  pending: 'bg-amber-50 text-amber-700 ring-amber-600/20 dot-amber-500',
  in_progress: 'bg-amber-50 text-amber-700 ring-amber-600/20 dot-amber-500',
  review: 'bg-amber-50 text-amber-700 ring-amber-600/20 dot-amber-500',
  failed: 'bg-rose-50 text-rose-700 ring-rose-600/20 dot-rose-500',
  blocked: 'bg-rose-50 text-rose-700 ring-rose-600/20 dot-rose-500',
  danger: 'bg-rose-50 text-rose-700 ring-rose-600/20 dot-rose-500',
  info: 'bg-sky-50 text-sky-700 ring-sky-600/20 dot-sky-500',
  draft: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20 dot-indigo-500',

  // Priority themes
  low: 'bg-slate-50 text-slate-700 ring-slate-600/20 dot-slate-400',
  medium: 'bg-amber-50 text-amber-700 ring-amber-600/20 dot-amber-500',
  high: 'bg-orange-50 text-orange-700 ring-orange-600/20 dot-orange-500',
  urgent: 'bg-rose-50 text-rose-700 ring-rose-600/20 dot-rose-500 ping',

  // Severity themes
  critical: 'bg-rose-50 text-rose-700 ring-rose-600/20 dot-rose-500 ping',

  // Default fallback
  default: 'bg-slate-50 text-slate-600 ring-slate-500/20 dot-slate-400',
};

const DOT_BG = {
  'dot-emerald-500': 'bg-emerald-500',
  'dot-amber-500': 'bg-amber-500',
  'dot-rose-500': 'bg-rose-500',
  'dot-orange-500': 'bg-orange-500',
  'dot-sky-500': 'bg-sky-500',
  'dot-indigo-500': 'bg-indigo-500',
  'dot-slate-400': 'bg-slate-400',
};

export const Badge = ({
  value,
  children,
  type = 'status',
  dot = false,
  className = '',
  ...props
}) => {
  // Backward compatibility: resolve from value or children
  const content = value ?? children ?? '';
  const key = String(content).toLowerCase().trim().replace(/[\s-]/g, '_');
  const token = THEMES[key] || THEMES.default;
  const isPulsing = token.includes('ping');

  // Extract base ring/text styles and dot color class
  const baseClasses = token.replace('ping', '').replace(/dot-[a-z0-9-]+/, '').trim();
  const dotKey = Object.keys(DOT_BG).find((k) => token.includes(k)) || 'dot-slate-400';
  const dotColor = DOT_BG[dotKey];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset ${baseClasses} ${className}`}
      {...props}
    >
      {dot && (
        <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
          {isPulsing && (
            <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${dotColor}`} />
          )}
          <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${dotColor}`} />
        </span>
      )}
      {content}
    </span>
  );
};

export default Badge;
