// 导入必要的库和工具
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/db/client';
import { withAuth } from '@/lib/middleware';

/**
 * 处理获取课程详情请求
 * @param request 请求对象
 * @param params 路由参数
 * @returns 课程详情响应
 */
export async function GET(request: NextRequest, { params }: { params: { courseId: string } }) {
  try {
    const courseId = (await params).courseId;

    // 验证 token
    const result = await withAuth(request, 'teacher');
    if (result instanceof NextResponse) return result;

    // 查询课程详情
    const courses = await sql`
      SELECT co.course_id, co.course_name, co.credit
      FROM teachers t
      JOIN teacher_class tc ON t.id = tc.teacher_id
      JOIN classes c ON tc.class_id = c.id
      JOIN class_course cc ON c.id = cc.class_id
      JOIN courses co ON cc.course_id = co.id
      WHERE t.teacher_id = ${result.decoded.userId} AND co.course_id = ${courseId}
    `;

    if (courses.length === 0) {
      return NextResponse.json(
        { error: '课程不存在或您无权访问' },
        { status: 404 }
      );
    }

    // 返回课程详情
    const response = NextResponse.json({
      success: true,
      course: courses[0]
    });

    // 如果有新的 token，添加到响应头
    if (result.newToken) {
      response.headers.set('x-access-token', result.newToken);
    }

    return response;
  } catch (error) {
    console.error('获取课程详情失败:', error);
    return NextResponse.json(
      { error: '获取课程详情失败，请稍后重试' },
      { status: 500 }
    );
  }
}
