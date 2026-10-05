export const Table = ({
  columns = [],
  data = [],
  loading = false,
  emptyText = 'No records found',
  onRowClick,
  className = '',
}) => {
  return (
    <div className={`w-full bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={col.accessor || idx}
                  className={`px-4 py-3 ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading ? (
              <tr>
                <td colSpan={columns.length || 1} className="py-8 text-center text-slate-500">
                  <div className="flex justify-center items-center">
                    <div className="w-6 h-6 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length || 1} className="py-8 text-center text-slate-500 text-sm">
                  {emptyText}
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr
                  key={row.id ?? rowIndex}
                  onClick={() => onRowClick?.(row, rowIndex)}
                  className={`transition-colors ${
                    onRowClick ? 'cursor-pointer hover:bg-blue-50/50' : 'hover:bg-slate-50/70'
                  }`}
                >
                  {columns.map((col, colIndex) => (
                    <td
                      key={col.accessor || colIndex}
                      className={`px-4 py-3.5 text-slate-800 align-middle ${col.className || ''}`}
                    >
                      {col.render
                        ? col.render(col.accessor ? row[col.accessor] : undefined, row, rowIndex)
                        : (col.accessor ? (row[col.accessor] ?? '—') : '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
