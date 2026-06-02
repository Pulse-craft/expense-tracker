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

export function ExpenseList({ expenses, loading, error, onExpenseDeleted, onEdit }: ExpenseListProps) {
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const sorted = [...expenses].sort((a, b) => {
    const cmp = sortBy === 'date' ? a.date.localeCompare(b.date) : a.amount - b.amount;
    return sortDir === 'asc' ? cmp : -cmp;
  });

  function toggleSort(field: 'date' | 'amount') {
    if (sortBy === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
  }

  if (loading) {
    return <p className="text-gray-400">Cargando gastos...</p>;
  }

  if (error) {
    return <p className="text-red-400">Error: {error}</p>;
  }

  if (expenses.length === 0) {
    return <p className="text-gray-400">No hay gastos todavía.</p>;
  }

  async function handleDelete(id: string) {
    if (!window.confirm('¿Seguro que quieres eliminar este gasto?')) {
      return;
    }
    try {
      await deleteExpense(id);
      onExpenseDeleted();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar el gasto');
    }
  }

  async function handleViewReceipt(key: string) {
    try {
      const url = await getViewUrl(key);
      window.open(url, '_blank');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'No se pudo abrir el recibo');
    }
  }

  return (
    <>
      <div className="flex gap-2 mb-3">
        <button onClick={() => toggleSort('date')} className="bg-gray-700 text-white rounded px-3 py-1 text-sm">
          Fecha {sortBy === 'date' ? `(${sortDir})` : ''}
        </button>
        <button onClick={() => toggleSort('amount')} className="bg-gray-700 text-white rounded px-3 py-1 text-sm">
          Monto {sortBy === 'amount' ? `(${sortDir})` : ''}
        </button>
      </div>

      <ul className="space-y-3 w-full">
        {sorted.map((expense) => (
          <li key={expense.id} className="bg-gray-800 p-4 rounded-lg flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className={`w-3 h-3 rounded-full ${getCategoryColor(expense.category)}`} />
              <div>
                <p className="text-white font-semibold">{expense.description}</p>
                <p className="text-gray-400 text-sm">
                  {getCategoryLabel(expense.category)} · {expense.date}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-white text-lg font-bold">
                {currencySymbol(expense.currency)}{expense.amount.toFixed(2)}
              </p>
              {expense.receiptKey && (
                <button onClick={() => handleViewReceipt(expense.receiptKey!)} className="text-green-400 hover:text-green-300 text-sm">
                  Recibo
                </button>
              )}
              <button onClick={() => onEdit(expense)} className="text-blue-400 hover:text-blue-300 text-sm">
                Editar
              </button>
              <button onClick={() => handleDelete(expense.id)} className="text-red-400 hover:text-red-300 text-sm">
                Eliminar
              </button>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
