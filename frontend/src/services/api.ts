import type { Expense, CreateExpenseInput } from '../types/expense';

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

export async function createExpense(
  input: CreateExpenseInput
): Promise<Expense> {
  const response = await fetch(`${API_BASE_URL}/expenses/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Error creating expense: ${response.status}`);
  }

  return await response.json();
}
