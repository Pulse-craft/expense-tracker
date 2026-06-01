import { useState } from 'react';
import type { Category } from '../types/category';
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from '../services/categories';
import { DEFAULT_CATEGORIES, getCategoryColor } from '../utils/categories';

interface CategoryManagerProps {
  categories: Category[];
  onChanged: () => void;
}

export function CategoryManager({ categories, onChanged }: CategoryManagerProps) {
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleAdd() {
    const name = newName.trim();
    if (!name) return;
    setBusy(true);
    setError(null);
    try {
      await createCategory({ name });
      setNewName('');
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear');
    } finally {
      setBusy(false);
    }
  }

  function startEdit(cat: Category) {
    setEditingId(cat.id);
    setEditingName(cat.name);
    setError(null);
  }

  async function handleSaveEdit(id: string) {
    const name = editingName.trim();
    if (!name) return;
    setBusy(true);
    setError(null);
    try {
      await updateCategory(id, { name });
      setEditingId(null);
      setEditingName('');
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al editar');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('¿Borrar esta categoría?')) return;
    setBusy(true);
    setError(null);
    try {
      await deleteCategory(id);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al borrar');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-gray-800 p-4 rounded-lg mb-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-sm text-gray-300 hover:text-white"
      >
        {open ? '▾' : '▸'} Administrar categorías
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
              Por defecto
            </p>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_CATEGORIES.map((c) => (
                <span
                  key={c.name}
                  className={`${c.color} px-3 py-1 rounded-lg text-white text-sm`}
                >
                  {c.label}
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
              Personalizadas
            </p>
            {categories.length === 0 && (
              <p className="text-sm text-gray-500">
                Aún no tienes categorías personalizadas.
              </p>
            )}
            <div className="space-y-2">
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center gap-2">
                  <span
                    className={`${getCategoryColor(cat.name)} w-4 h-4 rounded-full`}
                  />
                  {editingId === cat.id ? (
                    <>
                      <input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="flex-1 bg-gray-700 text-white rounded px-2 py-1 text-sm"
                      />
                      <button
                        onClick={() => handleSaveEdit(cat.id)}
                        disabled={busy}
                        className="text-sm text-green-400 hover:text-green-300"
                      >
                        Guardar
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-sm text-gray-400 hover:text-white"
                      >
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-white text-sm capitalize">
                        {cat.name}
                      </span>
                      <button
                        onClick={() => startEdit(cat)}
                        className="text-sm text-blue-400 hover:text-blue-300"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id)}
                        disabled={busy}
                        className="text-sm text-red-400 hover:text-red-300"
                      >
                        Borrar
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nueva categoría"
              className="flex-1 bg-gray-700 text-white rounded px-3 py-2 text-sm"
            />
            <button
              onClick={handleAdd}
              disabled={busy || !newName.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg px-4 py-2 text-sm"
            >
              Agregar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
