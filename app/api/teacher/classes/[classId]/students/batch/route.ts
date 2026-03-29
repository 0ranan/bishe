import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/db/client';
import { withAuth } from '@/lib/middleware';

export async function POST(request: NextRequest, { params }: { params: { classId: string } }) {
  try {
    const classId = (await params).classId;

    const result = await withAuth(request, 'teacher');
    if (result instanceof NextResponse) return result;

    const body = await request.json();
    const { students } = body;

    if (!students || !Array.isArray(students) || students.length === 0) {
      return NextResponse.json(
        { error: '学生数据不能为空' },
        { status: 400 }
      );
    }

    const teacherClasses = await sql`
      SELECT c.id
      FROM teachers t
      JOIN teacher_class tc ON t.id = tc.teacher_id
      JOIN classes c ON tc.class_id = c.id
      WHERE t.teacher_id = ${result.decoded.userId} AND c.class_id = ${classId}
    `;

    if (teacherClasses.length === 0) {
      return NextResponse.json(
        { error: '班级不存在或您无权管理' },
        { status: 404 }
      );
    }

    const classRecord = teacherClasses[0];

    let imported = 0;
    let existed = 0;

    for (const studentData of students) {
      const studentId = studentData.student_id || studentData.studentId;
      const name = studentData.name;
      const password = studentData.password || studentId;
      const grade = studentData.grade;
      const major = studentData.major;

      if (!studentId || !name) {
        continue;
      }

      const existingStudent = await sql`
        SELECT id FROM students WHERE student_id = ${studentId}
      `;

      let studentRecord;

      if (existingStudent.length > 0) {
        studentRecord = existingStudent[0];
        existed++;
      } else {
        const newStudents = await sql`
          INSERT INTO students (student_id, password, name, grade, major)
          VALUES (${studentId}, ${password}, ${name}, ${grade || null}, ${major || null})
          RETURNING id
        `;
        studentRecord = newStudents[0];
        imported++;
      }

      const existingRelation = await sql`
        SELECT * FROM student_class WHERE class_id = ${classRecord.id} AND student_id = ${studentRecord.id}
      `;

      if (existingRelation.length === 0) {
        await sql`
          INSERT INTO student_class (class_id, student_id)
          VALUES (${classRecord.id}, ${studentRecord.id})
        `;
      }
    }

    const response = NextResponse.json({
      success: true,
      imported,
      existed
    });

    if (result.newToken) {
      response.headers.set('x-access-token', result.newToken);
    }

    return response;
  } catch (error) {
    console.error('批量导入学生失败:', error);
    return NextResponse.json(
      { error: '批量导入学生失败，请稍后重试' },
      { status: 500 }
    );
  }
}
