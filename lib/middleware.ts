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

function getRefreshTokenFromRequest(request: NextRequest): string | undefined {
  return (
    request.headers.get('x-refresh-token') ||
    request.cookies.get('refreshToken')?.value ||
    undefined
  );
}

function checkRequiredType(
  decoded: UserPayload,
  requiredType?: UserType
): NextResponse | null {
  if (requiredType && decoded.type !== requiredType) {
    return NextResponse.json({ error: '权限不足' }, { status: 403 });
  }
  return null;
}

/**
 * 验证请求中的 token 并检查用户类型。
 * 失败返回 NextResponse；成功返回 { decoded, newToken? }。
 * 调用方统一使用：`if (result instanceof NextResponse) return result;`
 *
 * - access 有效：校验角色；若即将过期且带 refresh → 签发 newToken
 * - access 无效：若 refresh 有效 → 用 refresh payload 作为 decoded 并签发 newToken；否则 401
 */
export function withAuth(
  request: NextRequest,
  requiredType?: UserType
): AuthSuccess | NextResponse {
  const token = extractTokenFromHeader(request.headers.get('Authorization'));

  if (!token) {
    return NextResponse.json({ error: '未提供认证令牌' }, { status: 401 });
  }

  const refreshToken = getRefreshTokenFromRequest(request);
  const decoded = verifyAccessToken(token);

  if (decoded) {
    const forbidden = checkRequiredType(decoded, requiredType);
    if (forbidden) return forbidden;

    if (isTokenExpiringSoon(token) && refreshToken) {
      const refreshUser = verifyRefreshToken(refreshToken);
      if (refreshUser) {
        return { decoded: refreshUser, newToken: generateAccessToken(refreshUser) };
      }
    }

    return { decoded };
  }

  if (refreshToken) {
    const refreshUser = verifyRefreshToken(refreshToken);
    if (refreshUser) {
      const forbidden = checkRequiredType(refreshUser, requiredType);
      if (forbidden) return forbidden;
      return { decoded: refreshUser, newToken: generateAccessToken(refreshUser) };
    }
  }

  return NextResponse.json({ error: '无效的认证令牌' }, { status: 401 });
}

/**
 * 将服务端刷新得到的 access token 写入响应头 x-access-token
 */
export function applyAuthToResponse(
  response: NextResponse,
  auth: AuthSuccess
): NextResponse {
  if (auth.newToken) {
    response.headers.set('x-access-token', auth.newToken);
  }
  return response;
}
