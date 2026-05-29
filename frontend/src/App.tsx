import { useEffect, useState, useCallback } from 'react';
import type { Expense } from './types/expense';
import { getExpenses } from './services/api';
import { ExpenseList } from './components/ExpenseList';
import { ExpenseForm } from './components/ExpenseForm';
import { CATEGORY_COLORS } from './utils/categories';


function App() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getExpenses();
      setExpenses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalsByCategory = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});


  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Expense Tracker</h1>
        <ExpenseForm onExpenseCreated={fetchExpenses} />
                <div className="flex flex-wrap gap-2 mb-4">
          {Object.entries(totalsByCategory).map(([category, amount]) => (
            <div
              key={category}
              className={`${CATEGORY_COLORS[category] ?? 'bg-gray-600'} px-3 py-2 rounded-lg text-white text-sm flex gap-2 items-center`}
            >
              <span className="capitalize">{category}</span>
              <span className="font-semibold">${amount.toFixed(2)}</span>
            </div>
          ))}
        </div>

                <div className="bg-gray-800 p-4 rounded-lg mb-4 flex justify-between items-center">
          <span className="text-sm text-gray-400 uppercase tracking-wide">Total</span>
          <span className="text-2xl font-bold text-white">${total.toFixed(2)}</span>
        </div>

        <ExpenseList expenses={expenses} loading={loading} error={error} />
      </div>
    </div>
  );
}

export default App;
