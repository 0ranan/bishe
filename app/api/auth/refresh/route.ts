// 导入必要的库和工具
import { NextRequest, NextResponse } from 'next/server';
import { verifyRefreshToken, generateAccessToken } from '@/lib/auth';

// 定义刷新 token 请求体接口
interface RefreshRequest {
  refreshToken: string;
}

/**
 * 处理刷新 token 请求
 * @param request 刷新 token 请求
 * @returns 刷新 token 响应
 */
export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    const body: RefreshRequest = await request.json();
    const { refreshToken } = body;

    // 验证请求参数
    if (!refreshToken) {
      return NextResponse.json(
        { error: '缺少 refresh token' },
        { status: 400 }
      );
    }

    // 验证 refresh token
    const user = verifyRefreshToken(refreshToken);
    if (!user) {
      return NextResponse.json(
        { error: '无效的 refresh token' },
        { status: 401 }
      );
    }

    // 生成新的 access token
    const newAccessToken = generateAccessToken(user);

    // 返回刷新成功响应
    return NextResponse.json({
      success: true,
      tokens: {
        accessToken: newAccessToken
      }
    });
  } catch (error) {
    console.error('刷新 token 失败:', error);
    return NextResponse.json(
      { error: '刷新 token 失败，请稍后重试' },
      { status: 500 }
    );
  }
}
