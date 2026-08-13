import { NextRequest, NextResponse } from 'next/server';
import { withAuth, applyAuthToResponse } from '@/lib/middleware';
import { sql } from '@/db/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string; videoId: string } }
) {
  try {
    // 验证token
    const result = withAuth(request, 'teacher');
    if (result instanceof NextResponse) return result;

    const { videoId } = await params;

    // 获取视频评价，包括学生姓名，教师可以看到所有状态的评论
    const comments = await sql`
      SELECT 
        vc.id, 
        vc.student_id, 
        s.name as student_name, 
        vc.content, 
        vc.rating, 
        vc.status,
        vc.created_at
      FROM video_comments vc
      JOIN students s ON vc.student_id = s.id
      WHERE vc.video_id = ${videoId}
      ORDER BY vc.created_at DESC
    `;

    const response = NextResponse.json({ comments });

    // 如果有新的 token，添加到响应头
    return applyAuthToResponse(response, result);
  } catch (error) {
    console.error('获取视频评价失败:', error);
    return NextResponse.json({ error: '获取视频评价失败' }, { status: 500 });
  }
}
