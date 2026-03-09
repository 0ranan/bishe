// 导入必要的库和工具
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/db/client';
import { verifyAccessToken, extractTokenFromHeader } from '@/lib/auth';

/**
 * 处理获取教师班级请求
 * @param request 请求对象
 * @returns 班级列表响应
 */
export async function GET(request: NextRequest) {
  try {
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

    // 查询教师教授的班级
    const classes = await sql`
      SELECT 
        c.class_id, 
        c.class_name, 
        c.grade,
        COUNT(sc.student_id) as student_count
      FROM teachers t
      JOIN teacher_class tc ON t.id = tc.teacher_id
      JOIN classes c ON tc.class_id = c.id
      LEFT JOIN student_class sc ON c.id = sc.class_id
      WHERE t.teacher_id = ${user.userId}
      GROUP BY c.class_id, c.class_name, c.grade
      ORDER BY c.class_name
    `;

    // 返回班级列表
    return NextResponse.json({
      success: true,
      classes
    });
  } catch (error) {
    console.error('获取班级失败:', error);
    return NextResponse.json(
      { error: '获取班级失败，请稍后重试' },
      { status: 500 }
    );
  }
}
