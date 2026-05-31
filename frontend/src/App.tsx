import { useEffect, useState, useCallback } from 'react';
import type { Expense, ExpenseCategory } from './types/expense';
import { getExpenses } from './services/api';
import { ExpenseList } from './components/ExpenseList';
import { ExpenseForm } from './components/ExpenseForm';
import { ExpenseFilters } from './components/ExpenseFilters';
import { CATEGORY_COLORS } from './utils/categories';
import { useAuthenticator } from '@aws-amplify/ui-react';

function App() {
  const { signOut } = useAuthenticator();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [filterCategory, setFilterCategory] = useState<ExpenseCategory | 'all'>('all');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');


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
    const filteredExpenses = expenses.filter((e) => {
    if (filterCategory !== 'all' && e.category !== filterCategory) return false;
    if (filterFrom && e.date < filterFrom) return false;
    if (filterTo && e.date > filterTo) return false;
    return true;
  });
  const total = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalsByCategory = filteredExpenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});


  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Expense Tracker</h1>
        <button onClick={signOut} className="mb-4 text-sm text-gray-400 hover:text-white">Cerrar sesión</button>
        <ExpenseForm expenseToEdit={editingExpense} onSaved={fetchExpenses} onCancelEdit={() => setEditingExpense(null)} />
          <ExpenseFilters
  category={filterCategory}
  from={filterFrom}
  to={filterTo}
  onCategoryChange={setFilterCategory}
  onFromChange={setFilterFrom}
  onToChange={setFilterTo}
  onClear={() => { setFilterCategory('all'); setFilterFrom(''); setFilterTo(''); }}
/>

                <div className="flex flex-wrap gap-2 mb-4">
          {Object.entries(totalsByCategory).map(([category, amount]) => (
            <div
              key={category}
              className={`${CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] ?? 'bg-gray-600'} px-3 py-2 rounded-lg text-white text-sm flex gap-2 items-center`}
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

        <ExpenseList expenses={filteredExpenses} loading={loading} error={error} onExpenseDeleted={fetchExpenses} onEdit={setEditingExpense} />

      </div>
    </div>
  );
}

export default App;
