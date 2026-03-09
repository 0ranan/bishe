import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { sql } from '@/db/client';

// 定义评论接口
export interface TopicComment {
  id: string;
  topic_id: string;
  student_id: string;
  student_name: string;
  content: string;
  created_at: string;
}

/**
 * 获取讨论的评论列表
 * @param request NextRequest 对象
 * @param params 路由参数
 * @returns 评论列表
 */
export async function GET(request: NextRequest, { params }: { params: { courseId: string, topicId: string } }) {
  try {
    // 验证 token
    const authResult = await withAuth(request, 'student');
    if (authResult instanceof NextResponse) return authResult;

    const { topicId } = await params;

    // 获取评论列表
    const commentResult = await sql`
      SELECT 
        tc.id, 
        tc.topic_id, 
        tc.student_id, 
        s.name as student_name, 
        tc.content, 
        tc.created_at
      FROM topic_comments tc
      JOIN students s ON tc.student_id = s.id
      WHERE tc.topic_id = ${topicId}
      ORDER BY tc.created_at ASC
    `;

    const comments: TopicComment[] = commentResult.map((row: any) => ({
      id: row.id,
      topic_id: row.topic_id,
      student_id: row.student_id,
      student_name: row.student_name,
      content: row.content,
      created_at: row.created_at.toISOString()
    }));

    return NextResponse.json({ comments }, { status: 200 });
  } catch (error) {
    console.error('获取评论列表失败:', error);
    return NextResponse.json({ error: '获取评论列表失败' }, { status: 500 });
  }
}

/**
 * 提交评论
 * @param request NextRequest 对象
 * @param params 路由参数
 * @returns 评论结果
 */
export async function POST(request: NextRequest, { params }: { params: { courseId: string, topicId: string } }) {
  try {
    // 验证 token
    const authResult = await withAuth(request, 'student');
    if (authResult instanceof NextResponse) return authResult;

    const { topicId } = await params;
    const { decoded } = authResult;
    const studentId = decoded.id;

    // 解析请求体
    const body = await request.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json({ error: '评论内容不能为空' }, { status: 400 });
    }

    // 验证讨论主题是否存在
    const topicResult = await sql`
      SELECT id 
      FROM discussion_topics 
      WHERE id = ${topicId}
    `;

    if (topicResult.length === 0) {
      return NextResponse.json({ error: '讨论主题不存在' }, { status: 404 });
    }

    // 创建评论
    const result = await sql`
      INSERT INTO topic_comments (topic_id, student_id, content, created_at) 
      VALUES (${topicId}, ${studentId}, ${content}, ${new Date()}) 
      RETURNING id
    `;

    const commentId = result[0].id;

    // 获取学生信息
    const studentResult = await sql`
      SELECT name 
      FROM students 
      WHERE id = ${studentId}
    `;

    const studentName = studentResult[0]?.name || '';

    return NextResponse.json({
      id: commentId,
      topic_id: topicId,
      student_id: studentId,
      student_name: studentName,
      content,
      created_at: new Date().toISOString()
    }, { status: 201 });
  } catch (error) {
    console.error('提交评论失败:', error);
    return NextResponse.json({ error: '提交评论失败' }, { status: 500 });
  }
}
