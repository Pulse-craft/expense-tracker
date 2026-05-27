import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getExpenseById } from './services/expenseRepository';

export const lambdaHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const expenseId = event.pathParameters?.id;

    if (!expenseId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing expense id in path' }),
      };
    }

    // Mock userId por ahora (igual que en list-expenses, hasta agregar Cognito)
    const userId = 'mock-user-id';

    const expense = await getExpenseById(userId, expenseId);

    if (!expense) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Expense not found' }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ expense }),
    };
  } catch (err) {
    console.error('Error getting expense:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};
