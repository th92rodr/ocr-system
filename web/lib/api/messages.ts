import { apiFetch } from './http';
import type { Message } from '@/lib/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export async function fetchMessages(documentId:string, token: string): Promise<Message[]> {
  return apiFetch<Message[]>(`${API_URL}/documents/${documentId}/messages`, token);
}

export async function sendMessage(documentId: string, content: string, token: string): Promise<Message> {
  return apiFetch(`${API_URL}/documents/${documentId}/messages`, token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
}
