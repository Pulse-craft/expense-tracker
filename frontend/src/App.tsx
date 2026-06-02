import { useEffect, useState, useCallback } from 'react';
import type { Expense, Currency } from './types/expense';
import type { Category } from './types/category';
import { getExpenses } from './services/api';
import { getCategories } from './services/categories';
import { getUsdToEurRate } from './services/rates';
import { ExpenseList } from './components/ExpenseList';
import { ExpenseForm } from './components/ExpenseForm';
import { ExpenseFilters } from './components/ExpenseFilters';
import { CategoryManager } from './components/CategoryManager';
import { exportExpensesToCsv } from './utils/exportCsv';
import { Dashboard } from './components/Dashboard';
import { getCategoryColor, getCategoryLabel } from './utils/categories';
import { convert, formatMoney, FALLBACK_USD_TO_EUR } from './utils/currency';
import { useAuthenticator } from '@aws-amplify/ui-react';

function App() {
  const { signOut } = useAuthenticator();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [displayCurrency, setDisplayCurrency] = useState<Currency>('USD');
  const [usdToEur, setUsdToEur] = useState<number>(FALLBACK_USD_TO_EUR);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getExpenses();
      setExpenses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  }, []);

  useEffect(() => {
    fetchExpenses();
    fetchCategories();
    getUsdToEurRate().then(setUsdToEur);
  }, [fetchExpenses, fetchCategories]);

  const filteredExpenses = expenses.filter((e) => {
    if (filterCategory !== 'all' && e.category !== filterCategory) return false;
    if (filterFrom && e.date < filterFrom) return false;
    if (filterTo && e.date > filterTo) return false;
    return true;
  });

  const total = filteredExpenses.reduce(
    (sum, e) => sum + convert(e.amount, e.currency, displayCurrency, usdToEur),
    0
  );
  const totalsByCategory = filteredExpenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + convert(e.amount, e.currency, displayCurrency, usdToEur);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Expense Tracker</h1>
        <button onClick={signOut} className="mb-4 text-sm text-gray-400 hover:text-white">Sign out</button>

        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-gray-400">Show totals in:</span>
          <select
            value={displayCurrency}
            onChange={(e) => setDisplayCurrency(e.target.value as Currency)}
            className="bg-gray-700 text-white rounded px-2 py-1 text-sm"
          >
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
          </select>
        </div>

        <Dashboard expenses={expenses} displayCurrency={displayCurrency} usdToEur={usdToEur} />
        <ExpenseForm expenseToEdit={editingExpense} categories={categories} onSaved={fetchExpenses} onCancelEdit={() => setEditingExpense(null)} />
        <CategoryManager categories={categories} onChanged={fetchCategories} />
        <ExpenseFilters
          category={filterCategory}
          from={filterFrom}
          to={filterTo}
          categories={categories}
          onCategoryChange={setFilterCategory}
          onFromChange={setFilterFrom}
          onToChange={setFilterTo}
          onClear={() => { setFilterCategory('all'); setFilterFrom(''); setFilterTo(''); }}
        />
        <button
          onClick={() => exportExpensesToCsv(filteredExpenses)}
          className="mb-4 bg-green-600 hover:bg-green-500 text-white rounded-lg px-4 py-2 text-sm"
        >
          Export CSV
        </button>

        <div className="flex flex-wrap gap-2 mb-4">
          {Object.entries(totalsByCategory).map(([category, amount]) => (
            <div
              key={category}
              className={`${getCategoryColor(category)} px-3 py-2 rounded-lg text-white text-sm flex gap-2 items-center`}
            >
              <span>{getCategoryLabel(category)}</span>
              <span className="font-semibold">{formatMoney(amount, displayCurrency)}</span>
            </div>
          ))}
        </div>

        <div className="bg-gray-800 p-4 rounded-lg mb-4 flex justify-between items-center">
          <span className="text-sm text-gray-400 uppercase tracking-wide">Total</span>
          <span className="text-2xl font-bold text-white">{formatMoney(total, displayCurrency)}</span>
        </div>

        <ExpenseList expenses={filteredExpenses} loading={loading} error={error} onExpenseDeleted={fetchExpenses} onEdit={setEditingExpense} />
      </div>
    </div>
  );
}

export default App;
