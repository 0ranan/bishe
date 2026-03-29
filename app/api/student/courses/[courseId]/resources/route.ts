import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/db/client';
import { withAuth } from '@/lib/middleware';

export async function GET(request: NextRequest, { params }: { params: { courseId: string } }) {
  try {
    const courseId = (await params).courseId;

    const result = await withAuth(request, 'student');
    if (result instanceof NextResponse) return result;

    const resources = await sql`
      SELECT cr.id, cr.title, cr.resource_url, cr.description, cr.resource_type, cr.created_at, t.name as teacher_name
      FROM students s
      JOIN student_class sc ON s.id = sc.student_id
      JOIN classes c ON sc.class_id = c.id
      JOIN class_course cc ON c.id = cc.class_id
      JOIN courses co ON cc.course_id = co.id
      JOIN course_resources cr ON co.id = cr.course_id
      JOIN teachers t ON cr.teacher_id = t.id
      WHERE s.student_id = ${result.decoded.userId} AND co.course_id = ${courseId}
      ORDER BY cr.created_at DESC
    `;

    const response = NextResponse.json({
      success: true,
      resources
    });

    if (result.newToken) {
      response.headers.set('x-access-token', result.newToken);
    }

    return response;
  } catch (error) {
    console.error('获取课程资源失败:', error);
    return NextResponse.json(
      { error: '获取课程资源失败，请稍后重试' },
      { status: 500 }
    );
  }
}
