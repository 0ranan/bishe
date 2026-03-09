import { NextRequest, NextResponse } from 'next/server';
import { getTeacherCourseAttendances, createAttendance } from '@/lib/attendance';
import { verifyAccessToken,verifyRefreshToken } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: { courseId: string } }) {
  try {
    // 验证 token
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: '未提供认证令牌' }, { status: 401 });
    }

    const decoded = verifyRefreshToken(token);
    if (!decoded || decoded.type !== 'teacher') {
      return NextResponse.json({ error: '无效的认证令牌' }, { status: 401 });
    }

    const { courseId } = params;
    const attendances = await getTeacherCourseAttendances(courseId);

    return NextResponse.json({ attendances }, { status: 200 });
  } catch (error) {
    console.error('获取签到记录失败:', error);
    return NextResponse.json({ error: '获取签到记录失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { courseId: string } }) {
  try {
    // 验证 token
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: '未提供认证令牌' }, { status: 401 });
    }

    const decoded = verifyAccessToken(token);
    if (!decoded || decoded.type !== 'teacher') {
      return NextResponse.json({ error: '无效的认证令牌' }, { status: 401 });
    }

    const { courseId } = params;
    const { title, duration } = await request.json();

    if (!title || !duration) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    const attendance = await createAttendance(courseId, title, duration);

    return NextResponse.json({ attendance }, { status: 201 });
  } catch (error) {
    console.error('创建签到失败:', error);
    return NextResponse.json({ error: '创建签到失败' }, { status: 500 });
  }
}
