import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, extractTokenFromHeader, UserType, isTokenExpiringSoon } from './auth';

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
        // 调用 refresh token API 刷新 access token
        const response = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.tokens.accessToken) {
            // 将新的 access token 添加到响应头
            const nextResponse = NextResponse.next();
            nextResponse.headers.set('x-access-token', data.tokens.accessToken);
            return { decoded, newToken: data.tokens.accessToken };
          }
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
