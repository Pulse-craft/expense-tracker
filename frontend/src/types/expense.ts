export type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'entertainment'
  | 'bills'
  | 'other';

export interface Expense {
  id: string;
  userId: string;
  amount: number;
  category: ExpenseCategory;
  description: string;
  date: string;
  createdAt: string;
}

export interface CreateExpenseInput {
  amount: number;
  category: ExpenseCategory;
  description: string;
  date: string;
}
