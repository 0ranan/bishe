// 导入必要的库和工具
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/db/client';
import { verifyAccessToken, extractTokenFromHeader } from '@/lib/auth';

/**
 * 处理获取班级学生列表请求
 * @param request 请求对象
 * @param params 路由参数
 * @returns 学生列表响应
 */
export async function GET(request: NextRequest, { params }: { params: { classId: string } }) {
  try {
    const classId = (await params).classId;

    // 从请求头获取 token
    const authorization = request.headers.get('authorization');
    const token = extractTokenFromHeader(authorization);

    if (!token) {
      return NextResponse.json(
        { error: '缺少访问令牌' },
        { status: 401 }
      );
    }

    // 验证 token
    const user = verifyAccessToken(token);
    if (!user || user.type !== 'teacher') {
      return NextResponse.json(
        { error: '无效的访问令牌' },
        { status: 401 }
      );
    }

    // 查询班级学生列表
    const students = await sql`
      SELECT 
        s.student_id, 
        s.name, 
        s.grade, 
        s.major
      FROM teachers t
      JOIN teacher_class tc ON t.id = tc.teacher_id
      JOIN classes c ON tc.class_id = c.id
      JOIN student_class sc ON c.id = sc.class_id
      JOIN students s ON sc.student_id = s.id
      WHERE t.teacher_id = ${user.userId} AND c.class_id = ${classId}
      ORDER BY s.student_id
    `;

    // 返回学生列表
    return NextResponse.json({
      success: true,
      students
    });
  } catch (error) {
    console.error('获取学生列表失败:', error);
    return NextResponse.json(
      { error: '获取学生列表失败，请稍后重试' },
      { status: 500 }
    );
  }
}
