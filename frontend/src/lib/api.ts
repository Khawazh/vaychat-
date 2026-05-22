export function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
}

export async function api<T>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, ...init } = options;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const base = getApiUrl();
  let res: Response;
  try {
    res = await fetch(`${base}${path}`, { ...init, headers });
  } catch {
    throw new Error(`Failed to connect to API (${base}). Start backend on this PC.`);
  }

  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new Error(data.error ?? `Server error (${res.status})`);
  return data as T;
}

// Остальные экспорты (authApi, chatsApi и т.д.) остаются без изменений
export const authApi = {
  getDevOtp: (phone: string) =>
    api<{ code: string | null }>(`/api/auth/otp/dev?phone=${encodeURIComponent(phone)}`),
  sendOtp: (phone: string) =>
    api<{ message: string; expiresIn: number }>('/api/auth/otp/send', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    }),
  verifyOtp: (phone: string, code: string, deviceName: string) =>
    api<{
      user: { id: string; phone: string; username?: string; displayName?: string; avatarUrl?: string; bio?: string; status?: string };
      accessToken: string;
      refreshToken: string;
    }>('/api/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ phone, code, deviceName }),
    }),
};

export const chatsApi = {
  list: (token: string) =>
    api<{ chats: Array<Record<string, unknown>> }>('/api/chats', { token }),
  create: (token: string, userId: string) =>
    api<{ chat?: { id: string; title: string } }>('/api/chats/private', {
      method: 'POST',
      token,
      body: JSON.stringify({ userId }),
    }),
  createChannel: (token: string, title: string, description?: string) =>
    api<{ chat?: { id: string; title: string } }>('/api/chats/channel', {
      method: 'POST',
      token,
      body: JSON.stringify({ title, description }),
    }),
  addMember: (token: string, chatId: string, userId: string) =>
    api<{ message: string }>(`/api/chats/${chatId}/members`, {
      method: 'POST',
      token,
      body: JSON.stringify({ userId }),
    }),
  leave: (token: string, chatId: string) =>
    api<{ message: string }>(`/api/chats/${chatId}`, { method: 'DELETE', token }),
};

export const usersApi = {
  list: (token: string) =>
    api<{ users: Array<{ id: string; phone: string; displayName?: string; username?: string; avatarUrl?: string }> }>('/api/users', { token }),
};

export const messagesApi = {
  getHistory: (token: string, chatId: string, cursor?: string, limit = 50) =>
    api<{ messages: Array<{ id: string; content: string; senderId: string; chatId: string; createdAt: string }> }>(
      `/api/messages/${chatId}?cursor=${cursor ?? ''}&limit=${limit}`,
      { token }
    ),
};
