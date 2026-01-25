import { apiFetch } from './http';
import type { AuthResponse } from '@/lib/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export async function login(email: string, password: string) {
  return apiFetch<AuthResponse>(`${API_URL}/auth/login`, undefined, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
}

export async function register(email: string, password: string) {
  return apiFetch<AuthResponse>(`${API_URL}/auth/register`, undefined, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
}
