import type { Expense } from '../types/expense';
import { CATEGORY_COLORS } from '../utils/categories';
import { deleteExpense } from '../services/api';

interface ExpenseListProps {
  expenses: Expense[];
  loading: boolean;
  error: string | null;
    onExpenseDeleted: () => void;
      onEdit: (expense: Expense) => void;
}
export function ExpenseList({ expenses, loading, error, onExpenseDeleted, onEdit }: ExpenseListProps) {
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

  return (
    <ul className="space-y-3 w-full">
      {expenses.map((expense) => (
        <li
          key={expense.id}
          className="bg-gray-800 p-4 rounded-lg flex justify-between items-center"
        >
            <div className="flex items-center gap-3">
              <span className={`w-3 h-3 rounded-full ${CATEGORY_COLORS[expense.category]}`} />
              <div>
                <p className="text-white font-semibold">{expense.description}</p>
                <p className="text-gray-400 text-sm">
                  {expense.category} · {expense.date}
                </p>
              </div>
            </div>
          <div className="flex items-center gap-4">
          <p className="text-white text-lg font-bold">
            ${expense.amount.toFixed(2)}
          </p>
                      <button
              onClick={() => onEdit(expense)}
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              Editar
            </button>

                      <button
              onClick={() => handleDelete(expense.id)}
              className="text-red-400 hover:text-red-300 text-sm"
            >
              Eliminar
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
