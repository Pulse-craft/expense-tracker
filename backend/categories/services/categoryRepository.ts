import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  GetCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import { Category } from '../types/category';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.CATEGORIES_TABLE_NAME;

function requireTable(): string {
  if (!TABLE_NAME) {
    throw new Error('CATEGORIES_TABLE_NAME environment variable is not set');
  }
  return TABLE_NAME;
}

export async function saveCategory(category: Category): Promise<void> {
  const table = requireTable();
  const item = {
    PK: `USER#${category.userId}`,
    SK: `CATEGORY#${category.id}`,
    ...category,
  };
  await docClient.send(new PutCommand({ TableName: table, Item: item }));
}

export async function getCategoriesByUser(userId: string): Promise<Category[]> {
  const table = requireTable();
  const result = await docClient.send(
    new QueryCommand({
      TableName: table,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':skPrefix': 'CATEGORY#',
      },
    })
  );
  return (result.Items ?? []).map((item) => {
    const { PK, SK, ...category } = item;
    return category as Category;
  });
}

export async function getCategoryById(
  userId: string,
  categoryId: string
): Promise<Category | null> {
  const table = requireTable();
  const result = await docClient.send(
    new GetCommand({
      TableName: table,
      Key: { PK: `USER#${userId}`, SK: `CATEGORY#${categoryId}` },
    })
  );
  if (!result.Item) {
    return null;
  }
  const { PK, SK, ...category } = result.Item;
  return category as Category;
}

export async function deleteCategory(
  userId: string,
  categoryId: string
): Promise<void> {
  const table = requireTable();
  await docClient.send(
    new DeleteCommand({
      TableName: table,
      Key: { PK: `USER#${userId}`, SK: `CATEGORY#${categoryId}` },
    })
  );
}
