import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { deleteExpense } from './services/expenseRepository';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
};

export const lambdaHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const expenseId = event.pathParameters?.id;

    if (!expenseId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'Missing expense id in path' }),
      };
    }

  // userId comes from the Cognito JWT (sub claim).
  const claims = event.requestContext.authorizer?.claims as Record<string, string> | undefined;
  const userId = claims?.sub;
  if (!userId) {
    return {
      statusCode: 401,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Unauthorized' }),
    };
  }

        await deleteExpense(userId, expenseId);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'Expense deleted' }),
    };

  } catch (err) {
        console.error('Error deleting expense:', err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};
