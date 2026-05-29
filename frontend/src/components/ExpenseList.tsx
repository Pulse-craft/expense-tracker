import { useEffect, useState } from 'react';
import type { Expense } from '../types/expense';
import { getExpenses } from '../services/api';

export function ExpenseList() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getExpenses()
      .then((data) => setExpenses(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-gray-400">Cargando gastos...</p>;
  }

  if (error) {
    return <p className="text-red-400">Error: {error}</p>;
  }

  if (expenses.length === 0) {
    return <p className="text-gray-400">No hay gastos todavía.</p>;
  }

  return (
    <ul className="space-y-3 w-full max-w-md">
      {expenses.map((expense) => (
        <li
          key={expense.id}
          className="bg-gray-800 p-4 rounded-lg flex justify-between items-center"
        >
          <div>
            <p className="text-white font-semibold">{expense.description}</p>
            <p className="text-gray-400 text-sm">
              {expense.category} · {expense.date}
            </p>
          </div>
          <p className="text-white text-lg font-bold">
            ${expense.amount.toFixed(2)}
          </p>
        </li>
      ))}
    </ul>
  );
}
