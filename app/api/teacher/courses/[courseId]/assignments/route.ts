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
  submitted_count: number;
  total_count: number;
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
    const authResult = await withAuth(request, 'teacher');
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
        (SELECT COUNT(*) FROM assignments a WHERE a.assignment_topic_id = at.id) as submitted_count,
        (SELECT COUNT(DISTINCT sc.student_id) FROM student_class sc JOIN class_course cc ON sc.class_id = cc.class_id WHERE cc.course_id = ${courseUuid}) as total_count
      FROM assignment_topics at
      JOIN teachers t ON at.teacher_id = t.id
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
      submitted_count: row.submitted_count,
      total_count: row.total_count
    }));

    return NextResponse.json({ assignments }, { status: 200 });
  } catch (error) {
    console.error('获取作业列表失败:', error);
    return NextResponse.json({ error: '获取作业列表失败' }, { status: 500 });
  }
}

/**
 * 创建作业
 * @param request NextRequest 对象
 * @param params 路由参数
 * @returns 创建的作业
 */
export async function POST(request: NextRequest, { params }: { params: { courseId: string } }) {
  try {
    // 验证 token
    const authResult = await withAuth(request, 'teacher');
    if (authResult instanceof NextResponse) return authResult;

    const { courseId } = await params;
    const { decoded } = authResult;
    const teacherId = decoded.id;

    // 解析请求体
    const body = await request.json();
    const { title, content, end_time } = body;

    if (!title || !content || !end_time) {
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

    // 创建作业
    const result = await sql`
      INSERT INTO assignment_topics (course_id, teacher_id, title, content, start_time, end_time, created_at) 
      VALUES (${courseUuid}, ${teacherId}, ${title}, ${content}, ${new Date()}, ${new Date(end_time)}, ${new Date()}) 
      RETURNING id
    `;

    const assignmentId = result[0].id;

    // 获取教师信息
    const teacherResult = await sql`
      SELECT name 
      FROM teachers 
      WHERE id = ${teacherId}
    `;

    const teacherName = teacherResult[0]?.name || '';

    // 获取学生总数
    const studentCountResult = await sql`
      SELECT COUNT(DISTINCT sc.student_id) as count
      FROM student_class sc
      JOIN class_course cc ON sc.class_id = cc.class_id
      WHERE cc.course_id = ${courseUuid}
    `;

    const totalCount = studentCountResult[0]?.count || 0;

    return NextResponse.json({
      id: assignmentId,
      title,
      content,
      start_time: new Date().toISOString(),
      end_time: new Date(end_time).toISOString(),
      teacher_id: teacherId,
      teacher_name: teacherName,
      created_at: new Date().toISOString(),
      submitted_count: 0,
      total_count: totalCount
    }, { status: 201 });
  } catch (error) {
    console.error('创建作业失败:', error);
    return NextResponse.json({ error: '创建作业失败' }, { status: 500 });
  }
}
