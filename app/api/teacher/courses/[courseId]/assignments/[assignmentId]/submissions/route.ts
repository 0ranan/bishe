import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { sql } from '@/db/client';

// 定义学生作业提交接口
export interface StudentSubmission {
  id: string;
  student_id: string;
  student_name: string;
  content: string;
  submit_time: string;
  score?: number;
  status: string;
}

/**
 * 获取作业的学生提交情况
 * @param request NextRequest 对象
 * @param params 路由参数
 * @returns 学生提交列表
 */
export async function GET(request: NextRequest, { params }: { params: { courseId: string; assignmentId: string } }) {
  try {
    // 验证 token
    const authResult = await withAuth(request, 'teacher');
    if (authResult instanceof NextResponse) return authResult;

    const { assignmentId } = await params;

    // 获取学生提交列表
    const submissionResult = await sql`
      SELECT 
        a.id, 
        a.student_id, 
        s.name as student_name, 
        a.content, 
        a.submit_time, 
        a.score, 
        a.status
      FROM assignments a
      JOIN students s ON a.student_id = s.id
      WHERE a.assignment_topic_id = ${assignmentId}
      ORDER BY a.submit_time DESC
    `;

    const submissions: StudentSubmission[] = submissionResult.map((row: any) => ({
      id: row.id,
      student_id: row.student_id,
      student_name: row.student_name,
      content: row.content,
      submit_time: row.submit_time.toISOString(),
      score: row.score,
      status: row.status
    }));

    return NextResponse.json({ submissions }, { status: 200 });
  } catch (error) {
    console.error('获取学生提交失败:', error);
    return NextResponse.json({ error: '获取学生提交失败' }, { status: 500 });
  }
}

/**
 * 批改作业
 * @param request NextRequest 对象
 * @param params 路由参数
 * @returns 批改结果
 */
export async function PUT(request: NextRequest, { params }: { params: { courseId: string; assignmentId: string } }) {
  try {
    // 验证 token
    const authResult = await withAuth(request, 'teacher');
    if (authResult instanceof NextResponse) return authResult;

    const { assignmentId } = await params;

    // 解析请求体
    const body = await request.json();
    const { submissionId, score, status } = body;

    if (!submissionId || score === undefined) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    // 更新作业批改状态
    await sql`
      UPDATE assignments 
      SET score = ${score}, status = ${status || '已批改'} 
      WHERE id = ${submissionId}
    `;

    return NextResponse.json({ success: true, message: '批改成功' }, { status: 200 });
  } catch (error) {
    console.error('批改作业失败:', error);
    return NextResponse.json({ error: '批改作业失败' }, { status: 500 });
  }
}
