import { NextRequest, NextResponse } from 'next/server';
import { withAuth, applyAuthToResponse } from '@/lib/middleware';
import { sql } from '@/db/client';
import { moderateContent } from '@/lib/aigc';

export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string; videoId: string } }
) {
  try {
    // 验证token
    const result = withAuth(request, 'student');
    if (result instanceof NextResponse) return result;

    const { videoId } = await params;

    // 获取视频评价，包括学生姓名，只显示已审核通过的评论
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
      WHERE vc.video_id = ${videoId} AND vc.status = 'approved'
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

export async function POST(
  request: NextRequest,
  { params }: { params: { courseId: string; videoId: string } }
) {
  try {
    // 验证token
    const result = withAuth(request, 'student');
    if (result instanceof NextResponse) return result;

    const { videoId } = await params;
    const { content, rating } = await request.json();

    // 验证请求数据
    if (!content || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: '评价内容和评分不能为空，且评分必须在1-5之间' }, { status: 400 });
    }

    // 插入评价，初始状态为待审核
    const [comment] = await sql`
      INSERT INTO video_comments (video_id, student_id, content, rating, status)
      VALUES (${videoId}, ${result.decoded.id}, ${content}, ${rating}, 'pending')
      RETURNING id, student_id, content, rating, status, created_at
    `;

    // 异步进行AIGC审核，不阻塞响应
    (async () => {
      try {
        const moderationResult = await moderateContent(content);
        const newStatus = moderationResult.approved ? 'approved' : 'rejected';
        
        await sql`
          UPDATE video_comments 
          SET status = ${newStatus}, updated_at = CURRENT_TIMESTAMP
          WHERE id = ${comment.id}
        `;
        
        console.log(`评论 ${comment.id} 审核完成，状态: ${newStatus}`);
      } catch (error) {
        console.error('AIGC审核失败:', error);
      }
    })();

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
    return applyAuthToResponse(response, result);
  } catch (error) {
    console.error('提交评价失败:', error);
    return NextResponse.json({ error: '提交评价失败' }, { status: 500 });
  }
}
