import { NextRequest, NextResponse } from 'next/server';
import { getTeacherCourseAttendances, createAttendance } from '@/lib/attendance';
import { withAuth, applyAuthToResponse } from '@/lib/middleware';

export async function GET(request: NextRequest, { params }: { params: { courseId: string } }) {
  try {
    // 验证 token
    const authResult = withAuth(request, 'teacher');
    if (authResult instanceof NextResponse) return authResult;

    // 在 Next.js 15 中，params 需要 await
    const { courseId } = await params;
    const attendances = await getTeacherCourseAttendances(courseId, authResult.decoded.id);

    const response = NextResponse.json({ attendances }, { status: 200 });
    
    // 如果有新的 token，添加到响应头
    return applyAuthToResponse(response, authResult);
  } catch (error) {
    console.error('获取签到记录失败:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : '获取签到记录失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { courseId: string } }) {
  try {
    // 验证 token
    const authResult = withAuth(request, 'teacher');
    if (authResult instanceof NextResponse) return authResult;

    // 在 Next.js 15 中，params 需要 await
    const { courseId } = await params;
    const { title, duration } = await request.json();

    if (!title || !duration) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    const attendance = await createAttendance(courseId, title, duration, authResult.decoded.id);

    const response = NextResponse.json({ attendance }, { status: 201 });
    
    // 如果有新的 token，添加到响应头
    return applyAuthToResponse(response, authResult);
  } catch (error) {
    console.error('创建签到失败:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : '创建签到失败' }, { status: 500 });
  }
}
