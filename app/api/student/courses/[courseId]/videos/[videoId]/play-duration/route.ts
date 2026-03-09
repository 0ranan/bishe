import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { sql } from '@/db/client';

export async function POST(
  request: NextRequest,
  { params }: { params: { courseId: string; videoId: string } }
) {
  try {
    // 验证token
    const result = await withAuth(request, 'student');
    if (result instanceof NextResponse) return result;

    const { videoId } = await params;
    const { duration } = await request.json();

    // 验证请求数据
    if (!duration || duration <= 0) {
      return NextResponse.json({ error: '播放时长必须大于0' }, { status: 400 });
    }

    // 插入播放时长记录
    await sql`
      INSERT INTO video_play_duration (student_id, video_id, duration)
      VALUES (${result.decoded.id}, ${videoId}, ${duration})
    `;

    const response = NextResponse.json({ message: '播放时长记录成功' });

    // 如果有新的 token，添加到响应头
    if (result.newToken) {
      response.headers.set('x-access-token', result.newToken);
    }

    return response;
  } catch (error) {
    console.error('记录播放时长失败:', error);
    return NextResponse.json({ error: '记录播放时长失败' }, { status: 500 });
  }
}
