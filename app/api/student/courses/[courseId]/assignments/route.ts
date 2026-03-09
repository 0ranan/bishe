import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { sql } from '@/db/client';

// 定义作业主题接口
export interface AssignmentTopic {
  id: string;
  title: string;
  content: string;
  start_time: string;
  end_time: string;
  teacher_id: string;
  teacher_name: string;
  created_at: string;
  submitted: boolean;
  submitted_time?: string;
  score?: number;
  status?: string;
}

// 定义作业接口
export interface Assignment {
  id: string;
  assignment_topic_id: string;
  student_id: string;
  content: string;
  submit_time: string;
  score?: number;
  status: string;
}

/**
 * 获取课程作业列表
 * @param request NextRequest 对象
 * @param params 路由参数
 * @returns 作业列表
 */
export async function GET(request: NextRequest, { params }: { params: { courseId: string } }) {
  try {
    // 验证 token
    const authResult = await withAuth(request, 'student');
    if (authResult instanceof NextResponse) return authResult;

    const { courseId } = await params;
    const { decoded } = authResult;
    const studentId = decoded.id;

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

    // 获取作业列表
    const assignmentResult = await sql`
      SELECT 
        at.id, 
        at.title, 
        at.content, 
        at.start_time, 
        at.end_time, 
        at.teacher_id, 
        t.name as teacher_name, 
        at.created_at,
        a.id as assignment_id,
        a.submit_time,
        a.score,
        a.status
      FROM assignment_topics at
      JOIN teachers t ON at.teacher_id = t.id
      LEFT JOIN assignments a ON at.id = a.assignment_topic_id AND a.student_id = ${studentId}
      WHERE at.course_id = ${courseUuid}
      ORDER BY at.created_at DESC
    `;

    const assignments: AssignmentTopic[] = assignmentResult.map((row: any) => ({
      id: row.id,
      title: row.title,
      content: row.content,
      start_time: row.start_time.toISOString(),
      end_time: row.end_time.toISOString(),
      teacher_id: row.teacher_id,
      teacher_name: row.teacher_name,
      created_at: row.created_at.toISOString(),
      submitted: !!row.assignment_id,
      submitted_time: row.submit_time ? row.submit_time.toISOString() : undefined,
      score: row.score,
      status: row.status
    }));

    return NextResponse.json({ assignments }, { status: 200 });
  } catch (error) {
    console.error('获取作业列表失败:', error);
    return NextResponse.json({ error: '获取作业列表失败' }, { status: 500 });
  }
}

/**
 * 提交作业
 * @param request NextRequest 对象
 * @param params 路由参数
 * @returns 提交结果
 */
export async function POST(request: NextRequest, { params }: { params: { courseId: string } }) {
  try {
    // 验证 token
    const authResult = await withAuth(request, 'student');
    if (authResult instanceof NextResponse) return authResult;

    const { courseId } = await params;
    const { decoded } = authResult;
    const studentId = decoded.id;

    // 解析请求体
    const body = await request.json();
    const { assignment_topic_id, content } = body;

    if (!assignment_topic_id || !content) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    // 验证作业主题是否存在
    const topicResult = await sql`
      SELECT id, end_time 
      FROM assignment_topics 
      WHERE id = ${assignment_topic_id}
    `;

    if (topicResult.length === 0) {
      return NextResponse.json({ error: '作业主题不存在' }, { status: 404 });
    }

    const topic = topicResult[0];

    // 检查是否超过截止时间
    if (new Date() > new Date(topic.end_time)) {
      return NextResponse.json({ error: '作业已超过截止时间' }, { status: 400 });
    }

    // 检查是否已经提交过
    const existingResult = await sql`
      SELECT id 
      FROM assignments 
      WHERE assignment_topic_id = ${assignment_topic_id} AND student_id = ${studentId}
    `;

    if (existingResult.length > 0) {
      // 更新已提交的作业
      await sql`
        UPDATE assignments 
        SET content = ${content}, submit_time = ${new Date()}, status = '已提交' 
        WHERE assignment_topic_id = ${assignment_topic_id} AND student_id = ${studentId}
      `;
    } else {
      // 创建新的作业
      await sql`
        INSERT INTO assignments (assignment_topic_id, student_id, content, submit_time, status) 
        VALUES (${assignment_topic_id}, ${studentId}, ${content}, ${new Date()}, '已提交')
      `;
    }

    return NextResponse.json({ success: true, message: '作业提交成功' }, { status: 200 });
  } catch (error) {
    console.error('提交作业失败:', error);
    return NextResponse.json({ error: '提交作业失败' }, { status: 500 });
  }
}
