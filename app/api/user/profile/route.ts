// 导入必要的库和工具
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/db/client';
import { withAuth } from '@/lib/middleware';

/**
 * 获取用户信息
 * @param request 请求
 * @returns 用户信息响应
 */
export async function GET(request: NextRequest) {
  try {
    // 验证 token（复用工具：withAuth）
    const authResult = await withAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { decoded } = authResult;

    let userInfo: any;

    // 根据用户类型查询详细信息
    if (decoded.type === 'student') {
      // 查询学生信息及关联的班级
      const students = await sql`
        SELECT 
          s.id,
          s.student_id,
          s.name,
          s.grade,
          s.major,
          s.created_at,
          c.class_id,
          c.class_name
        FROM students s
        LEFT JOIN student_class sc ON s.id = sc.student_id
        LEFT JOIN classes c ON sc.class_id = c.id
        WHERE s.id = ${decoded.id}
        LIMIT 1
      `;

      if (students.length === 0) {
        return NextResponse.json(
          { error: '学生信息不存在' },
          { status: 404 }
        );
      }

      const student = students[0];
      userInfo = {
        type: 'student',
        id: student.student_id,
        name: student.name,
        grade: student.grade,
        major: student.major,
        classId: student.class_id,
        className: student.class_name,
        createdAt: student.created_at
      };
    } else if (decoded.type === 'teacher') {
      // 查询教师信息
      const teachers = await sql`
        SELECT 
          id,
          teacher_id,
          name,
          department,
          title,
          role,
          created_at
        FROM teachers
        WHERE id = ${decoded.id}
        LIMIT 1
      `;

      if (teachers.length === 0) {
        return NextResponse.json(
          { error: '教师信息不存在' },
          { status: 404 }
        );
      }

      const teacher = teachers[0];
      userInfo = {
        type: 'teacher',
        id: teacher.teacher_id,
        name: teacher.name,
        department: teacher.department,
        title: teacher.title,
        role: teacher.role,
        createdAt: teacher.created_at
      };
    } else {
      return NextResponse.json(
        { error: '无效的用户类型' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      user: userInfo,
      ...(authResult.newToken && { newToken: authResult.newToken })
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return NextResponse.json(
      { error: '获取用户信息失败，请稍后重试' },
      { status: 500 }
    );
  }
}
