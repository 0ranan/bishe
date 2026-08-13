'use client';

export type SessionUser = {
  id: string;
  name: string;
  type: 'student' | 'teacher';
  role?: string | null;
};

export function clearSession(): void {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
}

export function logout(): void {
  clearSession();
  window.location.href = '/';
}

export function readSessionUser(): SessionUser | null {
  const raw = localStorage.getItem('user');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export function getAccessToken(): string | null {
  return localStorage.getItem('accessToken');
}

export function getRefreshToken(): string | null {
  return localStorage.getItem('refreshToken');
}

export function setAccessToken(token: string): void {
  localStorage.setItem('accessToken', token);
}

function applyNewAccessToken(response: Response): void {
  const newToken = response.headers.get('x-access-token');
  if (newToken) {
    setAccessToken(newToken);
  }
}

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      return null;
    }

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const accessToken = data?.tokens?.accessToken as string | undefined;
      if (!accessToken) {
        return null;
      }

      setAccessToken(accessToken);
      return accessToken;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

function buildAuthHeaders(init?: HeadersInit): Headers {
  const headers = new Headers(init);
  const accessToken = getAccessToken();
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }
  const refreshToken = getRefreshToken();
  if (refreshToken) {
    headers.set('x-refresh-token', refreshToken);
  }
  return headers;
}

/**
 * 带鉴权的 fetch：自动附带 access/refresh，落盘 x-access-token；
 * 401 时尝试 refresh 一次并重试原请求；refresh 失败则 logout。
 */
export async function authFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const headers = buildAuthHeaders(init?.headers);
  const response = await fetch(input, { ...init, headers });
  applyNewAccessToken(response);

  if (response.status !== 401) {
    return response;
  }

  const newAccess = await refreshAccessToken();
  if (!newAccess) {
    logout();
    return response;
  }

  const retryHeaders = buildAuthHeaders(init?.headers);
  const retryResponse = await fetch(input, { ...init, headers: retryHeaders });
  applyNewAccessToken(retryResponse);
  return retryResponse;
}
