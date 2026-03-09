import { sql } from '@/db/client';

// 定义签到接口
export interface Attendance {
  id: string;
  course_id: string;
  title: string;
  code: string;
  start_time: string;
  end_time: string;
  status: 'active' | 'ended';
  total_students: number;
  attended_students: number;
}

// 检查数据库连接状态
async function checkDatabaseConnection() {
  try {
    await sql`SELECT 1`;
    return true;
  } catch (error) {
    console.error('数据库连接失败:', error);
    return false;
  }
}

// 生成随机签到码
function generateAttendanceCode(): string {
  const chars = '0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// 获取教师课程的签到记录
export async function getTeacherCourseAttendances(courseId: string, teacherId: string): Promise<Attendance[]> {
  try {
    // 检查数据库连接
    const isConnected = await checkDatabaseConnection();
    if (!isConnected) {
      throw new Error('数据库连接失败，请检查数据库服务是否运行');
    }

    // 首先获取该课程的UUID，并验证教师是否有权限
    const courseResult = await sql`
      SELECT c.id 
      FROM courses c
      JOIN class_course cc ON c.id = cc.course_id
      JOIN classes cl ON cc.class_id = cl.id
      JOIN teacher_class tc ON cl.id = tc.class_id
      WHERE c.course_id = ${courseId} AND tc.teacher_id = ${teacherId}
    `;

    if (courseResult.length === 0) {
      throw new Error('课程不存在或您无权访问');
    }

    const courseUuid = courseResult[0].id;

    // 首先获取该课程绑定的所有班级
    const classesResult = await sql`
      SELECT class_id 
      FROM class_course 
      WHERE course_id = ${courseUuid}
    `;

    const classIds = classesResult.map((row: any) => row.class_id);
    let totalStudents = 0;

    // 如果有绑定的班级，计算总学生数
    if (classIds.length > 0) {
      const studentsResult = await sql`
        SELECT COUNT(DISTINCT student_id) as count 
        FROM student_class 
        WHERE class_id = ANY(${classIds})
      `;
      totalStudents = studentsResult[0]?.count || 0;
    }

    // 获取签到记录
    const attendanceResult = await sql`
      SELECT 
        id, 
        course_id, 
        title, 
        code, 
        start_time, 
        end_time, 
        created_at 
      FROM course_attendance 
      WHERE course_id = ${courseUuid} 
      ORDER BY start_time DESC
    `;

    // 为每条签到记录计算已签到人数
    const attendances: Attendance[] = await Promise.all(
      attendanceResult.map(async (row: any) => {
        const attendedResult = await sql`
          SELECT COUNT(*) as count 
          FROM attendance_records 
          WHERE attendance_id = ${row.id}
        `;

        return {
          id: row.id,
          course_id: courseId,
          title: row.title,
          code: row.code,
          start_time: row.start_time.toISOString(),
          end_time: row.end_time.toISOString(),
          status: new Date() < new Date(row.end_time) ? 'active' : 'ended',
          total_students: totalStudents,
          attended_students: attendedResult[0]?.count || 0
        };
      })
    );

    return attendances;
  } catch (error) {
    console.error('获取签到记录失败:', error);
    throw error;
  }
}

// 创建新的签到
export async function createAttendance(courseId: string, title: string, duration: number, teacherId: string): Promise<Attendance> {
  try {
    // 检查数据库连接
    const isConnected = await checkDatabaseConnection();
    if (!isConnected) {
      throw new Error('数据库连接失败，请检查数据库服务是否运行');
    }

    // 首先获取该课程的UUID
    const courseResult = await sql`
      SELECT id 
      FROM courses 
      WHERE course_id = ${courseId}
    `;

    if (courseResult.length === 0) {
      throw new Error('课程不存在');
    }

    const courseUuid = courseResult[0].id;

    // 首先获取该课程绑定的所有班级
    const classesResult = await sql`
      SELECT class_id 
      FROM class_course 
      WHERE course_id = ${courseUuid}
    `;

    const classIds = classesResult.map((row: any) => row.class_id);
    let totalStudents = 0;

    // 如果有绑定的班级，计算总学生数
    if (classIds.length > 0) {
      const studentsResult = await sql`
        SELECT COUNT(DISTINCT student_id) as count 
        FROM student_class 
        WHERE class_id = ANY(${classIds})
      `;
      totalStudents = studentsResult[0]?.count || 0;
    }

    // 生成签到码
    const code = generateAttendanceCode();

    // 计算开始和结束时间
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

    // 创建签到记录
    const result = await sql`
      INSERT INTO course_attendance (
        course_id, 
        teacher_id, 
        title, 
        code, 
        start_time, 
        end_time
      ) VALUES (
        ${courseUuid}, 
        ${teacherId}, 
        ${title}, 
        ${code}, 
        ${startTime}, 
        ${endTime}
      ) RETURNING id
    `;

    const attendanceId = result[0].id;

    return {
      id: attendanceId,
      course_id: courseId,
      title: title,
      code: code,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      status: 'active',
      total_students: totalStudents,
      attended_students: 0
    };
  } catch (error) {
    console.error('创建签到失败:', error);
    throw error;
  }
}

// 结束签到
export async function endAttendance(attendanceId: string, teacherId: string): Promise<Attendance> {
  try {
    // 检查数据库连接
    const isConnected = await checkDatabaseConnection();
    if (!isConnected) {
      throw new Error('数据库连接失败，请检查数据库服务是否运行');
    }

    // 获取签到记录，并验证教师是否有权限
    const attendanceResult = await sql`
      SELECT 
        id, 
        course_id, 
        title, 
        code, 
        start_time, 
        end_time 
      FROM course_attendance 
      WHERE id = ${attendanceId} AND teacher_id = ${teacherId}
    `;

    if (attendanceResult.length === 0) {
      throw new Error('签到记录不存在或您无权操作');
    }

    const attendance = attendanceResult[0];

    // 获取课程ID
    const courseResult = await sql`
      SELECT course_id 
      FROM courses 
      WHERE id = ${attendance.course_id}
    `;

    if (courseResult.length === 0) {
      throw new Error('课程不存在');
    }

    const courseId = courseResult[0].course_id;

    // 获取该课程绑定的所有班级
    const classesResult = await sql`
      SELECT class_id 
      FROM class_course 
      WHERE course_id = ${attendance.course_id}
    `;

    const classIds = classesResult.map((row: any) => row.class_id);
    let totalStudents = 0;

    // 如果有绑定的班级，计算总学生数
    if (classIds.length > 0) {
      const studentsResult = await sql`
        SELECT COUNT(DISTINCT student_id) as count 
        FROM student_class 
        WHERE class_id = ANY(${classIds})
      `;
      totalStudents = studentsResult[0]?.count || 0;
    }

    // 计算已签到人数
    const attendedResult = await sql`
      SELECT COUNT(*) as count 
      FROM attendance_records 
      WHERE attendance_id = ${attendanceId}
    `;

    // 更新结束时间为当前时间
    await sql`
      UPDATE course_attendance 
      SET end_time = ${new Date()} 
      WHERE id = ${attendanceId}
    `;

    return {
      id: attendance.id,
      course_id: courseId,
      title: attendance.title,
      code: attendance.code,
      start_time: attendance.start_time.toISOString(),
      end_time: new Date().toISOString(),
      status: 'ended',
      total_students: totalStudents,
      attended_students: attendedResult[0]?.count || 0
    };
  } catch (error) {
    console.error('结束签到失败:', error);
    throw error;
  }
}
