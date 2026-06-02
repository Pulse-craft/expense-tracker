import type { Expense, Currency } from '../types/expense';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { convert, formatMoney } from '../utils/currency';
import { getCategoryLabel } from '../utils/categories';

interface DashboardProps {
  expenses: Expense[];
  displayCurrency: Currency;
  usdToEur: number;
}

export function Dashboard({ expenses, displayCurrency, usdToEur }: DashboardProps) {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const conv = (e: Expense) => convert(e.amount, e.currency, displayCurrency, usdToEur);

  const monthTotal = expenses
    .filter((e) => e.date.startsWith(currentMonth))
    .reduce((sum, e) => sum + conv(e), 0);

  const totalsByCategory = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + conv(e);
    return acc;
  }, {});

  const totalAll = expenses.reduce((sum, e) => sum + conv(e), 0);

  const top3 = Object.entries(totalsByCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const monthsData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en', { month: 'short' });
    const total = expenses
      .filter((e) => e.date.startsWith(key))
      .reduce((sum, e) => sum + conv(e), 0);
    monthsData.push({ month: label, total });
  }

  return (
    <div className="bg-gray-800 p-4 rounded-lg mb-4">
      <h2 className="text-lg font-bold text-white mb-3">Summary</h2>
      <div className="bg-gray-700 p-3 rounded-lg">
        <p className="text-sm text-gray-400 uppercase tracking-wide">This month's total</p>
        <p className="text-2xl font-bold text-white">{formatMoney(monthTotal, displayCurrency)}</p>
      </div>
      <div className="mt-3">
        <p className="text-sm text-gray-400 uppercase tracking-wide mb-2">Top categories</p>
        {top3.map(([category, amount]) => (
          <div key={category} className="flex justify-between text-white text-sm mb-1">
            <span>{getCategoryLabel(category)}</span>
            <span>
              {formatMoney(amount, displayCurrency)}
              {totalAll > 0 && ` (${((amount / totalAll) * 100).toFixed(0)}%)`}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <p className="text-sm text-gray-400 uppercase tracking-wide mb-2">Last 6 months</p>
        <div style={{ width: '100%', height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthsData}>
              <XAxis dataKey="month" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip />
              <Bar dataKey="total" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
