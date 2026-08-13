import { sign, verify, JwtPayload, SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcrypt';

function requireSecret(name: 'JWT_SECRET' | 'REFRESH_SECRET'): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`缺少环境变量 ${name}`);
  }
  return value;
}

const JWT_SECRET = requireSecret('JWT_SECRET');
const REFRESH_SECRET = requireSecret('REFRESH_SECRET');

export type UserType = 'student' | 'teacher';

export interface UserPayload {
  id: string;
  userId: string;
  name: string;
  type: UserType;
  role?: string;
}

/** 只保留业务字段，去掉 verify 带回的 iat/exp，避免再签时与 expiresIn 冲突 */
function toUserPayload(decoded: JwtPayload | UserPayload): UserPayload | null {
  const { id, userId, name, type, role } = decoded as UserPayload;
  if (!id || !userId || !name || (type !== 'student' && type !== 'teacher')) {
    return null;
  }
  const payload: UserPayload = { id, userId, name, type };
  if (role !== undefined) {
    payload.role = role;
  }
  return payload;
}

function signToken(
  user: UserPayload,
  secret: string,
  expiresIn: SignOptions['expiresIn']
): string {
  return sign(toUserPayload(user) ?? user, secret, { expiresIn });
}

/**
 * 生成 Access Token（30 分钟）
 */
export function generateAccessToken(user: UserPayload): string {
  return signToken(user, JWT_SECRET, '30m');
}

/**
 * 生成 Refresh Token（7 天）
 */
export function generateRefreshToken(user: UserPayload): string {
  return signToken(user, REFRESH_SECRET, '7d');
}

/**
 * 验证 Access Token
 */
export function verifyAccessToken(token: string): UserPayload | null {
  try {
    return toUserPayload(verify(token, JWT_SECRET) as JwtPayload);
  } catch {
    return null;
  }
}

/**
 * 验证 Refresh Token
 */
export function verifyRefreshToken(token: string): UserPayload | null {
  try {
    return toUserPayload(verify(token, REFRESH_SECRET) as JwtPayload);
  } catch {
    return null;
  }
}

/**
 * 检查 Access Token 是否即将过期（默认阈值 300 秒）
 */
export function isTokenExpiringSoon(token: string, threshold: number = 300): boolean {
  try {
    const decoded = verify(token, JWT_SECRET, { ignoreExpiration: true }) as JwtPayload;
    const exp = decoded.exp || 0;
    const now = Math.floor(Date.now() / 1000);
    return exp - now < threshold;
  } catch {
    return true;
  }
}

/**
 * 从 Authorization 头中提取 Bearer token
 */
export function extractTokenFromHeader(authorization: string | null): string | null {
  if (!authorization) return null;

  const parts = authorization.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;

  return parts[1];
}

/**
 * 加密密码
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

/**
 * 验证密码
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
