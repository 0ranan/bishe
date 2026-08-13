import { NextRequest, NextResponse } from 'next/server';
import { withAuth, applyAuthToResponse } from '@/lib/middleware';
import { sql } from '@/db/client';

// 定义签到接口
export interface StudentAttendance {
  id: string;
  title: string;
  code: string;
  start_time: string;
  end_time: string;
  status: 'active' | 'ended' | 'missed';
  attended: boolean;
}

/**
 * 获取学生课程的签到记录
 * @param request NextRequest 对象
 * @param params 路由参数
 * @returns 签到记录列表
 */
export async function GET(request: NextRequest, { params }: { params: { courseId: string } }) {
  try {
    // 验证 token
    const authResult = withAuth(request, 'student');
    if (authResult instanceof NextResponse) return authResult;

    const { courseId } = await params;
    const { decoded } = authResult;
    const studentId = decoded.id;

    // 首先获取该课程的UUID
    const courseResult = await sql`
      SELECT id 
      FROM courses 
      WHERE course_id = ${courseId}
    `;

    if (courseResult.length === 0) {
      return NextResponse.json({ error: '课程不存在' }, { status: 404 });
    }

    const courseUuid = courseResult[0].id;

    // 获取学生的签到记录
    const attendanceResult = await sql`
      SELECT 
        ca.id, 
        ca.title, 
        ca.code, 
        ca.start_time, 
        ca.end_time, 
        ca.created_at,
        CASE 
          WHEN ar.id IS NOT NULL THEN true 
          ELSE false 
        END as attended
      FROM course_attendance ca
      LEFT JOIN attendance_records ar ON ca.id = ar.attendance_id AND ar.student_id = ${studentId}
      WHERE ca.course_id = ${courseUuid}
      ORDER BY ca.start_time DESC
    `;

    // 处理签到记录，计算状态
    const attendances: StudentAttendance[] = attendanceResult.map((row: any) => {
      const now = new Date();
      const endTime = new Date(row.end_time);
      let status: 'active' | 'ended' | 'missed' = 'ended';

      if (now < endTime) {
        status = 'active';
      } else if (!row.attended) {
        status = 'missed';
      }

      return {
        id: row.id,
        title: row.title,
        code: row.code,
        start_time: row.start_time.toISOString(),
        end_time: row.end_time.toISOString(),
        status,
        attended: row.attended
      };
    });

    return applyAuthToResponse(
      NextResponse.json({ attendances }, { status: 200 }),
      authResult
    );
  } catch (error) {
    console.error('获取签到记录失败:', error);
    return NextResponse.json({ error: '获取签到记录失败' }, { status: 500 });
  }
}

/**
 * 学生提交签到
 * @param request NextRequest 对象
 * @param params 路由参数
 * @returns 签到结果
 */
export async function POST(request: NextRequest, { params }: { params: { courseId: string } }) {
  try {
    // 验证 token
    const authResult = withAuth(request, 'student');
    if (authResult instanceof NextResponse) return authResult;

    const { courseId } = await params;
    const { decoded } = authResult;
    const studentId = decoded.id;

    // 解析请求体
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json({ error: '缺少签到码' }, { status: 400 });
    }

    // 查找有效的签到记录（使用 UTC 时间）
    const nowDate = new Date();
    const currentTime = new Date(Date.UTC(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate(), nowDate.getHours(), nowDate.getMinutes(), nowDate.getSeconds()));
    const attendanceResult = await sql`
      SELECT id, course_id 
      FROM course_attendance 
      WHERE code = ${code} AND end_time > ${currentTime}
    `;

    if (attendanceResult.length === 0) {
      return NextResponse.json({ error: '无效的签到码或签到已结束' }, { status: 400 });
    }

    const attendance = attendanceResult[0];

    // 检查是否已经签到
    const existingRecord = await sql`
      SELECT id 
      FROM attendance_records 
      WHERE attendance_id = ${attendance.id} AND student_id = ${studentId}
    `;

    if (existingRecord.length > 0) {
      return NextResponse.json({ error: '您已经签到过了' }, { status: 400 });
    }

    // 创建签到记录（使用 UTC 时间）
    const now = new Date();
    const attendanceTime = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds()));
    await sql`
      INSERT INTO attendance_records (attendance_id, course_id, student_id, check_in_time) 
      VALUES (${attendance.id}, ${attendance.course_id}, ${studentId}, ${attendanceTime})
    `;

    return applyAuthToResponse(
      NextResponse.json({ success: true, message: '签到成功' }, { status: 200 }),
      authResult
    );
  } catch (error) {
    console.error('签到失败:', error);
    return NextResponse.json({ error: '签到失败' }, { status: 500 });
  }
}
