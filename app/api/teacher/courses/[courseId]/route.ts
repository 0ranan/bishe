// 导入必要的库和工具
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/db/client';
import { verifyAccessToken, extractTokenFromHeader } from '@/lib/auth';

/**
 * 处理获取课程详情请求
 * @param request 请求对象
 * @param params 路由参数
 * @returns 课程详情响应
 */
export async function GET(request: NextRequest, { params }: { params: { courseId: string } }) {
  try {
    const courseId = (await params).courseId;

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

    // 查询课程详情
    const courses = await sql`
      SELECT co.course_id, co.course_name, co.credit
      FROM teachers t
      JOIN teacher_class tc ON t.id = tc.teacher_id
      JOIN classes c ON tc.class_id = c.id
      JOIN class_course cc ON c.id = cc.class_id
      JOIN courses co ON cc.course_id = co.id
      WHERE t.teacher_id = ${user.userId} AND co.course_id = ${courseId}
    `;

    if (courses.length === 0) {
      return NextResponse.json(
        { error: '课程不存在或您无权访问' },
        { status: 404 }
      );
    }

    // 返回课程详情
    return NextResponse.json({
      success: true,
      course: courses[0]
    });
  } catch (error) {
    console.error('获取课程详情失败:', error);
    return NextResponse.json(
      { error: '获取课程详情失败，请稍后重试' },
      { status: 500 }
    );
  }
}
