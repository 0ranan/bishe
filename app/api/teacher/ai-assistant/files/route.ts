import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/db/client';
import { withAuth, applyAuthToResponse } from '@/lib/middleware';

// 获取已上传的文件列表
export async function GET(request: NextRequest) {
  try {
    // 验证 token
    const result = withAuth(request, 'teacher');
    if (result instanceof NextResponse) return result;

    const courseId = request.nextUrl.searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json({ error: '课程ID不能为空' }, { status: 400 });
    }

    // 查询数据库获取文件列表
    const files = await sql`
      SELECT 
        af.id, 
        af.file_name, 
        af.file_type, 
        af.file_size, 
        af.created_at
      FROM 
        ai_teaching_assistant_files af
      JOIN 
        teachers t ON af.teacher_id = t.id
      JOIN 
        courses c ON af.course_id = c.id
      WHERE 
        t.teacher_id = ${result.decoded.userId} AND 
        c.course_id = ${courseId}
      ORDER BY 
        af.created_at DESC
    `;

    return applyAuthToResponse(
      NextResponse.json({
        success: true,
        files
      }),
      result
    );
  } catch (error) {
    console.error('获取文件列表失败:', error);
    return NextResponse.json({ error: '获取文件列表失败' }, { status: 500 });
  }
}
