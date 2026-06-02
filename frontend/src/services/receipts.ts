import { fetchAuthSession } from 'aws-amplify/auth';

const API_BASE = 'https://34gzk4gdcj.execute-api.us-east-1.amazonaws.com/Prod';

async function authHeader(): Promise<string> {
  const session = await fetchAuthSession();
  const token = session.tokens?.idToken?.toString();
  if (!token) {
    throw new Error('No autenticado');
  }
  return `Bearer ${token}`;
}

// Pide una URL firmada de subida y devuelve { uploadUrl, key }.
export async function getUploadUrl(contentType: string): Promise<{ uploadUrl: string; key: string }> {
  const response = await fetch(`${API_BASE}/receipts/upload-url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: await authHeader(),
    },
    body: JSON.stringify({ contentType }),
  });
  if (!response.ok) {
    throw new Error('No se pudo obtener la URL de subida');
  }
  return response.json();
}

// Sube el archivo directo a S3 con la URL firmada (PUT).
export async function uploadFileToS3(uploadUrl: string, file: File): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
    body: file,
  });
  if (!response.ok) {
    throw new Error('No se pudo subir el archivo a S3');
  }
}

// Pide una URL firmada para VER un recibo.
export async function getViewUrl(key: string): Promise<string> {
  const response = await fetch(`${API_BASE}/receipts/view-url?key=${encodeURIComponent(key)}`, {
    method: 'GET',
    headers: { Authorization: await authHeader() },
  });
  if (!response.ok) {
    throw new Error('No se pudo obtener la URL del recibo');
  }
  const data = await response.json();
  return data.viewUrl;
}
