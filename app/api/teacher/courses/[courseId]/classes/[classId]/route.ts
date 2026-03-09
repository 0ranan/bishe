// 导入必要的库和工具
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/db/client';
import { withAuth } from '@/lib/middleware';

/**
 * 处理绑定班级到课程请求
 * @param request 请求对象
 * @param params 路由参数
 * @returns 绑定结果响应
 */
export async function POST(request: NextRequest, { params }: { params: { courseId: string, classId: string } }) {
  try {
    const courseId = (await params).courseId;
    const classId = (await params).classId;

    // 验证 token
    const result = await withAuth(request, 'teacher');
    if (result instanceof NextResponse) return result;

    // 获取课程ID
    const course = await sql`
      SELECT id FROM courses WHERE course_id = ${courseId}
    `;

    if (course.length === 0) {
      return NextResponse.json(
        { error: '课程不存在' },
        { status: 404 }
      );
    }

    const courseIdValue = course[0].id;

    // 检查教师是否有权限管理该班级
    const teacherClass = await sql`
      SELECT c.id
      FROM teachers t
      JOIN teacher_class tc ON t.id = tc.teacher_id
      JOIN classes c ON tc.class_id = c.id
      WHERE t.teacher_id = ${result.decoded.userId} AND c.class_id = ${classId}
    `;

    if (teacherClass.length === 0) {
      return NextResponse.json(
        { error: '班级不存在或您无权管理' },
        { status: 404 }
      );
    }

    const classIdValue = teacherClass[0].id;

    // 检查班级是否已经与课程绑定
    const existingBinding = await sql`
      SELECT * FROM class_course WHERE class_id = ${classIdValue} AND course_id = ${courseIdValue}
    `;

    if (existingBinding.length > 0) {
      return NextResponse.json(
        { error: '班级已经与课程绑定' },
        { status: 400 }
      );
    }

    // 绑定班级到课程
    await sql`
      INSERT INTO class_course (class_id, course_id)
      VALUES (${classIdValue}, ${courseIdValue})
    `;

    // 返回成功响应
    const response = NextResponse.json({
      success: true,
      message: '班级绑定成功'
    });

    // 如果有新的 token，添加到响应头
    if (result.newToken) {
      response.headers.set('x-access-token', result.newToken);
    }

    return response;
  } catch (error) {
    console.error('绑定班级失败:', error);
    return NextResponse.json(
      { error: '绑定班级失败，请稍后重试' },
      { status: 500 }
    );
  }
}

/**
 * 处理解绑班级与课程请求
 * @param request 请求对象
 * @param params 路由参数
 * @returns 解绑结果响应
 */
export async function DELETE(request: NextRequest, { params }: { params: { courseId: string, classId: string } }) {
  try {
    const courseId = (await params).courseId;
    const classId = (await params).classId;

    // 验证 token
    const result = await withAuth(request, 'teacher');
    if (result instanceof NextResponse) return result;

    // 获取课程ID
    const course = await sql`
      SELECT id FROM courses WHERE course_id = ${courseId}
    `;

    if (course.length === 0) {
      return NextResponse.json(
        { error: '课程不存在' },
        { status: 404 }
      );
    }

    const courseIdValue = course[0].id;

    // 检查教师是否有权限管理该班级
    const teacherClass = await sql`
      SELECT c.id
      FROM teachers t
      JOIN teacher_class tc ON t.id = tc.teacher_id
      JOIN classes c ON tc.class_id = c.id
      WHERE t.teacher_id = ${result.decoded.userId} AND c.class_id = ${classId}
    `;

    if (teacherClass.length === 0) {
      return NextResponse.json(
        { error: '班级不存在或您无权管理' },
        { status: 404 }
      );
    }

    const classIdValue = teacherClass[0].id;

    // 检查班级是否与课程绑定
    const existingBinding = await sql`
      SELECT * FROM class_course WHERE class_id = ${classIdValue} AND course_id = ${courseIdValue}
    `;

    if (existingBinding.length === 0) {
      return NextResponse.json(
        { error: '班级未与课程绑定' },
        { status: 400 }
      );
    }

    // 解绑班级与课程
    await sql`
      DELETE FROM class_course
      WHERE class_id = ${classIdValue} AND course_id = ${courseIdValue}
    `;

    // 返回成功响应
    const response = NextResponse.json({
      success: true,
      message: '班级解绑成功'
    });

    // 如果有新的 token，添加到响应头
    if (result.newToken) {
      response.headers.set('x-access-token', result.newToken);
    }

    return response;
  } catch (error) {
    console.error('解绑班级失败:', error);
    return NextResponse.json(
      { error: '解绑班级失败，请稍后重试' },
      { status: 500 }
    );
  }
}
