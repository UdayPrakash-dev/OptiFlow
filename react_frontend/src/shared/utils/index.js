/**
 * Central barrel export for all shared utility functions.
 * 
 * WHY: This enables clean imports like:
 * import { formatDate, formatStatus, getStatusVariant } from '@/shared/utils';
 * instead of having to import each file separately.
 */
export * from './formatDate';
export * from './formatStatus';
