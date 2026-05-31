import type { ExpenseCategory } from '../types/expense';

interface ExpenseFiltersProps {
  category: ExpenseCategory | 'all';
  from: string;
  to: string;
  onCategoryChange: (value: ExpenseCategory | 'all') => void;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onClear: () => void;
}

const CATEGORIES: (ExpenseCategory | 'all')[] = [
  'all', 'food', 'transport', 'entertainment', 'bills', 'other',
];

export function ExpenseFilters({
  category, from, to,
  onCategoryChange, onFromChange, onToChange, onClear,
}: ExpenseFiltersProps) {
  return (
    <div className="bg-gray-800 p-4 rounded-lg mb-4 flex flex-wrap gap-3 items-end">
      <div className="flex flex-col">
        <label className="text-xs text-gray-400 mb-1">Categoría</label>
        <select
          value={category}
          onChange={(e) => onCategoryChange(e.target.value as ExpenseCategory | 'all')}
          className="bg-gray-700 text-white rounded px-2 py-1 text-sm capitalize"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c === 'all' ? 'Todas' : c}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col">
        <label className="text-xs text-gray-400 mb-1">Desde</label>
        <input
          type="date"
          value={from}
          onChange={(e) => onFromChange(e.target.value)}
          className="bg-gray-700 text-white rounded px-2 py-1 text-sm"
        />
      </div>

      <div className="flex flex-col">
        <label className="text-xs text-gray-400 mb-1">Hasta</label>
        <input
          type="date"
          value={to}
          onChange={(e) => onToChange(e.target.value)}
          className="bg-gray-700 text-white rounded px-2 py-1 text-sm"
        />
      </div>

      <button
        onClick={onClear}
        className="text-sm text-gray-400 hover:text-white px-2 py-1"
      >
        Limpiar
      </button>
    </div>
  );
}
