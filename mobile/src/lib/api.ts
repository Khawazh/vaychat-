let apiBase = 'http://192.168.0.11:4000';

export function setApiBase(url: string) {
  apiBase = url.replace(/\/$/, '');
}

export function getApiBase() {
  return apiBase;
}

export async function api<T>(
  path: string,
  init: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, ...rest } = init;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(rest.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${apiBase}${path}`, { ...rest, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? 'Ошибка');
  return data as T;
}
