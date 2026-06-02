import type { Expense } from '../types/expense';

export function exportExpensesToCsv(expenses: Expense[]) {
  const headers = ['Date', 'Amount', 'Currency', 'Category', 'Description'];

  const rows = expenses.map((e) => [
    e.date,
    e.amount.toFixed(2),
    e.currency ?? 'USD',
    e.category,
    `"${(e.description ?? '').replace(/"/g, '""')}"`,
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'expenses.csv';
  link.click();
  URL.revokeObjectURL(url);
}
