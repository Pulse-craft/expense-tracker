import { useState } from 'react';
import type { Expense } from '../types/expense';
import { getCategoryColor, getCategoryLabel } from '../utils/categories';
import { currencySymbol } from '../utils/currency';
import { getViewUrl } from '../services/receipts';
import { deleteExpense } from '../services/api';

interface ExpenseListProps {
  expenses: Expense[];
  loading: boolean;
  error: string | null;
  onExpenseDeleted: () => void;
  onEdit: (expense: Expense) => void;
}

type SortField = 'date' | 'amount' | 'category';

export function ExpenseList({ expenses, loading, error, onExpenseDeleted, onEdit }: ExpenseListProps) {
  const [sortBy, setSortBy] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const sorted = [...expenses].sort((a, b) => {
    let cmp: number;
    if (sortBy === 'date') {
      cmp = a.date.localeCompare(b.date);
    } else if (sortBy === 'amount') {
      cmp = a.amount - b.amount;
    } else {
      cmp = a.category.localeCompare(b.category);
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });

  function toggleSort(field: SortField) {
    if (sortBy === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
  }

  if (loading) {
    return <p className="text-gray-400">Loading expenses...</p>;
  }

  if (error) {
    return <p className="text-red-400">Error: {error}</p>;
  }

  if (expenses.length === 0) {
    return <p className="text-gray-400">No expenses yet.</p>;
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Are you sure you want to delete this expense?')) {
      return;
    }
    try {
      await deleteExpense(id);
      onExpenseDeleted();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete the expense');
    }
  }

  async function handleViewReceipt(key: string) {
    try {
      const url = await getViewUrl(key);
      window.open(url, '_blank');
    } catch (err) {
      alert(err instanceof Error ? err.message : "Couldn't open the receipt");
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-3">
        <button
          onClick={() => toggleSort('date')}
          className="bg-gray-700 text-white rounded px-3 py-1 text-sm"
        >
          Date {sortBy === 'date' ? `(${sortDir})` : ''}
        </button>
        <button
          onClick={() => toggleSort('amount')}
          className="bg-gray-700 text-white rounded px-3 py-1 text-sm"
        >
          Amount {sortBy === 'amount' ? `(${sortDir})` : ''}
        </button>
        <button
          onClick={() => toggleSort('category')}
          className="bg-gray-700 text-white rounded px-3 py-1 text-sm"
        >
          Category {sortBy === 'category' ? `(${sortDir})` : ''}
        </button>
      </div>

      <ul className="space-y-3 w-full">
        {sorted.map((expense) => (
          <li
            key={expense.id}
            className="bg-gray-800 p-4 rounded-lg flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center"
          >
            <div className="flex items-center gap-3">
              <span className={`w-3 h-3 rounded-full shrink-0 ${getCategoryColor(expense.category)}`} />
              <div>
                <p className="text-white font-semibold break-words">{expense.description}</p>
                <p className="text-gray-400 text-sm">
                  {getCategoryLabel(expense.category)} · {expense.date}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <p className="text-white text-lg font-bold">
                {currencySymbol(expense.currency)}{expense.amount.toFixed(2)}
              </p>
              {expense.receiptKey && (
                <button onClick={() => handleViewReceipt(expense.receiptKey!)} className="text-green-400 hover:text-green-300 text-sm">
                  Receipt
                </button>
              )}
              <button
                onClick={() => onEdit(expense)}
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(expense.id)}
                className="text-red-400 hover:text-red-300 text-sm"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
