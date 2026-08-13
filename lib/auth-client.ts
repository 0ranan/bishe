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
