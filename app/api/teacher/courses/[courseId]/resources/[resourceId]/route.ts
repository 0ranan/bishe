import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/db/client';
import { withAuth } from '@/lib/middleware';

export async function DELETE(request: NextRequest, { params }: { params: { courseId: string; resourceId: string } }) {
  try {
    const courseId = (await params).courseId;
    const resourceId = (await params).resourceId;

    const result = await withAuth(request, 'teacher');
    if (result instanceof NextResponse) return result;

    await sql`
      DELETE FROM course_resources
      WHERE id = ${resourceId}
      AND course_id IN (
        SELECT co.id
        FROM teachers t
        JOIN teacher_class tc ON t.id = tc.teacher_id
        JOIN classes c ON tc.class_id = c.id
        JOIN class_course cc ON c.id = cc.class_id
        JOIN courses co ON cc.course_id = co.id
        WHERE t.teacher_id = ${result.decoded.userId} AND co.course_id = ${courseId}
      )
    `;

    const response = NextResponse.json({
      success: true,
      message: '资源删除成功'
    });

    if (result.newToken) {
      response.headers.set('x-access-token', result.newToken);
    }

    return response;
  } catch (error) {
    console.error('删除课程资源失败:', error);
    return NextResponse.json(
      { error: '删除课程资源失败，请稍后重试' },
      { status: 500 }
    );
  }
}
