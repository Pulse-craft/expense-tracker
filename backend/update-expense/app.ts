import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { CreateExpenseInput, Expense, ExpenseCategory } from './types/expense';
import { saveExpense } from './services/expenseRepository';

const expenseSchema = z.object({
    amount: z.number().positive('amount must be a positive number'),
    currency: z.enum(['USD', 'EUR']).catch('USD'),
    category: z.string().trim().min(1, 'category is required').max(30, 'category must be at most 30 characters'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be in YYYY-MM-DD format'),
    description: z.string().trim().optional().default(''),
    receiptKey: z.string().min(1).optional(),
});

const parseInput = (body: string | null): { error: string } | { input: CreateExpenseInput } => {
    if (!body) {
        return { error: 'Request body is required' };
    }

    let parsed: unknown;
    try {
        parsed = JSON.parse(body);
    } catch {
        return { error: 'Body must be valid JSON' };
    }

    const result = expenseSchema.safeParse(parsed);
    if (!result.success) {
        return { error: result.error.issues[0]?.message ?? 'Invalid input' };
    }

    const data = result.data;
    return {
        input: {
            amount: data.amount,
            currency: data.currency,
            category: data.category.toLowerCase() as ExpenseCategory,
            date: data.date,
            description: data.description,
            ...(data.receiptKey ? { receiptKey: data.receiptKey } : {}),
        },
    };
};

const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://main.d1bfigmggittui.amplifyapp.com',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS',
};

export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const result = parseInput(event.body);

    if ('error' in result) {
        return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ error: result.error }),
        };
    }

    const claims = event.requestContext.authorizer?.claims as Record<string, string> | undefined;
    const userId = claims?.sub;
    if (!userId) {
        return {
            statusCode: 401,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Unauthorized' }),
        };
    }

    const expenseId = event.pathParameters?.id;
    if (!expenseId) {
        return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Missing expense id' }),
        };
    }

    const expense: Expense = {
        id: expenseId,
        userId,
        ...result.input,
        createdAt: new Date().toISOString(),
    };

    try {
        await saveExpense(expense);
    } catch (err) {
        console.error('Failed to save expense to DynamoDB', err);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Failed to save expense' }),
        };
    }

    return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(expense),
    };
};
