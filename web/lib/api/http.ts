export type ApiError = {
  statusCode: number;
  message: string;
};

export async function apiFetch<T>(url: string, token?: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    let error: ApiError;

    try {
      const data = await response.json();
      error = {
        statusCode: data.statusCode ?? response.status,
        message: data.message ?? 'Request failed',
      };

    } catch {
      error = {
        statusCode: response.status,
        message: 'Request failed',
      };
    }

    throw error;
  }

  return response.json();
}
