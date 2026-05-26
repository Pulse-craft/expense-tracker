import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getExpensesByUser } from './services/expenseRepository';

export const lambdaHandler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  // For now we use a mock user. Will come from Cognito later.
  const userId = 'mock-user-id';

  try {
    const expenses = await getExpensesByUser(userId);
    return {
      statusCode: 200,
      body: JSON.stringify({ expenses }),
    };
  } catch (err) {
    console.error('Failed to fetch expenses from DynamoDB', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch expenses' }),
    };
  }
};
