import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { randomUUID } from 'crypto';
import { CreateExpenseInput, Expense, ExpenseCategory, Currency } from './types/expense';
import { saveExpense } from './services/expenseRepository';

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

    if (typeof parsed !== 'object' || parsed === null) {
        return { error: 'Body must be a JSON object' };
    }

    const { amount, category, date, description, currency } = parsed as Record<string, unknown>;

    if (typeof amount !== 'number' || amount <= 0) {
        return { error: 'amount must be a positive number' };
    }
    if (typeof category !== 'string' || category.trim().length === 0 || category.trim().length > 30) {
        return { error: 'category must be a non-empty string (max 30 characters)' };
    }
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return { error: 'date must be a string in YYYY-MM-DD format' };
    }
    if (typeof description !== 'string' || description.trim().length === 0) {
        return { error: 'description must be a non-empty string' };
    }

    const normalizedCurrency: Currency =
        typeof currency === 'string' && currency.toUpperCase() === 'EUR' ? 'EUR' : 'USD';

    return {
        input: {
            amount,
            currency: normalizedCurrency,
            category: category.trim().toLowerCase() as ExpenseCategory,
            date,
            description,
        },
    };
};

const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://main.d1bfigmggittui.amplifyapp.com',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
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

    const expense: Expense = {
        id: randomUUID(),
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
        statusCode: 201,
        headers: corsHeaders,
        body: JSON.stringify(expense),
    };
};
