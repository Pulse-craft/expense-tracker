export type ExpenseCategory = 'food' | 'transport' | 'entertainment' | 'bills' | 'other';

export type Currency = 'USD' | 'EUR';

export interface Expense {
  id: string;
  userId: string;
  amount: number;
  currency: Currency;
  category: string;
  description: string;
  date: string;
  createdAt: string;
}

export interface CreateExpenseInput {
  amount: number;
  currency: Currency;
  category: string;
  description: string;
  date: string;
}
