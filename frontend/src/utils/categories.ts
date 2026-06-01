export interface DefaultCategory {
  name: string;
  label: string;
  color: string;
}

// Las 7 categorías por defecto del spec (no se guardan en la BD).
export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  { name: 'food', label: 'Food', color: 'bg-orange-600' },
  { name: 'transport', label: 'Transport', color: 'bg-blue-600' },
  { name: 'entertainment', label: 'Entertainment', color: 'bg-purple-600' },
  { name: 'health', label: 'Health', color: 'bg-green-600' },
  { name: 'housing', label: 'Housing', color: 'bg-amber-700' },
  { name: 'utilities', label: 'Utilities', color: 'bg-red-600' },
  { name: 'other', label: 'Other', color: 'bg-gray-600' },
];

// Compatibilidad con el código que ya usa CATEGORY_COLORS.
export const CATEGORY_COLORS: Record<string, string> = Object.fromEntries(
  DEFAULT_CATEGORIES.map((c) => [c.name, c.color])
);

// Paleta para colorear categorías personalizadas de forma estable.
const CUSTOM_PALETTE = [
  'bg-pink-600',
  'bg-teal-600',
  'bg-indigo-600',
  'bg-cyan-600',
  'bg-lime-600',
  'bg-fuchsia-600',
  'bg-emerald-600',
  'bg-rose-600',
];

// Devuelve una clase de color de Tailwind para CUALQUIER categoría.
export function getCategoryColor(name: string): string {
  const key = name.trim().toLowerCase();
  const found = DEFAULT_CATEGORIES.find((c) => c.name === key);
  if (found) {
    return found.color;
  }
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  }
  return CUSTOM_PALETTE[Math.abs(hash) % CUSTOM_PALETTE.length] ?? 'bg-gray-600';

}

// Nombre legible para cualquier categoría.
export function getCategoryLabel(name: string): string {
  const key = name.trim().toLowerCase();
  const found = DEFAULT_CATEGORIES.find((c) => c.name === key);
  if (found) {
    return found.label;
  }
  return key.charAt(0).toUpperCase() + key.slice(1);
}
