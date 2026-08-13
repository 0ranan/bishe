// 导入必要的库和工具
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/db/client';
import { withAuth, applyAuthToResponse } from '@/lib/middleware';

/**
 * 处理获取班级学生列表请求
 * @param request 请求对象
 * @param params 路由参数
 * @returns 学生列表响应
 */
export async function GET(request: NextRequest, { params }: { params: { classId: string } }) {
  try {
    const classId = (await params).classId;

    // 验证 token
    const result = withAuth(request, 'teacher');
    if (result instanceof NextResponse) return result;

    // 查询班级学生列表
    const students = await sql`
      SELECT 
        s.student_id, 
        s.name, 
        s.grade, 
        s.major
      FROM teachers t
      JOIN teacher_class tc ON t.id = tc.teacher_id
      JOIN classes c ON tc.class_id = c.id
      JOIN student_class sc ON c.id = sc.class_id
      JOIN students s ON sc.student_id = s.id
      WHERE t.teacher_id = ${result.decoded.userId} AND c.class_id = ${classId}
      ORDER BY s.student_id
    `;

    // 返回学生列表
    const response = NextResponse.json({
      success: true,
      students
    });

    // 如果有新的 token，添加到响应头
    return applyAuthToResponse(response, result);
  } catch (error) {
    console.error('获取学生列表失败:', error);
    return NextResponse.json(
      { error: '获取学生列表失败，请稍后重试' },
      { status: 500 }
    );
  }
}

/**
 * 处理添加学生到班级请求
 * @param request 请求对象
 * @param params 路由参数
 * @returns 添加结果响应
 */
export async function POST(request: NextRequest, { params }: { params: { classId: string } }) {
  try {
    const classId = (await params).classId;

    // 验证 token
    const result = withAuth(request, 'teacher');
    if (result instanceof NextResponse) return result;

    // 解析请求体
    const body = await request.json();
    const { student_id, name, password, grade, major } = body;

    if (!student_id) {
      return NextResponse.json(
        { error: '学生学号不能为空' },
        { status: 400 }
      );
    }

    // 检查教师是否有权限管理该班级
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

    const studentRow = await sql`
      SELECT id FROM students WHERE student_id = ${student_id}
    `;

    let studentId: string;
    let studentCreated = false;

    if (studentRow.length > 0) {
      studentId = studentRow[0].id;
    } else {
      const pwd = password || student_id;
      const displayName = name || student_id;
      const inserted = await sql`
        INSERT INTO students (student_id, password, name, grade, major)
        VALUES (${student_id}, ${pwd}, ${displayName}, ${grade || null}, ${major || null})
        RETURNING id
      `;
      studentId = inserted[0].id;
      studentCreated = true;
    }

    // 检查学生是否已经在该班级
    const existingRelation = await sql`
      SELECT * FROM student_class WHERE class_id = ${classRecord.id} AND student_id = ${studentId}
    `;

    if (existingRelation.length > 0) {
      return NextResponse.json(
        { error: '学生已经在该班级中' },
        { status: 400 }
      );
    }

    // 添加学生到班级
    await sql`
      INSERT INTO student_class (class_id, student_id)
      VALUES (${classRecord.id}, ${studentId})
    `;

    // 返回成功响应
    const response = NextResponse.json({
      success: true,
      message: '学生添加成功',
      created: studentCreated,
    });

    // 如果有新的 token，添加到响应头
    return applyAuthToResponse(response, result);
  } catch (error) {
    console.error('添加学生失败:', error);
    return NextResponse.json(
      { error: '添加学生失败，请稍后重试' },
      { status: 500 }
    );
  }
}

/**
 * 处理从班级删除学生请求
 * @param request 请求对象
 * @param params 路由参数
 * @returns 删除结果响应
 */
export async function DELETE(request: NextRequest, { params }: { params: { classId: string, studentId: string } }) {
  try {
    const classId = (await params).classId;
    const studentId = (await params).studentId;

    // 验证 token
    const result = withAuth(request, 'teacher');
    if (result instanceof NextResponse) return result;

    // 检查教师是否有权限管理该班级
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

    // 检查学生是否在该班级
    const existingStudent = await sql`
      SELECT sc.*
      FROM student_class sc
      JOIN students s ON sc.student_id = s.id
      WHERE sc.class_id = ${classRecord.id} AND s.student_id = ${studentId}
    `;

    if (existingStudent.length === 0) {
      return NextResponse.json(
        { error: '学生不在该班级中' },
        { status: 404 }
      );
    }

    // 从班级中删除学生
    await sql`
      DELETE FROM student_class
      WHERE class_id = ${classRecord.id} AND student_id = (SELECT id FROM students WHERE student_id = ${studentId})
    `;

    // 返回成功响应
    const response = NextResponse.json({
      success: true,
      message: '学生删除成功'
    });

    // 如果有新的 token，添加到响应头
    return applyAuthToResponse(response, result);
  } catch (error) {
    console.error('删除学生失败:', error);
    return NextResponse.json(
      { error: '删除学生失败，请稍后重试' },
      { status: 500 }
    );
  }
}
