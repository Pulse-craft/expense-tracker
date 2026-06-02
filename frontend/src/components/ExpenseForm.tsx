import { useState, useEffect, type FormEvent } from 'react';
import type { CreateExpenseInput, Expense, Currency } from '../types/expense';
import type { Category } from '../types/category';
import { createExpense, updateExpense } from '../services/api';
import { getUploadUrl, uploadFileToS3 } from '../services/receipts';
import { DEFAULT_CATEGORIES, getCategoryLabel } from '../utils/categories';

interface ExpenseFormProps {
  expenseToEdit: Expense | null;
  categories: Category[];
  onSaved: () => void;
  onCancelEdit: () => void;
}

export function ExpenseForm({ expenseToEdit, categories, onSaved, onCancelEdit }: ExpenseFormProps) {
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [category, setCategory] = useState<string>('food');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(
    () => new Date().toISOString().split('T')[0]
  );
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoryOptions = Array.from(
    new Set([
      ...DEFAULT_CATEGORIES.map((c) => c.name),
      ...categories.map((c) => c.name),
    ])
  );

  useEffect(() => {
    if (expenseToEdit) {
      setAmount(String(expenseToEdit.amount));
      setCurrency(expenseToEdit.currency ?? 'USD');
      setCategory(expenseToEdit.category);
      setDescription(expenseToEdit.description);
      setDate(expenseToEdit.date);
      setReceiptFile(null);
    } else {
      setAmount('');
      setCurrency('USD');
      setCategory('food');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
      setReceiptFile(null);
    }
  }, [expenseToEdit]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const amountNumber = parseFloat(amount);
    if (isNaN(amountNumber) || amountNumber <= 0) {
      setError('Amount must be a positive number');
      return;
    }

    if (receiptFile) {
      const allowedTypes = ['image/jpeg', 'image/png'];
      if (!allowedTypes.includes(receiptFile.type)) {
        setError('The receipt must be a JPG or PNG image');
        return;
      }
      if (receiptFile.size > 5 * 1024 * 1024) {
        setError('The receipt must be 5MB or smaller');
        return;
      }
    }

    setSubmitting(true);
    try {
      let receiptKey = expenseToEdit?.receiptKey;

      if (receiptFile) {
        setUploading(true);
        const contentType = receiptFile.type || 'application/octet-stream';
        const { uploadUrl, key } = await getUploadUrl(contentType);
        await uploadFileToS3(uploadUrl, receiptFile);
        receiptKey = key;
        setUploading(false);
      }

      const input: CreateExpenseInput = {
        amount: amountNumber,
        currency,
        category,
        description: description.trim(),
        date: date!,
        ...(receiptKey ? { receiptKey } : {}),
      };

      if (expenseToEdit) {
        await updateExpense(expenseToEdit.id, input);
      } else {
        await createExpense(input);
      }
      setAmount('');
      setCurrency('USD');
      setCategory('food');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
      setReceiptFile(null);
      onSaved();
      if (expenseToEdit) {
        onCancelEdit();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-lg space-y-4 mb-8">
      <h2 className="text-xl font-semibold text-white">{expenseToEdit ? 'Edit expense' : 'Add expense'}</h2>

      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block text-sm text-gray-400 mb-1">Amount</label>
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
          <label className="block text-sm text-gray-400 mb-1">Currency</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as Currency)}
            className="bg-gray-700 text-white px-3 py-2 rounded"
          >
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full bg-gray-700 text-white px-3 py-2 rounded"
        >
          {categoryOptions.map((cat) => (
            <option key={cat} value={cat}>
              {getCategoryLabel(cat)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Description (optional)</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. lunch at a café"
          className="w-full bg-gray-700 text-white px-3 py-2 rounded"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full bg-gray-700 text-white px-3 py-2 rounded"
          required
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Receipt (optional)</label>
        <input
          type="file"
          accept="image/jpeg,image/png"
          onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)}
          className="w-full text-sm text-gray-300"
        />
        {expenseToEdit?.receiptKey && !receiptFile && (
          <p className="text-xs text-gray-500 mt-1">It already has a receipt attached. Choose another file to replace it.</p>
        )}
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {uploading ? 'Uploading receipt...' : submitting ? 'Saving...' : expenseToEdit ? 'Save changes' : 'Add expense'}
      </button>
      {expenseToEdit && (
        <button
          type="button"
          onClick={onCancelEdit}
          className="w-full bg-gray-600 text-white py-2 rounded font-semibold hover:bg-gray-700"
        >
          Cancel
        </button>
      )}
    </form>
  );
}
