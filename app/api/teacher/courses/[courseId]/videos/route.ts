// 导入必要的库和工具
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/db/client';
import { withAuth } from '@/lib/middleware';

/**
 * 处理获取课程视频请求
 * @param request 请求对象
 * @param params 路由参数
 * @returns 课程视频列表响应
 */
export async function GET(request: NextRequest, { params }: { params: { courseId: string } }) {
  try {
    const courseId = (await params).courseId;

    // 验证 token
    const result = await withAuth(request, 'teacher');
    if (result instanceof NextResponse) return result;

    // 查询课程视频
    const videos = await sql`
      SELECT cv.id, cv.title, cv.video_url, cv.duration, cv.order_index
      FROM teachers t
      JOIN teacher_class tc ON t.id = tc.teacher_id
      JOIN classes c ON tc.class_id = c.id
      JOIN class_course cc ON c.id = cc.class_id
      JOIN courses co ON cc.course_id = co.id
      JOIN course_videos cv ON co.id = cv.course_id
      WHERE t.teacher_id = ${result.decoded.userId} AND co.course_id = ${courseId}
      ORDER BY cv.order_index
    `;

    // 返回视频列表
    const response = NextResponse.json({
      success: true,
      videos
    });

    // 如果有新的 token，添加到响应头
    if (result.newToken) {
      response.headers.set('x-access-token', result.newToken);
    }

    return response;
  } catch (error) {
    console.error('获取课程视频失败:', error);
    return NextResponse.json(
      { error: '获取课程视频失败，请稍后重试' },
      { status: 500 }
    );
  }
}
