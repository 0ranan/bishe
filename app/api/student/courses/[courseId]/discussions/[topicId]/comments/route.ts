import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { sql } from '@/db/client';
import { moderateContent } from '@/lib/aigc';

// 定义数据库行类型
interface TopicCommentRow {
  id: string;
  topic_id: string;
  student_id: string;
  student_name: string;
  content: string;
  status: string;
  created_at: Date;
}

// 定义评论接口
export interface TopicComment {
  id: string;
  topic_id: string;
  student_id: string;
  student_name: string;
  content: string;
  status?: string;
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

    // 获取评论列表，只显示已审核通过的评论
    const commentResult = await sql`
      SELECT 
        tc.id, 
        tc.topic_id, 
        tc.student_id, 
        s.name as student_name, 
        tc.content, 
        tc.status,
        tc.created_at
      FROM topic_comments tc
      JOIN students s ON tc.student_id = s.id
      WHERE tc.topic_id = ${topicId} AND tc.status = 'approved'
      ORDER BY tc.created_at ASC
    `;

    const comments: TopicComment[] = commentResult.map((row: TopicCommentRow) => ({
      id: row.id,
      topic_id: row.topic_id,
      student_id: row.student_id,
      student_name: row.student_name,
      content: row.content,
      status: row.status,
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

    // 创建评论，初始状态为待审核
    const result = await sql`
      INSERT INTO topic_comments (topic_id, student_id, content, status, created_at) 
      VALUES (${topicId}, ${studentId}, ${content}, 'pending', ${new Date()}) 
      RETURNING id
    `;

    // 异步进行AIGC审核，不阻塞响应
    (async () => {
      try {
        const moderationResult = await moderateContent(content);
        const newStatus = moderationResult.approved ? 'approved' : 'rejected';
        
        await sql`
          UPDATE topic_comments 
          SET status = ${newStatus}, updated_at = CURRENT_TIMESTAMP
          WHERE id = ${result[0].id}
        `;
        
        console.log(`话题评论 ${result[0].id} 审核完成，状态: ${newStatus}`);
      } catch (error) {
        console.error('AIGC审核失败:', error);
      }
    })();

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
