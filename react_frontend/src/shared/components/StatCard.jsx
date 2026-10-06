// WHY: StatCard provides quick, scannable KPIs for Executive, HR, and Platform portals.
// It supports semantic props (label, value, hint), trend direction pills, and a skeleton shimmer.

export const StatCard = ({
  label,
  title, // Backward compatibility
  value,
  hint,
  subtitle, // Backward compatibility
  icon,
  trend,
  trendLabel,
  loading = false,
  className = '',
  ...props
}) => {
  const displayLabel = label ?? title ?? 'Metric';
  const displayHint = hint ?? subtitle;

  // Modern skeleton shimmer during asynchronous fetch
  if (loading) {
    return (
      <div className={`bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm animate-pulse space-y-3 ${className}`}>
        <div className="flex justify-between items-center">
          <div className="h-3 bg-slate-200 rounded w-24" />
          <div className="w-10 h-10 bg-slate-100 rounded-xl" />
        </div>
        <div className="h-8 bg-slate-200 rounded w-32" />
        <div className="h-3 bg-slate-100 rounded w-40" />
      </div>
    );
  }

  const isPositive = typeof trend === 'string' && trend.startsWith('+');
  const isNegative = typeof trend === 'string' && trend.startsWith('-');

  return (
    <div
      className={`group bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${className}`}
      {...props}
    >
      {/* Top Header: Label & Icon */}
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 truncate">
          {displayLabel}
        </span>
        {icon && (
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors flex-shrink-0">
            {icon}
          </div>
        )}
      </div>

      {/* Main Metric Value & Trend */}
      <div className="mt-3">
        <div className="text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
          {value ?? '—'}
        </div>
        {trend && (
          <div className="flex items-center gap-1.5 mt-2">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full ring-1 ring-inset ${
                isPositive
                  ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                  : isNegative
                  ? 'bg-rose-50 text-rose-700 ring-rose-600/20'
                  : 'bg-slate-50 text-slate-700 ring-slate-600/20'
              }`}
            >
              {isPositive && '↑'}
              {isNegative && '↓'}
              {trend}
            </span>
            {trendLabel && <span className="text-xs text-slate-400">{trendLabel}</span>}
          </div>
        )}
      </div>

      {/* Footer Helper / Subtitle */}
      {displayHint && (
        <p className="mt-3 text-xs text-slate-500 font-normal leading-relaxed border-t border-slate-100 pt-2.5">
          {displayHint}
        </p>
      )}
    </div>
  );
};

export default StatCard;
