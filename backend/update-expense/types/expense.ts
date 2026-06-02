/**
 * Allowed expense categories.
 */
export type ExpenseCategory = 'food' | 'transport' | 'entertainment' | 'bills' | 'other';

/**
 * Supported currencies.
 */
export type Currency = 'USD' | 'EUR';

/**
 * Full Expense as stored/returned by the API.
 */
export interface Expense {
    id: string;
    userId: string;
    amount: number;
    currency: Currency;
    category: ExpenseCategory;
    date: string; // ISO 8601 date (YYYY-MM-DD)
    description: string;
    receiptKey?: string; // S3 object key del recibo subido
    createdAt: string; // ISO 8601 datetime
}

/**
 * Payload accepted by POST /expenses.
 */
export interface CreateExpenseInput {
    amount: number;
    currency: Currency;
    category: ExpenseCategory;
    date: string;
    description: string;
    receiptKey?: string;
}
