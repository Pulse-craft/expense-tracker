import type { Expense } from '../types/expense';

const API_BASE_URL =
  'https://34gzk4gdcj.execute-api.us-east-1.amazonaws.com/Prod';

export async function getExpenses(): Promise<Expense[]> {
  const response = await fetch(`${API_BASE_URL}/expenses/`);

  if (!response.ok) {
    throw new Error(`Error fetching expenses: ${response.status}`);
  }

  const data = await response.json();
  return data.expenses;
}
