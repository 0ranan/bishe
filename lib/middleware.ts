import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, extractTokenFromHeader, UserType } from './auth';

/**
 * 验证请求中的 token 并检查用户类型
 * @param request NextRequest 对象
 * @param requiredType 可选的用户类型要求
 * @returns 解码后的用户信息或错误响应
 */
export function validateToken(request: NextRequest, requiredType?: UserType) {
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

  return decoded;
}

/**
 * API 路由的 token 验证中间件
 * @param request NextRequest 对象
 * @param requiredType 可选的用户类型要求
 * @returns 解码后的用户信息或错误响应
 */
export function withAuth(request: NextRequest, requiredType?: UserType) {
  return validateToken(request, requiredType);
}
