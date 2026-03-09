import { NextRequest, NextResponse } from 'next/server';
import { endAttendance } from '@/lib/attendance';
import { verifyToken } from '@/lib/auth';

export async function PUT(request: NextRequest, { params }: { params: { courseId: string; attendanceId: string } }) {
  try {
    // 验证 token
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: '未提供认证令牌' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.type !== 'teacher') {
      return NextResponse.json({ error: '无效的认证令牌' }, { status: 401 });
    }

    const { courseId, attendanceId } = params;
    const attendance = await endAttendance(attendanceId);

    return NextResponse.json({ attendance }, { status: 200 });
  } catch (error) {
    console.error('结束签到失败:', error);
    return NextResponse.json({ error: '结束签到失败' }, { status: 500 });
  }
}
