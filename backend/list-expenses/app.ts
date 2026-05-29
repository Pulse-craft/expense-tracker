import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getExpensesByUser } from './services/expenseRepository';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
};

export const lambdaHandler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
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


  try {
    const expenses = await getExpensesByUser(userId);
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ expenses }),
    };
  } catch (err) {
    console.error('Failed to fetch expenses from DynamoDB', err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Failed to fetch expenses' }),
    };
  }
};
