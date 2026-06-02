import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

const BUCKET = process.env.RECEIPTS_BUCKET_NAME as string;
const s3 = new S3Client({});

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://main.d1bfigmggittui.amplifyapp.com',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
};

const response = (statusCode: number, body: unknown): APIGatewayProxyResult => ({
  statusCode,
  headers: corsHeaders,
  body: JSON.stringify(body),
});

export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const claims = event.requestContext.authorizer?.claims as Record<string, string> | undefined;
  const userId = claims?.sub;
  if (!userId) {
    return response(401, { error: 'Unauthorized' });
  }

  const method = event.httpMethod;

  // POST /receipts/upload-url -> URL firmada para SUBIR
  if (method === 'POST') {
    let contentType = 'application/octet-stream';
    if (event.body) {
      try {
        const parsed = JSON.parse(event.body) as Record<string, unknown>;
        if (typeof parsed.contentType === 'string' && parsed.contentType.length > 0) {
          contentType = parsed.contentType;
        }
      } catch {
        return response(400, { error: 'Body must be valid JSON' });
      }
    }

    const key = `receipts/${userId}/${randomUUID()}`;
    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: contentType,
    });

    try {
      const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
      return response(200, { uploadUrl, key });
    } catch (err) {
      console.error('Failed to create upload URL', err);
      return response(500, { error: 'Failed to create upload URL' });
    }
  }

  // GET /receipts/view-url?key=... -> URL firmada para VER
  if (method === 'GET') {
    const key = event.queryStringParameters?.key;
    if (!key) {
      return response(400, { error: 'Missing key' });
    }
    // Cada usuario solo puede leer SUS propios recibos.
    if (!key.startsWith(`receipts/${userId}/`)) {
      return response(403, { error: 'Forbidden' });
    }

    const command = new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
    });

    try {
      const viewUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
      return response(200, { viewUrl });
    } catch (err) {
      console.error('Failed to create view URL', err);
      return response(500, { error: 'Failed to create view URL' });
    }
  }

  return response(405, { error: 'Method not allowed' });
};
