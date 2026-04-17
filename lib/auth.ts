// 导入必要的库
import { sign, verify, JwtPayload } from 'jsonwebtoken';
import bcrypt from 'bcrypt';

// 从环境变量获取密钥
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'your-refresh-secret-key';

// 定义用户类型
export type UserType = 'student' | 'teacher';

// 定义用户信息接口
export interface UserPayload {
  id: string;
  userId: string;
  name: string;
  type: UserType;
  role?: string;
}

/**
 * 生成 Access Token
 * @param user 用户信息
 * @returns Access Token 字符串
 */
export function generateAccessToken(user: UserPayload): string {
  // 设置 token 过期时间为 30 分钟
  const expiresIn = '30m';
  
  // 生成 token
  return sign(user, JWT_SECRET, { expiresIn });
}

/**
 * 生成 Refresh Token
 * @param user 用户信息
 * @returns Refresh Token 字符串
 */
export function generateRefreshToken(user: UserPayload): string {
  // 设置 refresh token 过期时间为 7 天
  const expiresIn = '7d';
  
  // 生成 refresh token
  return sign(user, REFRESH_SECRET, { expiresIn });
}

/**
 * 验证 Access Token
 * @param token Access Token 字符串
 * @returns 解码后的用户信息或 null
 */
export function verifyAccessToken(token: string): UserPayload | null {
  try {
    // 验证 token
    const decoded = verify(token, JWT_SECRET) as UserPayload;
    return decoded;
  } catch (error) {
    // 验证失败返回 null
    return null;
  }
}

/**
 * 验证 Refresh Token
 * @param token Refresh Token 字符串
 * @returns 解码后的用户信息或 null
 */
export function verifyRefreshToken(token: string): UserPayload | null {
  try {
    // 验证 refresh token
    const decoded = verify(token, REFRESH_SECRET) as UserPayload;
    return decoded;
  } catch (error) {
    // 验证失败返回 null
    return null;
  }
}

/**
 * 检查 Access Token 是否即将过期
 * @param token Access Token 字符串
 * @param threshold 过期阈值（秒），默认 300 秒（5分钟）
 * @returns 是否即将过期
 */
export function isTokenExpiringSoon(token: string, threshold: number = 300): boolean {
  try {
    const decoded = verify(token, JWT_SECRET, { ignoreExpiration: true }) as JwtPayload;
    const exp = decoded.exp || 0;
    const now = Math.floor(Date.now() / 1000);
    return (exp - now) < threshold;
  } catch (error) {
    return true; // 验证失败视为即将过期
  }
}

/**
 * 从 Authorization 头中提取 token
 * @param authorization Authorization 头字符串
 * @returns token 字符串或 null
 */
export function extractTokenFromHeader(authorization: string | null): string | null {
  if (!authorization) return null;
  
  // 检查是否是 Bearer token
  const parts = authorization.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  
  return parts[1];
}

/**
 * 加密密码
 * @param password 明文密码
 * @returns 加密后的密码哈希
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

/**
 * 验证密码
 * @param password 明文密码
 * @param hash 密码哈希
 * @returns 密码是否匹配
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
