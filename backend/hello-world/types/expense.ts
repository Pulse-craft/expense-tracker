/**
 * Allowed expense categories.
 */
export type ExpenseCategory = 'food' | 'transport' | 'entertainment' | 'bills' | 'other';

/**
 * Full Expense as stored/returned by the API.
 */
export interface Expense {
    id: string;
    userId: string;
    amount: number;
    category: ExpenseCategory;
    date: string; // ISO 8601 date (YYYY-MM-DD)
    description: string;
    createdAt: string; // ISO 8601 datetime
}

/**
 * Payload accepted by POST /expenses.
 * The API generates id, userId (from auth) and createdAt.
 */
export interface CreateExpenseInput {
    amount: number;
    category: ExpenseCategory;
    date: string;
    description: string;
}
