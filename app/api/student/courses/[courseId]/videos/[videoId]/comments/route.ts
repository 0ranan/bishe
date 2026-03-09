import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { sql } from '@/db/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string; videoId: string } }
) {
  try {
    // 验证token
    const result = await withAuth(request, 'student');
    if (result instanceof NextResponse) return result;

    const { videoId } = await params;

    // 获取视频评价，包括学生姓名
    const comments = await sql`
      SELECT 
        vc.id, 
        vc.student_id, 
        s.name as student_name, 
        vc.content, 
        vc.rating, 
        vc.created_at
      FROM video_comments vc
      JOIN students s ON vc.student_id = s.id
      WHERE vc.video_id = ${videoId}
      ORDER BY vc.created_at DESC
    `;

    const response = NextResponse.json({ comments });

    // 如果有新的 token，添加到响应头
    if (result.newToken) {
      response.headers.set('x-access-token', result.newToken);
    }

    return response;
  } catch (error) {
    console.error('获取视频评价失败:', error);
    return NextResponse.json({ error: '获取视频评价失败' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { courseId: string; videoId: string } }
) {
  try {
    // 验证token
    const result = await withAuth(request, 'student');
    if (result instanceof NextResponse) return result;

    const { videoId } = await params;
    const { content, rating } = await request.json();

    // 验证请求数据
    if (!content || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: '评价内容和评分不能为空，且评分必须在1-5之间' }, { status: 400 });
    }

    // 插入评价
    const [comment] = await sql`
      INSERT INTO video_comments (video_id, student_id, content, rating)
      VALUES (${videoId}, ${result.decoded.id}, ${content}, ${rating})
      RETURNING id, student_id, content, rating, created_at
    `;

    // 获取学生姓名
    const [student] = await sql`
      SELECT name FROM students WHERE id = ${result.decoded.id}
    `;

    const response = NextResponse.json({
      comment: {
        ...comment,
        student_name: student.name
      }
    });

    // 如果有新的 token，添加到响应头
    if (result.newToken) {
      response.headers.set('x-access-token', result.newToken);
    }

    return response;
  } catch (error) {
    console.error('提交评价失败:', error);
    return NextResponse.json({ error: '提交评价失败' }, { status: 500 });
  }
}
