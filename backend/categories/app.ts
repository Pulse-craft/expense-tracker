import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { randomUUID } from 'crypto';
import {
  saveCategory,
  getCategoriesByUser,
  getCategoryById,
  deleteCategory,
} from './services/categoryRepository';
import { Category } from './types/category';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://main.d1bfigmggittui.amplifyapp.com',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
};

function response(statusCode: number, body: unknown): APIGatewayProxyResult {
  return { statusCode, headers: corsHeaders, body: JSON.stringify(body) };
}

// Generates a stable HSL color from the category name (for custom categories).
function generateColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 65%, 50%)`;
}

export const lambdaHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const claims = event.requestContext.authorizer?.claims as
      | Record<string, string>
      | undefined;
    const userId = claims?.sub;
    if (!userId) {
      return response(401, { error: 'Unauthorized' });
    }

    const method = event.httpMethod;

    // GET /categories -> list the user's custom categories
    if (method === 'GET') {
      const categories = await getCategoriesByUser(userId);
      return response(200, { categories });
    }

    // POST /categories -> create a new custom category
    if (method === 'POST') {
      const data = JSON.parse(event.body ?? '{}') as Record<string, unknown>;
      const name =
        typeof data.name === 'string' ? data.name.trim().toLowerCase() : '';
      if (name.length === 0 || name.length > 30) {
        return response(400, {
          error: 'name must be a non-empty string (max 30 characters)',
        });
      }
      const existing = await getCategoriesByUser(userId);
      if (existing.some((c) => c.name === name)) {
        return response(409, { error: 'category already exists' });
      }
      const category: Category = {
        id: randomUUID(),
        userId,
        name,
        color:
          typeof data.color === 'string' && data.color
            ? data.color
            : generateColor(name),
        createdAt: new Date().toISOString(),
      };
      await saveCategory(category);
      return response(201, { category });
    }

    // PUT /categories/{categoryId} -> rename or recolor a category
    if (method === 'PUT') {
      const categoryId = event.pathParameters?.categoryId;
      if (!categoryId) {
        return response(400, { error: 'Missing category id in path' });
      }
      const existing = await getCategoryById(userId, categoryId);
      if (!existing) {
        return response(404, { error: 'category not found' });
      }
      const data = JSON.parse(event.body ?? '{}') as Record<string, unknown>;
      const updated: Category = {
        ...existing,
        name:
          typeof data.name === 'string' && data.name.trim().length > 0
            ? data.name.trim().toLowerCase()
            : existing.name,
        color:
          typeof data.color === 'string' && data.color
            ? data.color
            : existing.color,
      };
      await saveCategory(updated);
      return response(200, { category: updated });
    }

    // DELETE /categories/{categoryId} -> remove a category
    if (method === 'DELETE') {
      const categoryId = event.pathParameters?.categoryId;
      if (!categoryId) {
        return response(400, { error: 'Missing category id in path' });
      }
      await deleteCategory(userId, categoryId);
      return response(200, { message: 'Category deleted' });
    }

    return response(405, { error: 'Method not allowed' });
  } catch (err) {
    console.error('Error in categories handler:', err);
    return response(500, { message: 'Internal server error' });
  }
};
