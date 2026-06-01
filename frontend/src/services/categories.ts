import type { Category } from '../types/category';
import { fetchAuthSession } from 'aws-amplify/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

async function getAuthHeaders() {
  const session = await fetchAuthSession();
  const token = session.tokens?.idToken?.toString();
  return { Authorization: 'Bearer ' + token };
}

export async function getCategories(): Promise<Category[]> {
  const response = await fetch(`${API_BASE_URL}/categories`, {
    headers: await getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(`Error fetching categories: ${response.status}`);
  }
  const data = await response.json();
  return data.categories;
}

export async function createCategory(input: {
  name: string;
  color?: string;
}): Promise<Category> {
  const response = await fetch(`${API_BASE_URL}/categories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(await getAuthHeaders()),
    },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Error creating category: ${response.status}`);
  }
  const data = await response.json();
  return data.category;
}

export async function updateCategory(
  id: string,
  input: { name?: string; color?: string }
): Promise<Category> {
  const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(await getAuthHeaders()),
    },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Error updating category: ${response.status}`);
  }
  const data = await response.json();
  return data.category;
}

export async function deleteCategory(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Error deleting category: ${response.status}`);
  }
}
