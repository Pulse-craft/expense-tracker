import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getExpenseById } from './services/expenseRepository';

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

    const expense = await getExpenseById(userId, expenseId);

    if (!expense) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'Expense not found' }),
      };
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ expense }),
    };
  } catch (err) {
    console.error('Error getting expense:', err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};
