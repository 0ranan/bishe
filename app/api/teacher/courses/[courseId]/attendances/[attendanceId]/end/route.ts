import { NextRequest, NextResponse } from 'next/server';
import { endAttendance } from '@/lib/attendance';
import { withAuth } from '@/lib/middleware';

export async function PUT(request: NextRequest, { params }: { params: { courseId: string; attendanceId: string } }) {
  try {
    // 验证 token
    const decoded = withAuth(request, 'teacher');
    if (decoded instanceof NextResponse) return decoded;

    // 在 Next.js 15 中，params 需要 await
    const { courseId, attendanceId } = await params;
    const attendance = await endAttendance(attendanceId);

    return NextResponse.json({ attendance }, { status: 200 });
  } catch (error) {
    console.error('结束签到失败:', error);
    return NextResponse.json({ error: '结束签到失败' }, { status: 500 });
  }
}
