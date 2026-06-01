import type { Category } from '../types/category';
import { DEFAULT_CATEGORIES, getCategoryLabel } from '../utils/categories';

interface ExpenseFiltersProps {
  category: string;
  from: string;
  to: string;
  categories: Category[];
  onCategoryChange: (value: string) => void;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onClear: () => void;
}

export function ExpenseFilters({
  category, from, to, categories,
  onCategoryChange, onFromChange, onToChange, onClear,
}: ExpenseFiltersProps) {
  const options = Array.from(
    new Set([
      'all',
      ...DEFAULT_CATEGORIES.map((c) => c.name),
      ...categories.map((c) => c.name),
    ])
  );

  return (
    <div className="bg-gray-800 p-4 rounded-lg mb-4 flex flex-wrap gap-3 items-end">
      <div className="flex flex-col">
        <label className="text-xs text-gray-400 mb-1">Categoría</label>
        <select
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="bg-gray-700 text-white rounded px-2 py-1 text-sm"
        >
          {options.map((c) => (
            <option key={c} value={c}>
              {c === 'all' ? 'Todas' : getCategoryLabel(c)}
            </option>
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
