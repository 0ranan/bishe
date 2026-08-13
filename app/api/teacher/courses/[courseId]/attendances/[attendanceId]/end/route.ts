import { NextRequest, NextResponse } from 'next/server';
import { endAttendance } from '@/lib/attendance';
import { withAuth, applyAuthToResponse } from '@/lib/middleware';

export async function PUT(request: NextRequest, { params }: { params: { courseId: string; attendanceId: string } }) {
  try {
    // 验证 token
    const authResult = withAuth(request, 'teacher');
    if (authResult instanceof NextResponse) return authResult;

    // 在 Next.js 15 中，params 需要 await
    const { attendanceId } = await params;
    const attendance = await endAttendance(attendanceId, authResult.decoded.id);

    const response = NextResponse.json({ attendance }, { status: 200 });
    
    // 如果有新的 token，添加到响应头
    return applyAuthToResponse(response, authResult);
  } catch (error) {
    console.error('结束签到失败:', error);
    return NextResponse.json({ error: '结束签到失败' }, { status: 500 });
  }
}
