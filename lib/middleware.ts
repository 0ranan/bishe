import { NextRequest, NextResponse } from 'next/server';
import {
  verifyAccessToken,
  extractTokenFromHeader,
  UserType,
  UserPayload,
  isTokenExpiringSoon,
  verifyRefreshToken,
  generateAccessToken,
} from './auth';

/** 鉴权成功时的返回值 */
export type AuthSuccess = {
  decoded: UserPayload;
  newToken?: string;
};

/**
 * 验证请求中的 token 并检查用户类型。
 * 失败返回 NextResponse；成功返回 { decoded, newToken? }。
 * 调用方统一使用：`if (result instanceof NextResponse) return result;`
 */
export async function validateToken(
  request: NextRequest,
  requiredType?: UserType
): Promise<AuthSuccess | NextResponse> {
  const token = extractTokenFromHeader(request.headers.get('Authorization'));

  if (!token) {
    return NextResponse.json({ error: '未提供认证令牌' }, { status: 401 });
  }

  const decoded = verifyAccessToken(token);

  if (!decoded) {
    return NextResponse.json({ error: '无效的认证令牌' }, { status: 401 });
  }

  if (requiredType && decoded.type !== requiredType) {
    return NextResponse.json({ error: '权限不足' }, { status: 403 });
  }

  if (isTokenExpiringSoon(token)) {
    const refreshToken =
      request.headers.get('x-refresh-token') ||
      request.cookies.get('refreshToken')?.value;

    if (refreshToken) {
      try {
        const user = verifyRefreshToken(refreshToken);
        if (user) {
          const newAccessToken = generateAccessToken(user);
          return { decoded, newToken: newAccessToken };
        }
      } catch (error) {
        console.error('自动刷新 token 失败:', error);
      }
    }
  }

  return { decoded };
}

/**
 * API 路由的 token 验证中间件
 */
export async function withAuth(
  request: NextRequest,
  requiredType?: UserType
): Promise<AuthSuccess | NextResponse> {
  return validateToken(request, requiredType);
}
