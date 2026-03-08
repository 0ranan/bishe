// 导入必要的库
import { sign, verify } from 'jsonwebtoken';

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
}

/**
 * 生成 Access Token
 * @param user 用户信息
 * @returns Access Token 字符串
 */
export function generateAccessToken(user: UserPayload): string {
  // 设置 token 过期时间为 15 分钟
  const expiresIn = '15m';
  
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
 * 从 Authorization 头中提取 token
 * @param authorization Authorization 头字符串
 * @returns token 字符串或 null
 */
export function extractTokenFromHeader(authorization: string | undefined): string | null {
  if (!authorization) return null;
  
  // 检查是否是 Bearer token
  const parts = authorization.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  
  return parts[1];
}
