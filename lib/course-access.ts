import { sql } from '@/db/client';

export class CourseAccessError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'CourseAccessError';
    this.status = status;
  }
}

/**
 * 校验教师是否通过「教师→班级→课程」链路拥有该课程。
 * @param teacherUserId JWT 中的工号（decoded.userId）
 * @param courseCode 业务课程编号（course_id）
 * @returns 课程 UUID
 */
export async function assertTeacherOwnsCourse(
  teacherUserId: string,
  courseCode: string
): Promise<string> {
  const rows = await sql`
    SELECT co.id
    FROM teachers t
    JOIN teacher_class tc ON t.id = tc.teacher_id
    JOIN classes c ON tc.class_id = c.id
    JOIN class_course cc ON c.id = cc.class_id
    JOIN courses co ON cc.course_id = co.id
    WHERE t.teacher_id = ${teacherUserId} AND co.course_id = ${courseCode}
    LIMIT 1
  `;

  if (rows.length === 0) {
    const exists = await sql`
      SELECT id FROM courses WHERE course_id = ${courseCode} LIMIT 1
    `;
    if (exists.length === 0) {
      throw new CourseAccessError('课程不存在', 404);
    }
    throw new CourseAccessError('权限不足：您无权访问该课程', 403);
  }

  return rows[0].id as string;
}

/**
 * 校验学生是否选修该课程（学生→班级→课程）。
 * @param studentUuid 学生表主键 UUID（decoded.id）
 * @param courseCode 业务课程编号
 * @returns 课程 UUID
 */
export async function assertStudentInCourse(
  studentUuid: string,
  courseCode: string
): Promise<string> {
  const rows = await sql`
    SELECT co.id
    FROM students s
    JOIN student_class sc ON s.id = sc.student_id
    JOIN classes c ON sc.class_id = c.id
    JOIN class_course cc ON c.id = cc.class_id
    JOIN courses co ON cc.course_id = co.id
    WHERE s.id = ${studentUuid} AND co.course_id = ${courseCode}
    LIMIT 1
  `;

  if (rows.length === 0) {
    const exists = await sql`
      SELECT id FROM courses WHERE course_id = ${courseCode} LIMIT 1
    `;
    if (exists.length === 0) {
      throw new CourseAccessError('课程不存在', 404);
    }
    throw new CourseAccessError('权限不足：您未选修该课程', 403);
  }

  return rows[0].id as string;
}
