import React from 'react';
import { Loader } from './Loader';
import { EmptyState } from './EmptyState';

/**
 * Reusable Table Component.
 * 
 * WHY: Tables are used across every actor dashboard (PM, HR, Compliance, etc.).
 * Having a single, robust Table component ensures consistent column styling,
 * loading skeletons/spinners, empty states, and pagination without duplicating code.
 * 
 * @param {Object} props
 * @param {Array<{ header: string, accessor?: string, render?: (value: any, row: any, index: number) => React.ReactNode, className?: string, headerClassName?: string }>} props.columns - Column configuration definitions
 * @param {Array<Object>} [props.data=[]] - Data rows to display (also accepts `rows` for convenience)
 * @param {Array<Object>} [props.rows] - Alias for data
 * @param {boolean} [props.loading=false] - When true, renders a loading spinner
 * @param {string} [props.emptyTitle="No data found"] - Title to show in empty state
 * @param {string} [props.emptyMessage] - Description text for empty state
 * @param {React.ReactNode} [props.emptyAction] - Action button or link for empty state
 * @param {Function} [props.onRowClick] - Optional callback triggered when a row is clicked
 * @param {string} [props.keyField="id"] - Field to use as unique key for rows (falls back to index)
 * @param {{ page: number, totalPages: number, onPageChange: (newPage: number) => void, totalItems?: number }} [props.pagination] - Optional pagination controls
 * @param {string} [props.className=""] - Custom classes for the outer wrapper
 */
export const Table = ({
  columns = [],
  data,
  rows,
  loading = false,
  emptyTitle = 'No data found',
  emptyMessage = 'There are no records matching your criteria.',
  emptyAction,
  onRowClick,
  keyField = 'id',
  pagination,
  className = '',
}) => {
  // Support both `data` and `rows` props so developers don't have to guess the prop name
  const tableData = data || rows || [];

  return (
    <div className={`w-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      {/* WHY: Horizontal scroll container ensures wide tables don't break page layouts on smaller screens */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm text-gray-700">
          {/* Table Header */}
          <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={col.accessor || col.header || idx}
                  scope="col"
                  className={`px-6 py-3.5 ${col.headerClassName || ''} ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-gray-100 bg-white">
            {/* 1. Loading State */}
            {loading && (
              <tr>
                <td colSpan={columns.length || 1} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Loader />
                    <span className="text-sm text-gray-500">Loading data...</span>
                  </div>
                </td>
              </tr>
            )}

            {/* 2. Empty State (Only when NOT loading and data is empty) */}
            {!loading && tableData.length === 0 && (
              <tr>
                <td colSpan={columns.length || 1} className="py-8">
                  <EmptyState
                    title={emptyTitle}
                    description={emptyMessage}
                    action={emptyAction}
                  />
                </td>
              </tr>
            )}

            {/* 3. Populated Rows */}
            {!loading &&
              tableData.map((row, rowIndex) => {
                // WHY: React keys should be unique and stable. We check keyField (default: 'id') or fallback to row index.
                const rowKey = row?.[keyField] ?? rowIndex;
                const isClickable = typeof onRowClick === 'function';

                return (
                  <tr
                    key={rowKey}
                    onClick={() => isClickable && onRowClick(row, rowIndex)}
                    className={`transition-colors duration-150 ${
                      isClickable
                        ? 'cursor-pointer hover:bg-blue-50/60 focus:outline-none'
                        : 'hover:bg-gray-50/80'
                    }`}
                  >
                    {columns.map((col, colIndex) => {
                      // Extract the raw value from the row object using the accessor key
                      const rawValue = col.accessor ? row?.[col.accessor] : undefined;

                      return (
                        <td
                          key={col.accessor || colIndex}
                          className={`px-6 py-4 whitespace-nowrap align-middle ${col.className || ''}`}
                        >
                          {/* WHY: If a custom render function is provided, run it so the developer
                              can return Badges, Avatars, Actions, or formatted text.
                              Otherwise, safely display the raw value or a dash fallback if empty. */}
                          {typeof col.render === 'function'
                            ? col.render(rawValue, row, rowIndex)
                            : rawValue ?? '—'}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* Optional Pagination Footer */}
      {/* WHY: Only render pagination footer when pagination prop is provided and totalPages > 1 (or totalItems exist) */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-3 border-t border-gray-200 bg-gray-50 gap-3 text-sm text-gray-600">
          <div className="text-xs text-gray-500">
            Page <span className="font-medium text-gray-800">{pagination.page}</span> of{' '}
            <span className="font-medium text-gray-800">{pagination.totalPages}</span>
            {pagination.totalItems && (
              <span className="ml-1">({pagination.totalItems} total items)</span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* Previous Page Button */}
            <button
              type="button"
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1.5 rounded border border-gray-300 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>

            {/* Next Page Button */}
            <button
              type="button"
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1.5 rounded border border-gray-300 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
