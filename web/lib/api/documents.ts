import { apiFetch } from './http';
import type { Document } from '@/lib/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export async function fetchDocuments(token: string): Promise<Document[]> {
  return apiFetch<Document[]>(`${API_URL}/documents`, token);
}

export async function uploadDocument(file: File, token: string): Promise<Document> {
  const formData = new FormData();
  formData.append('file', file);

  return apiFetch<Document>(`${API_URL}/documents/upload`, token, {
    method: 'POST',
    body: formData,
  });
}

export async function downloadDocument(documentId: string, token: string) {
  const response = await fetch(`${API_URL}/documents/${documentId}/download`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const blob = await response.blob();

  const contentDisposition = response.headers.get('Content-Disposition');
  let filename = 'document';

  if (contentDisposition) {
    const match = contentDisposition.match(/filename="?(.+)"?/);
    if (match?.[1]) filename = match[1];
  }

  return { blob, filename };
}
