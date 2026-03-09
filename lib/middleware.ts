import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, extractTokenFromHeader, UserType, isTokenExpiringSoon, verifyRefreshToken, generateAccessToken } from './auth';

/**
 * 验证请求中的 token 并检查用户类型
 * @param request NextRequest 对象
 * @param requiredType 可选的用户类型要求
 * @returns 解码后的用户信息或错误响应
 */
export async function validateToken(request: NextRequest, requiredType?: UserType) {
  // 从请求头中提取 token
  const token = extractTokenFromHeader(request.headers.get('Authorization'));
  
  if (!token) {
    return NextResponse.json({ error: '未提供认证令牌' }, { status: 401 });
  }

  // 验证 token
  const decoded = verifyAccessToken(token);
  
  if (!decoded) {
    return NextResponse.json({ error: '无效的认证令牌' }, { status: 401 });
  }

  // 检查用户类型
  if (requiredType && decoded.type !== requiredType) {
    return NextResponse.json({ error: '权限不足' }, { status: 403 });
  }

  // 检查 token 是否即将过期
  if (isTokenExpiringSoon(token)) {
    // 尝试从请求头或 cookie 中获取 refresh token
    const refreshToken = request.headers.get('x-refresh-token') || request.cookies.get('refreshToken')?.value;
    
    if (refreshToken) {
      try {
        // 直接验证 refresh token 并生成新的 access token
        const user = verifyRefreshToken(refreshToken);
        if (user) {
          // 生成新的 access token
          const newAccessToken = generateAccessToken(user);
          return { decoded, newToken: newAccessToken };
        }
      } catch (error) {
        console.error('自动刷新 token 失败:', error);
        // 刷新失败不影响当前请求，继续使用原有 token
      }
    }
  }

  return { decoded };
}

/**
 * API 路由的 token 验证中间件
 * @param request NextRequest 对象
 * @param requiredType 可选的用户类型要求
 * @returns 解码后的用户信息或错误响应
 */
export async function withAuth(request: NextRequest, requiredType?: UserType) {
  return validateToken(request, requiredType);
}
