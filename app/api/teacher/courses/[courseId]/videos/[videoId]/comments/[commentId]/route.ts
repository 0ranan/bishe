import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { sql } from '@/db/client';

export async function PUT(
  request: NextRequest,
  { params }: { params: { courseId: string; videoId: string; commentId: string } }
) {
  try {
    // 验证token
    const result = await withAuth(request, 'teacher');
    if (result instanceof NextResponse) return result;

    const { videoId, commentId } = await params;
    const body = await request.json();
    const { status } = body;

    // 验证status值
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: '无效的审核状态' }, { status: 400 });
    }

    // 更新评论状态
    const updatedComments = await sql`
      UPDATE video_comments
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${commentId} AND video_id = ${videoId}
      RETURNING id, status, updated_at
    `;

    if (updatedComments.length === 0) {
      return NextResponse.json({ error: '评论不存在' }, { status: 404 });
    }

    const response = NextResponse.json({ comment: updatedComments[0] });

    // 如果有新的 token，添加到响应头
    if (result.newToken) {
      response.headers.set('x-access-token', result.newToken);
    }

    return response;
  } catch (error) {
    console.error('更新评论状态失败:', error);
    return NextResponse.json({ error: '更新评论状态失败' }, { status: 500 });
  }
}
