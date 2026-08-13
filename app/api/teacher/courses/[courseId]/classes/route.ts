// 导入必要的库和工具
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/db/client';
import { withAuth, applyAuthToResponse } from '@/lib/middleware';

/**
 * 处理获取课程班级绑定状态请求
 * @param request 请求对象
 * @param params 路由参数
 * @returns 班级列表响应
 */
export async function GET(request: NextRequest, { params }: { params: { courseId: string } }) {
  try {
    const courseId = (await params).courseId;

    // 验证 token
    const result = withAuth(request, 'teacher');
    if (result instanceof NextResponse) return result;

    // 查询教师的所有班级及其与课程的绑定状态
    const classes = await sql`
      SELECT 
        c.class_id, 
        c.class_name, 
        c.grade,
        CASE 
          WHEN cc.course_id IS NOT NULL THEN true 
          ELSE false 
        END as is_connected
      FROM teachers t
      JOIN teacher_class tc ON t.id = tc.teacher_id
      JOIN classes c ON tc.class_id = c.id
      LEFT JOIN class_course cc ON c.id = cc.class_id AND cc.course_id = (
        SELECT id FROM courses WHERE course_id = ${courseId}
      )
      WHERE t.teacher_id = ${result.decoded.userId}
      ORDER BY c.class_name
    `;

    // 返回班级列表
    const response = NextResponse.json({
      success: true,
      classes
    });

    // 如果有新的 token，添加到响应头
    return applyAuthToResponse(response, result);
  } catch (error) {
    console.error('获取班级列表失败:', error);
    return NextResponse.json(
      { error: '获取班级列表失败，请稍后重试' },
      { status: 500 }
    );
  }
}
