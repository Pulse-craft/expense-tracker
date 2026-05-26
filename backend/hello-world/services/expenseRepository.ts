import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { Expense } from '../types/expense';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.EXPENSES_TABLE_NAME;

export async function saveExpense(expense: Expense): Promise<void> {
    if (!TABLE_NAME) {
        throw new Error('EXPENSES_TABLE_NAME environment variable is not set');
    }

    const item = {
        PK: `USER#${expense.userId}`,
        SK: `EXPENSE#${expense.id}`,
        ...expense,
    };

    await docClient.send(
        new PutCommand({
            TableName: TABLE_NAME,
            Item: item,
        }),
    );
}
