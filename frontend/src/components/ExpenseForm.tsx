import { useState, type FormEvent } from 'react';
import type { ExpenseCategory, CreateExpenseInput } from '../types/expense';
import { createExpense } from '../services/api';

const CATEGORIES: ExpenseCategory[] = [
  'food',
  'transport',
  'entertainment',
  'bills',
  'other',
];

interface ExpenseFormProps {
  onExpenseCreated: () => void;
}

export function ExpenseForm({ onExpenseCreated }: ExpenseFormProps) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('food');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(
    () => new Date().toISOString().split('T')[0]
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const amountNumber = parseFloat(amount);
    if (isNaN(amountNumber) || amountNumber <= 0) {
      setError('El monto debe ser un número positivo');
      return;
    }

    if (!description.trim()) {
      setError('La descripción es obligatoria');
      return;
    }

    const input: CreateExpenseInput = {
      amount: amountNumber,
      category,
      description: description.trim(),
      date,
    };

    setSubmitting(true);
    try {
      await createExpense(input);
      // Limpiar form
      setAmount('');
      setDescription('');
      setCategory('food');
      setDate(new Date().toISOString().split('T')[0]);
      // Avisar al padre que refresque la lista
      onExpenseCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-gray-800 p-6 rounded-lg space-y-4 mb-8"
    >
      <h2 className="text-xl font-semibold text-white">Agregar gasto</h2>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Monto</label>
        <input
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className="w-full bg-gray-700 text-white px-3 py-2 rounded"
          required
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Categoría</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
          className="w-full bg-gray-700 text-white px-3 py-2 rounded"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Descripción</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="ej: almuerzo en café"
          className="w-full bg-gray-700 text-white px-3 py-2 rounded"
          required
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Fecha</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full bg-gray-700 text-white px-3 py-2 rounded"
          required
        />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? 'Guardando...' : 'Agregar gasto'}
      </button>
    </form>
  );
}
