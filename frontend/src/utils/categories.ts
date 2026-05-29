import type { ExpenseCategory } from '../types/expense';

export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  food: 'bg-orange-600',
  transport: 'bg-blue-600',
  entertainment: 'bg-purple-600',
  bills: 'bg-red-600',
  other: 'bg-gray-600',
};
