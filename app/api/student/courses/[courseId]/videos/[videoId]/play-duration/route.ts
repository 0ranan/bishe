import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, extractTokenFromHeader } from '@/lib/auth';
import { sql } from '@/db/client';

export async function POST(
  request: NextRequest,
  { params }: { params: { courseId: string; videoId: string } }
) {
  try {
    // 验证token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return NextResponse.json({ error: '无效的token' }, { status: 401 });
    }

    const { videoId } = await params;
    const { duration } = await request.json();

    // 验证请求数据
    if (!duration || duration <= 0) {
      return NextResponse.json({ error: '播放时长必须大于0' }, { status: 400 });
    }

    // 插入播放时长记录
    await sql`
      INSERT INTO video_play_duration (student_id, video_id, duration)
      VALUES (${decoded.userId}, ${videoId}, ${duration})
    `;

    return NextResponse.json({ message: '播放时长记录成功' });
  } catch (error) {
    console.error('记录播放时长失败:', error);
    return NextResponse.json({ error: '记录播放时长失败' }, { status: 500 });
  }
}
