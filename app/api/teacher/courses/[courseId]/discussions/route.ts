import { NextRequest, NextResponse } from 'next/server';
import { withAuth, applyAuthToResponse } from '@/lib/middleware';
import { sql } from '@/db/client';

// 定义讨论接口
export interface DiscussionTopic {
  id: string;
  title: string;
  content: string;
  teacher_id: string;
  teacher_name: string;
  created_at: string;
  comment_count: number;
}

/**
 * 获取课程讨论列表
 * @param request NextRequest 对象
 * @param params 路由参数
 * @returns 讨论列表
 */
export async function GET(request: NextRequest, { params }: { params: { courseId: string } }) {
  try {
    // 验证 token
    const authResult = withAuth(request, 'teacher');
    if (authResult instanceof NextResponse) return authResult;

    const { courseId } = await params;

    // 首先获取该课程的UUID
    const courseResult = await sql`
      SELECT id 
      FROM courses 
      WHERE course_id = ${courseId}
    `;

    if (courseResult.length === 0) {
      return NextResponse.json({ error: '课程不存在' }, { status: 404 });
    }

    const courseUuid = courseResult[0].id;

    // 获取讨论列表
    const discussionResult = await sql`
      SELECT 
        dt.id, 
        dt.title, 
        dt.content, 
        dt.teacher_id, 
        t.name as teacher_name, 
        dt.created_at,
        (SELECT COUNT(*) FROM topic_comments tc WHERE tc.topic_id = dt.id) as comment_count
      FROM discussion_topics dt
      JOIN teachers t ON dt.teacher_id = t.id
      WHERE dt.course_id = ${courseUuid}
      ORDER BY dt.created_at DESC
    `;

    const discussions: DiscussionTopic[] = discussionResult.map((row: any) => ({
      id: row.id,
      title: row.title,
      content: row.content,
      teacher_id: row.teacher_id,
      teacher_name: row.teacher_name,
      created_at: row.created_at.toISOString(),
      comment_count: row.comment_count
    }));

    return applyAuthToResponse(
      NextResponse.json({ discussions }, { status: 200 }),
      authResult
    );
  } catch (error) {
    console.error('获取讨论列表失败:', error);
    return NextResponse.json({ error: '获取讨论列表失败' }, { status: 500 });
  }
}

/**
 * 创建讨论
 * @param request NextRequest 对象
 * @param params 路由参数
 * @returns 创建的讨论
 */
export async function POST(request: NextRequest, { params }: { params: { courseId: string } }) {
  try {
    // 验证 token
    const authResult = withAuth(request, 'teacher');
    if (authResult instanceof NextResponse) return authResult;

    const { courseId } = await params;
    const { decoded } = authResult;
    const teacherId = decoded.id;

    // 解析请求体
    const body = await request.json();
    const { title, content } = body;

    if (!title || !content) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    // 首先获取该课程的UUID
    const courseResult = await sql`
      SELECT id 
      FROM courses 
      WHERE course_id = ${courseId}
    `;

    if (courseResult.length === 0) {
      return NextResponse.json({ error: '课程不存在' }, { status: 404 });
    }

    const courseUuid = courseResult[0].id;

    // 创建讨论
    const result = await sql`
      INSERT INTO discussion_topics (course_id, teacher_id, title, content, created_at) 
      VALUES (${courseUuid}, ${teacherId}, ${title}, ${content}, ${new Date()}) 
      RETURNING id
    `;

    const discussionId = result[0].id;

    // 获取教师信息
    const teacherResult = await sql`
      SELECT name 
      FROM teachers 
      WHERE id = ${teacherId}
    `;

    const teacherName = teacherResult[0]?.name || '';

    return applyAuthToResponse(
      NextResponse.json({
        id: discussionId,
        title,
        content,
        teacher_id: teacherId,
        teacher_name: teacherName,
        created_at: new Date().toISOString(),
        comment_count: 0
      }, { status: 201 }),
      authResult
    );
  } catch (error) {
    console.error('创建讨论失败:', error);
    return NextResponse.json({ error: '创建讨论失败' }, { status: 500 });
  }
}
