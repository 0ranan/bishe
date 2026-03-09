import { NextRequest, NextResponse } from 'next/server';
import { endAttendance } from '@/lib/attendance';
import { withAuth } from '@/lib/middleware';

export async function PUT(request: NextRequest, { params }: { params: { courseId: string; attendanceId: string } }) {
  try {
    // 验证 token
    const authResult = await withAuth(request, 'teacher');
    if (authResult instanceof NextResponse) return authResult;

    // 在 Next.js 15 中，params 需要 await
    const { courseId, attendanceId } = await params;
    const attendance = await endAttendance(attendanceId, authResult.decoded.id);

    const response = NextResponse.json({ attendance }, { status: 200 });
    
    // 如果有新的 token，添加到响应头
    if (authResult.newToken) {
      response.headers.set('x-access-token', authResult.newToken);
    }

    return response;
  } catch (error) {
    console.error('结束签到失败:', error);
    return NextResponse.json({ error: '结束签到失败' }, { status: 500 });
  }
}
